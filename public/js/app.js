$(function () {
    let countriesList = [];
    $.ajax({
        url: '/json/data.json',
        method: 'get',
        dataType: 'json',
        success: function (data) {
            data.forEach(elem => {
                countriesList.push(elem);
            });
            let countryList = $('#cnty');
            countriesList.sort((el1, el2) => {
                return el1.Country.toUpperCase() > el2.Country.toUpperCase() ? 1 : -1;
            });
            console.log(countriesList);
            countriesList.forEach(elem => countryList.append(`<option value=${elem.ISO2}>${elem.Country}</option>`));
        },
        error: function (err) {
            alert('error', err);
        }
    });
});