const ctx = document.getElementById("myChart");
const modal = document.getElementById("modal");
const numberFilterSelector = document.getElementById("number");



var data = [];
var config = {};
var chart;
var labels = [];
var startingYear;
var startingMonth;
var id_journey;
var id_time;
var totalCustomers;
var jsonPromise;
var jsonFiltersPromise;
var tendency;
var completeData;
var filter = "a";


$(document).ready(function () {
  labels = [
    "October (2022)",
    "November (2022)",
    "December (2022)",
    "January (2023)",
    "February (2023)",
    "March (2023)",
    "April (2023)",
    "May (2023)",
    "June (2023)",
    "July (2023)",
    "August (2023)",
    "September (2023)"
  ];
  startingYear = 2022;
  startingMonth = 10;

  jsonPromise = $.getJSON("files/dataJson.json");
  jsonFiltersPromise = $.getJSON("files/filters.json");

  defineTendency("positiva");

})

function defineTendency(optTendency) {
  tendency = optTendency;
  loadData();
}

function loadData() {
  jsonPromise.done(function (data) {
    completeData = data;
    filterData();
  });

}

numberFilterSelector.addEventListener("change", (e) => {
  filter = numberFilterSelector.value;
  filterData();
});

function filterData() {
  jsonFiltersPromise.done(function (filters) {
    let min = filters[filter]["min"];
    let max = filters[filter]["max"];

    let keys = Object.keys(completeData)

    let filteredJourneys = {}
    keys.forEach(k => {
     if((completeData[k]["count"] >= min) && (completeData[k]["count"] <= max - 1)){
      filteredJourneys[k] = completeData[k]
     }
    });

    loadSetup(filteredJourneys);
    loadChart(config);
    
  });
}

function loadSetup(
  JSON,
) {
  
  let attribute = "account_movement";
  let keys = Object.keys(JSON)

  let datasets = []
  keys.forEach(k => {

    let slope = JSON[k][attribute]["slope"];
    let color = defineLineColor(slope)

    if (verifyTendency(slope, tendency)) {
      let dataset = {
        label: k,
        count: JSON[k]["count"],
        data: JSON[k][attribute]["valores"],
        borderColor: color,
        backgroundColor: color,
        pointRadius: 5,
        pointHoverRadius: 10,

      };

      datasets.push(dataset);
    }


  });

  data = {
    labels: labels,
    datasets: datasets,
  };


  config = {
    type: "line",
    data: data,
    options: {
      events: ["click", "touchstart", "touchmove", "touchend"],
      scales: {
        y: {
          title: { display: true, text: "Account movement" },
          min: 0,
          max: 1,
          ticks: {
            stepSize: 0.1
          }
        },
      },
      plugins: {
        title: {
          display: true,
          text: (ctx) => "Customer journeys",
        },
        subtitle: {
          display: true,
          padding: 10,
          text: (ctx) =>
            "Number of journeys: " + ctx.chart.data.datasets.length,
        },
        legend: {
          labels: {
            //usePointStyle: true,
          },
          events: ['click'],
          position: "bottom",
          onClick: function (e, legendItem) {
            // https://codepen.io/jordanwillis/pen/BWKKKo?editors=0010
            var index = legendItem.datasetIndex;
            var ci = this.chart;
            var alreadyHidden =
              ci.getDatasetMeta(index).hidden === null
                ? false
                : ci.getDatasetMeta(index).hidden;

            ci.data.datasets.forEach(function (e, i) {
              var meta = ci.getDatasetMeta(i);

              if (i !== index) {
                if (!alreadyHidden) {
                  meta.hidden = meta.hidden === null ? !meta.hidden : null;
                } else if (meta.hidden === null) {
                  meta.hidden = true;
                }
              } else if (i === index) {
                meta.hidden = null;
              }
            });

            ci.update();


          },
        },
      },

    },
  };
  // </block:config>
}


function onmousemove(move) {
  const point = chart.getElementsAtEventForMode(
    move,
    "nearest",
    { intersect: "true" },
    true
  );

  if (point.length > 0) {
    let account_movement = point[0]["element"]["$context"]["raw"]

    let datasetLabel = chart.data.datasets[point[0]["datasetIndex"]];
    let color = datasetLabel["borderColor"]

    var startingDate = new Date(startingYear, startingMonth - 1, 1);

    var newDate = new Date(startingDate);
    newDate.setMonth(startingDate.getMonth() + point[0]["index"]);

    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const year = newDate.getFullYear();

    id_time = `${year}${month}`

    id_journey = datasetLabel["label"];

    totalCustomers = datasetLabel["count"];

    posX = point[0]["element"]["x"];
    posY = point[0]["element"]["y"];

    showModal(posX, posY, account_movement, color)

  }
}

function showModal(posX, posY, account_movement, color) {
  porcent = (account_movement * 100).toFixed();
  degree = ((porcent * 360) / 100).toFixed()
  createHeader();
  content = '<h4>Account movement</h4>'
  content += "<div id='circle' data-progress='" + porcent + "' style='--progress: " + degree + "deg; --color:" + color + "'>" + porcent + "%</div>"

  $('#content-modal').html(content);

  modal.classList.add('show')
  modal.style.left = posX + 180 + "px";
  modal.style.top = posY + 150 + "px";

}

function createHeader() {
  var content = "<span>Journey: <strong>" + id_journey + "</strong>"
  content = content + "<br>Period: <strong>" + id_time + "</strong> "
  content = content + "(<strong>" + totalCustomers.toLocaleString('en-US') + "</strong> users on the journey)</span>"
  $('#header-modal').html(content);
}


function loadChart(config) {
  if (chart != undefined) {
    chart.destroy();
  }
  //ctx.ondblclick = onDblClick;
  ctx.onmousemove = onmousemove;
  chart = new Chart(ctx, config);
  chart.render();
};




function changeTendencyImg() {
  var imgTend = document.getElementById("imgTend");
  var positive = document.getElementById("positiva");
  var stable = document.getElementById("estavel");

  if (positive.checked == true) {
    imgTend.setAttribute('src', "images\\positive.png")
  } else if (stable.checked == true) {
    imgTend.setAttribute('src', "images\\stable.png")
  } else {
    imgTend.setAttribute('src', "images\\negative.png")
  }

}


const closeModal = () => {
  modal.classList.remove('show')
}

function defineLineColor(paramSlope) {
  let colorLine = "";
  if (paramSlope > 0) {
    colorLine = "#0000FF";
  } else if (paramSlope == 0) {
    colorLine = "#FFFF00";
  } else if (paramSlope < 0) {
    colorLine = "#FF0000";
  }
  return colorLine;
};

function verifyTendency(paramSlope) {
  if ((tendency == "positiva") & (paramSlope > 0)) {
    return true;

  } else if ((tendency == "negativa") & (paramSlope < 0)) {
    return true;

  } else if ((tendency == "estavel") & (paramSlope == 0)) {
    return true;

  } else {
    return false;
  }
}
