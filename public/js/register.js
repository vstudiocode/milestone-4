const registerForm = document.getElementById("registerForm");
const errorField = document.getElementById("errorField");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: username, password: password }),
        });

        const responseJson = await response.json();

        if (response.ok) {
            window.location.href = "/login";
        } else {
            errorField.innerText = responseJson.message;
        }
    } catch (error) {
        console.error("Error:", error);
    }
});