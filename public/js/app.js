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
            countriesList.forEach(elem => countryList.append(`<option value=${elem.Slug}>${elem.Country}</option>`));
        },
        error: function (err) {
            alert('error', err);
        }
    });
    let canvas = $('.coronaCanvas');


    let myChart = new Chart(canvas,

        {
            type: 'line',
            data:

            {
                labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                datasets:

                    [{
                        label: '# of Votes',
                        data: [12, 19, 3, 5, 2, 3],
                        backgroundColor:

                            [
                                'rgba(255, 99, 132, 0.2)',
                                'rgba(54, 162, 235, 0.2)',
                                'rgba(255, 206, 86, 0.2)',
                                'rgba(75, 192, 192, 0.2)',
                                'rgba(153, 102, 255, 0.2)',
                                'rgba(255, 159, 64, 0.2)'
                            ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
            }

            ,
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    );
});