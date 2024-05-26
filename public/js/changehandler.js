document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('changeForm').addEventListener('submit', async function (event) {
        event.preventDefault();
        var name = document.getElementById('nameHeader').textContent;
        var newName = document.getElementById('newName').value;
        var newType = document.getElementById('newType').value;
        var newClass = document.getElementById('newClass').value;
        var newImage = document.getElementById('newImage').value;
        
        await fetch('/api/change', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name, newName: newName, newType: newType, newClass: newClass, newImage: newImage })
        });

        window.location.href = '/';
        // I don't know why this doesn't want to redirect.
    });
});
