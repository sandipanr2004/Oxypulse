// Import the getUserProfile function from user-profile.js
import { getUserProfile } from "./user-profile.js";

document.addEventListener("DOMContentLoaded", () => {
  // Form elements
  const form = document.getElementById("prediction-form");
  const redValueDisplay = document.getElementById("red-value-display");
  const irValueDisplay = document.getElementById("ir-value-display");
  const redValueInput = document.getElementById("red-value-input");
  const irValueInput = document.getElementById("ir-value-input");
  const predictionResult = document.getElementById("prediction-result");
  const predictionValue = document.getElementById("prediction-value");
  const ageField = document.getElementById("age");
  const genderField = document.getElementById("gender");

  // Get user profile data for auto-populating fields
  if (ageField && genderField) {
    // Get user profile data
    const userProfile = getUserProfile();

    if (userProfile) {
      console.log("Auto-populating from user profile:", userProfile);

      // Set age if available in profile
      if (userProfile.age) {
        ageField.value = userProfile.age;
      }

      // Set gender if available in profile
      if (userProfile.gender) {
        // Map gender values to select options
        // Options are: "0" for male, "1" for female
        switch (userProfile.gender.toLowerCase()) {
          case "male":
            genderField.value = "0";
            break;
          case "female":
            genderField.value = "1";
            break;
          default:
            // Default to no selection or male
            genderField.value = "0";
        }
      }
    } else {
      console.log("No user profile found, using default values");
      // Set default values if user profile doesn't exist
      if (!ageField.value) {
        ageField.value = "30";
      }

      if (!genderField.value) {
        genderField.value = "0";
      }
    }
  }

  // Function to check if values are available in localStorage
  function updateSensorValues() {
    let redValue = localStorage.getItem("avg-red");
    let irValue = localStorage.getItem("avg-ir");

    // Generate random values if none exist
    if (!redValue || redValue === "0") {
      redValue = Math.floor(
        Math.random() * (80000 - 40000 + 1) + 40000
      ).toString();
      localStorage.setItem("avg-red", redValue);
    }

    if (!irValue || irValue === "0") {
      irValue = Math.floor(
        Math.random() * (100000 - 50000 + 1) + 50000
      ).toString();
      localStorage.setItem("avg-ir", irValue);
    }

    redValueDisplay.textContent = parseInt(redValue).toLocaleString();
    irValueDisplay.textContent = parseInt(irValue).toLocaleString();

    redValueInput.value = redValue;
    irValueInput.value = irValue;

    // Add animation effect when values update
    if (redValue !== "0" && irValue !== "0") {
      redValueDisplay.classList.add("value-updated");
      irValueDisplay.classList.add("value-updated");

      setTimeout(() => {
        redValueDisplay.classList.remove("value-updated");
        irValueDisplay.classList.remove("value-updated");
      }, 1000);
    }
  }

  // Initial update
  updateSensorValues();

  // Update every 3 seconds
  setInterval(updateSensorValues, 3000);

  // Form submission
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = new FormData(form);

      // Show loading state
      predictionValue.textContent = "Calculating...";
      predictionResult.style.display = "block";

      fetch("/predict", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            predictionValue.textContent = "Error: " + data.error;
          } else {
            predictionValue.textContent = data.prediction + " g/dL";
          }
        })
        .catch((error) => {
          console.error("Prediction error:", error);
          predictionValue.textContent = "Error: Could not make prediction";
        });
    });
  }
});
