const dataRangeByCountry = {
    name: '',
    dates: [],
    deaths: [],
    recovered: [],
    active: [],
    confirmed: []
}
const dataTodayByCountry = {
    name: '',
    deaths: '',
    recovered: '',
    active: '',
    confirmed: ''
}
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
    $('#submitCorona').on('click', (evt) => {
        evt.preventDefault();
        const selectOption = $('#cnty').val();
        if (selectOption)
            $('canvas').remove();
        dataRangeByCountry.name, dataTodayByCountry.name = selectOption;
        const dateFrom = $('#dateFrom').val();
        const dateTo = $('#dateTo').val();

        $.ajax({
            url: `https://api.quarantine.country/api/v1/summary/latest`,
            success: function (data1) {
                let extractedData = Object.entries(data1.data.regions);
                $('.todaysCoronaReport').html('').prepend('<canvas id="coronaTodayCanvas" width="400px" height="400px"></canvas>')
                let canvas2 = document.getElementById('coronaTodayCanvas')
                let context2 = canvas2.getContext('2d');
                let targetData = extractedData.filter(elem => elem[0] == selectOption);
                console.log(targetData);
                dataTodayByCountry.deaths = newData[0][1].NewDeaths;
                dataTodayByCountry.recovered = newData[0].NewRecovered;
                dataTodayByCountry.confirmed = newData[0].NewConfirmed;
                $('.todaysCoronaReport').append(`
                <table>
                <tr>
                    <td id="todayRecovered">
                        Recovered: ${dataTodayByCountry.recovered}
                    </td>
                    <td id="todayDeaths">
                        Deaths: ${dataTodayByCountry.deaths}
                    </td>
                </tr>
                <tr>
                    <td id="todayConfirmed">
                        Confirmed: ${dataTodayByCountry.confirmed}
                    </td>
                    <td>
                    </td>
                </tr>
                </table>`);
                console.log(dataTodayByCountry);
                let myChart2 = new Chart(context2,

                    {
                        type: 'bar',
                        data:

                        {
                            labels: [`${dataTodayByCountry.name.toUpperCase()} today`],
                            datasets:

                                [{
                                        label: 'Confirmed Casses',
                                        data: [dataTodayByCountry.confirmed],
                                        backgroundColor: 'rgba(0,0,200,0.3)',
                                        borderWidth: 1
                                    },
                                    {
                                        label: 'Deaths',
                                        data: [dataTodayByCountry.deaths],
                                        backgroundColor: 'rgba(200,0,0,0.3)',
                                        borderWidth: 1
                                    },
                                    {
                                        label: 'Recovered',
                                        data: [dataTodayByCountry.recovered],
                                        backgroundColor: 'rgba(0,200,0,0.3)',
                                        borderWidth: 1
                                    }
                                ]
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
            }
        }).catch(err => console.log(err));
        $.ajax({
            url: `https://api.covid19api.com/total/country/${selectOption}?from=${dateFrom}&to=${dateTo}`,
            success: function (data) {
                $('.rangeCoronaReport').append('<canvas id="coronaTotalCanvas" width="400px" height="400px"></canvas>')
                let canvas = document.getElementById('coronaTotalCanvas')
                let context = canvas.getContext('2d');

                data.forEach(elem => {
                    if (elem.Date != "2021-03-07T00:00:00Z") {
                        dataRangeByCountry.dates.push(elem.Date.slice(0, 10));
                        dataRangeByCountry.deaths.push(elem.Deaths);
                        dataRangeByCountry.recovered.push(elem.Recovered);
                        dataRangeByCountry.confirmed.push(elem.Confirmed);
                        dataRangeByCountry.active.push(elem.Active);
                    }
                });
                let myChart = new Chart(context,

                    {
                        type: 'line',
                        data:

                        {
                            labels: dataRangeByCountry.dates,
                            datasets:

                                [{
                                        label: 'Confirmed Casses',
                                        data: dataRangeByCountry.confirmed,
                                        backgroundColor: 'rgba(0,0,200,0.3)',
                                        borderWidth: 1
                                    },
                                    {
                                        label: 'Active Cases',
                                        data: dataRangeByCountry.active,
                                        backgroundColor: 'rgba(200,200,0,0.3)',
                                        borderWidth: 1
                                    },
                                    {
                                        label: 'Deaths',
                                        data: dataRangeByCountry.deaths,
                                        backgroundColor: 'rgba(200,0,0,0.3)',
                                        borderWidth: 1
                                    },
                                    {
                                        label: 'Recovered',
                                        data: dataRangeByCountry.recovered,
                                        backgroundColor: 'rgba(0,200,0,0.3)',
                                        borderWidth: 1
                                    }
                                ]
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
            }

        });
    });
})