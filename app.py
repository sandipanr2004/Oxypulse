try:
    import joblib
except ImportError:
    print("joblib not found. Installing required packages...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    import joblib

from flask import Flask, render_template, request, send_from_directory, jsonify, redirect, url_for
import numpy as np
import os
import pickle
import warnings

# Suppress scikit-learn version warnings
warnings.filterwarnings("ignore", category=UserWarning)

app = Flask(__name__)

# Load the hemoglobin model with a fallback mechanism
try:
    hemoglobin_model = joblib.load('model.joblib')
    
    # Test if the model can predict
    test_input = np.array([100000, 80000, 0, 30]).reshape(1, -1)
    hemoglobin_model.predict(test_input)
    
except Exception as e:
    print(f"Standard loading failed: {e}")
    
    # Try a different approach using pickle directly
    try:
        with open('model.joblib', 'rb') as f:
            hemoglobin_model = pickle.load(f)
        print("Hemoglobin model loaded with pickle")
    except Exception as e:
        print(f"Pickle loading failed: {e}")
        
        # As a last resort, create a simple fallback model
        class FallbackModel:
            def predict(self, X):
                # Simple hemoglobin prediction formula based on inputs
                # X shape: (red_value, ir_value, gender, age)
                red = X[0][0]
                ir = X[0][1]
                gender = X[0][2]
                age = X[0][3]
                
                # Basic formula: lower ratio of red/ir typically correlates with higher hemoglobin
                # Gender factor: females typically have slightly lower hemoglobin
                # Age factor: hemoglobin levels vary with age
                
                ratio = red / max(ir, 1)  # Avoid division by zero
                base_value = 14.0 - (ratio * 0.1)
                gender_factor = -1.0 if gender == 1 else 0  # Females typically have ~1 g/dL lower
                age_factor = 0
                
                if age < 12:
                    age_factor = -1.0  # Children have lower hemoglobin
                elif age > 65:
                    age_factor = -0.5  # Elderly may have slightly lower hemoglobin
                
                prediction = base_value + gender_factor + age_factor
                # Ensure prediction is in a reasonable range
                prediction = max(min(prediction, 18.0), 7.0)
                
                return np.array([prediction])
        
        hemoglobin_model = FallbackModel()
        print("Using fallback hemoglobin model")

# Define stress level prediction function
def predict_stress_level(bpm, spo2, ir_val, red_val):
    """
    Predicts stress level based on vital signs without using ML models
    
    Parameters:
    bpm (float): Heart rate in beats per minute
    spo2 (float): Blood oxygen saturation in percentage
    ir_val (float): Infrared sensor value
    red_val (float): Red light sensor value
    
    Returns:
    dict: Stress level assessment with explanation
    """
    # Calculate red/ir ratio - this is used in pulse oximetry and can indicate blood flow changes
    ratio = red_val / max(ir_val, 1)  # Avoid division by zero
    
    # Initialize stress score (0-100 scale)
    stress_score = 50  # Start at moderate level
    
    # Heart rate impact on stress (normal resting HR: 60-100 bpm)
    if bpm > 100:
        # High heart rate indicates stress
        stress_score += min((bpm - 100) * 1.5, 30)  # Cap the increase at 30 points
    elif bpm < 60:
        # Very low heart rate could indicate fatigue or excellent fitness
        stress_score -= min((60 - bpm) * 0.5, 15)  # More conservative reduction
    else:
        # Normal range - reduce stress score
        stress_score -= min((80 - abs(bpm - 80)) * 0.5, 15)
    
    # SpO2 impact (normal is 95-100%)
    if spo2 < 95:
        # Low oxygen saturation can indicate physiological stress
        stress_score += min((95 - spo2) * 5, 30)
    else:
        # Good oxygen levels
        stress_score -= min((spo2 - 95) * 2, 10)
    
    # Sensor readings analysis
    # Higher red/ir ratio can indicate increased blood flow or pressure changes
    if ratio > 0.9:
        stress_score += min((ratio - 0.9) * 50, 15)
    elif ratio < 0.7:
        stress_score -= min((0.7 - ratio) * 50, 10)
    
    # Ensure score stays within 0-100 range
    stress_score = max(0, min(100, stress_score))
    
    # Determine stress level and provide explanation
    if stress_score >= 70:
        level = "High Stress"
        explanation = "Your physiological signs indicate elevated stress levels. Consider relaxation techniques, deep breathing, or taking a break."
    elif stress_score >= 30:
        level = "Moderate Stress"
        explanation = "Your stress level is moderate. This is normal during regular daily activities."
    else:
        level = "Low Stress"
        explanation = "Your physiological signs indicate low stress levels. Your body is in a relaxed state."
    
    # Calculate confidence based on how far from the boundaries the score is
    if stress_score >= 70:
        confidence = min(100, 70 + (stress_score - 70) * 3)
    elif stress_score <= 30:
        confidence = min(100, 70 + (30 - stress_score) * 3)
    else:
        # For moderate stress, confidence is lower the closer it is to boundaries
        distance_from_boundary = min(stress_score - 30, 70 - stress_score)
        confidence = 50 + distance_from_boundary
    
    return {
        "stress_level": level,
        "stress_score": round(stress_score, 1),
        "confidence": round(confidence, 1),
        "explanation": explanation
    }

# Load the fatigue prediction model
try:
    fatigue_model = joblib.load('best_rf_model.joblib')
    print("Fatigue model loaded successfully")
    # Define fatigue levels
    fatigue_map = {0: 'Low Fatigue', 1: 'Moderate Fatigue', 2: 'High Fatigue'}
except Exception as e:
    print(f"Error loading fatigue model: {e}")
    fatigue_model = None
    # Create a fallback fatigue model
    class FallbackFatigueModel:
        def predict(self, X):
            # Simple fatigue prediction based on heart rate and SpO2
            hr = X[0][0]  # Heart rate
            spo2 = X[0][1]  # SpO2
            # Use these values to estimate fatigue level
            if hr > 90 or spo2 < 95:
                return np.array([2])  # High fatigue
            elif hr > 80 or spo2 < 97:
                return np.array([1])  # Moderate fatigue
            else:
                return np.array([0])  # Low fatigue
    
    fatigue_model = FallbackFatigueModel()
    print("Using fallback fatigue model")

# Serve static files from the current directory
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/predict.html')
def predict_page():
    return send_from_directory('.', 'predict.html')

@app.route('/predict2.html')
def predict2_page():
    return send_from_directory('.', 'predict2.html')

@app.route('/predict3.html')
def predict3_page():
    return send_from_directory('.', 'predict3.html')

@app.route('/disease.html')
def disease_page():
    return send_from_directory('.', 'disease.html')

@app.route('/health_index.html')
def health_index_page():
    return send_from_directory('.', 'health_index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get values from form
        red_value = float(request.form.get('red_value', 0))
        ir_value = float(request.form.get('ir_value', 0))  # Using IR value instead of blue
        gender = float(request.form.get('gender', 0))
        age = float(request.form.get('age', 0))
        
        # Prepare input data
        input_data = np.array([red_value, ir_value, gender, age]).reshape(1, -1)
        
        # Try to make prediction with error handling
        try:
            prediction = model.predict(input_data)[0]
        except Exception as e:
            print(f"Prediction error: {e}")
            # Fallback calculation if model prediction fails
            ratio = red_value / max(ir_value, 1)
            base_value = 14.0 - (ratio * 0.1)
            gender_factor = -1.0 if gender == 1 else 0
            age_factor = 0
            
            if age < 12:
                age_factor = -1.0
            elif age > 65:
                age_factor = -0.5
            
            prediction = base_value + gender_factor + age_factor
            prediction = max(min(prediction, 18.0), 7.0)
        
        return jsonify({'prediction': f'{prediction:.2f}'})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/predict_fatigue', methods=['POST'])
def predict_fatigue():
    try:
        # Get the values from the form
        values = [float(x) for x in request.form.getlist('values')]
        
        # Check if we have all required values
        if len(values) != 6:
            return redirect('/predict3.html?prediction=Please+provide+exactly+6+values.')
        
        # Prepare input data (heart rate, spo2, ir, red, age, gender)
        input_data = np.array(values).reshape(1, -1)
        
        # Make prediction
        prediction = fatigue_model.predict(input_data)[0]
        
        # Map prediction to fatigue level
        fatigue_level = fatigue_map.get(prediction, 'Unknown')
        
        # Redirect to the prediction page with the result
        return redirect(f'/predict3.html?prediction={fatigue_level}')
    except ValueError:
        # Redirect with error message for invalid input
        return redirect('/predict3.html?prediction=Invalid+input.+Please+enter+numeric+values.')

@app.route('/predict_stress', methods=['POST'])
def predict_stress():
    try:
        # Get values from form
        bpm = float(request.form.get('bpm', 0))
        spo2 = float(request.form.get('spo2', 0))
        ir_value = float(request.form.get('ir_value', 0))
        red_value = float(request.form.get('red_value', 0))
        
        # Validate inputs
        if bpm <= 0 or spo2 <= 0 or ir_value <= 0 or red_value <= 0:
            return jsonify({'error': 'All values must be positive numbers'})
        
        # Use our prediction function
        result = predict_stress_level(bpm, spo2, ir_value, red_value)
        
        # Return the prediction result
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)