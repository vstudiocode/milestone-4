document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('searchButton').addEventListener('click', function () {
        var searchValue = document.getElementById('searchInput').value;
        window.location.href = '/?q=' + encodeURIComponent(searchValue);
    });

    document.getElementById('sortNameAsc').addEventListener('click', function () {
        window.location.href = '/?s=' + encodeURIComponent("nameasc");
    });
    document.getElementById('sortNameDesc').addEventListener('click', function () {
        window.location.href = '/?s=' + encodeURIComponent("namedesc");
    });
    document.getElementById('sortClassAsc').addEventListener('click', function () {
        window.location.href = '/?s=' + encodeURIComponent("classasc");
    });
    document.getElementById('sortClassDesc').addEventListener('click', function () {
        window.location.href = '/?s=' + encodeURIComponent("classdesc");
    });
    document.getElementById('sortPlaystyleAsc').addEventListener('click', function () {
        window.location.href = '/?s=' + encodeURIComponent("playstyleasc");
    });
    document.getElementById('sortPlaystyleDesc').addEventListener('click', function () {
        window.location.href = '/?s=' + encodeURIComponent("playstyledesc");
    });
    document.getElementById('sortPlaystyleSAsc').addEventListener('click', function () {
        window.location.href = '/?s=' + encodeURIComponent("playstylesasc");
    });
    document.getElementById('sortPlaystyleSDesc').addEventListener('click', function () {
        window.location.href = '/?s=' + encodeURIComponent("playstylesdesc");
    });

    document.getElementById('logoutButton').addEventListener('click', function () {
        window.location.href = '/logout';
    });
});