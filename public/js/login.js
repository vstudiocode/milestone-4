const loginForm = document.getElementById("loginForm");
const errorField = document.getElementById("errorField");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: username, password: password }),
        });

        const responseJson = await response.json();
        console.log(responseJson);

        console.log(response);

        if (response.ok) {
            window.location.href = "/";
        } else {
            errorField.innerText = responseJson.message;
        }
    } catch (error) {
        console.error("Error:", error);
    }
});