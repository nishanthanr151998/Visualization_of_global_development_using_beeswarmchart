const attributes = [
    "Birth Rate",
    "Death Rate",
    "Fertility Rate",
    "Life Expectancy",
    "Population Growth",
    "Population",
    "Cell Subsciptions",
    "Cell Subscriptions per 100",
    "Telephone lines",
    "Telephone lines per 100",
    "Agricultural land",
    "Agricultural land percent",
    "Arable land",
    "Arable land percent",
    "Land Area",
    "Rural Population",
    "Rural Population Growth",
    "Surface Area",
    "Population Density",
    "Urban Population Percent",
    "Urban Population Percent Growth"
];

var isPlaying = false;
let currentYear = 1980;
const endYear = 2013;
const playDelay = 1000;

const attrMap = {
    "Birth Rate": "Data.Health.Birth Rate",
    "Death Rate": "Data.Health.Death Rate",
    "Fertility Rate": "Data.Health.Fertility Rate",
    "Life Expectancy": "Data.Health.Life Expectancy at Birth, Total",
    "Population Growth": "Data.Health.Population Growth",
    "Population": "Data.Health.Total Population",
    "Cell Subsciptions": "Data.Infrastructure.Mobile Cellular Subscriptions",
    "Cell Subscriptions per 100": "Data.Infrastructure.Mobile Cellular Subscriptions per 100 People",
    "Telephone lines": "Data.Infrastructure.Telephone Lines",
    "Telephone lines per 100": "Data.Infrastructure.Telephone Lines per 100 People",
    "Agricultural land": "Data.Rural Development.Agricultural Land",
    "Agricultural land percent": "Data.Rural Development.Agricultural Land Percent",
    "Arable land": "Data.Rural Development.Arable Land",
    "Arable land percent": "Data.Rural Development.Arable Land Percent",
    "Land Area": "Data.Rural Development.Land Area",
    "Rural Population": "Data.Rural Development.Rural Population",
    "Rural Population Growth": "Data.Rural Development.Rural Population Growth",
    "Surface Area": "Data.Rural Development.Surface Area",
    "Population Density": "Data.Urban Development.Population Density",
    "Urban Population Percent": "Data.Urban Development.Urban Population Percent",
    "Urban Population Percent Growth": "Data.Urban Development.Urban Population Percent Growth"
};

const margin = [60, 60, 60, 100];

const RegionColorMap = {
    "South Asia": "DeepPink",
    "Europe & Central Asia": "blue",
    "Middle East & North Africa": "DarkTurquoise",
    "Sub-Saharan Africa": "DarkMagenta",
    "Latin America & Caribbean": "LightCoral",
    "East Asia & Pacific": "NavajoWhite",
    "North America": "PaleGreen"
};

function showSpinner() {
    document.getElementById('spinnerContainer').style.display = 'block';
}

function hideSpinner() {
    document.getElementById('spinnerContainer').style.display = 'none';
}

function play() {
    if (isPlaying) {
        isPlaying = false;
        document.getElementById('playButton').textContent = 'Play';
    } else {
        isPlaying = true;
        document.getElementById('playButton').textContent = 'Pause';

        function nextYear() {
            if (isPlaying && currentYear <= endYear) {
                drawChart(currentYear, function () {
                    currentYear++;
                    setTimeout(nextYear, playDelay);
                    document.getElementById('yearDropdown').value = currentYear-1;
                });
            } else {
                isPlaying = false;
                document.getElementById('playButton').textContent = 'Play';
            }
        }

        nextYear();
    }

}

function dataWrangler(data, attributes, regions, year) {

    var selectedData = data.filter(entry => entry.Year == year);

    selectedData = selectedData.map(entry => {
        const result = {
            Country: entry.Country,
            Region: entry.Region,
            Color: RegionColorMap[entry.Region]
        };
        attributes.forEach(attribute => {
            result[attribute] = entry[attribute];
        });
        return result;
    });

    selectedData = selectedData.filter(entry => regions.includes(entry.Region));
    return selectedData;
}

function drawYearLegend(year) {
    const margin = [60, 60, 60, 100];
    var bswarm = d3.select('#beeSwarmChart');
    var width = 1500;
    var chartWidth = width - margin[0] - margin[2] - 40;

    bswarm.select('.legend').remove();
    var legend = bswarm.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(' + (chartWidth + 20) + ', 0)');

    legend.append('text')
        .attr('x', 10)
        .attr('y', 35)
        .text(year)
        .attr('id', "yearLegend")
        .style('font-size', '30px')
        .attr('fill', "violet")
        .attr('alignment-baseline', 'middle');

}

function selectAll(source) {
    selectall = document.getElementsByName("selectAll");
    checkboxes = document.getElementsByName("checkbox");
    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = source.checked;
    }
    drawChart(+document.getElementById("yearDropdown").value);
}

document.addEventListener('DOMContentLoaded', function () {
    const yearDropdown = document.getElementById("yearDropdown");
    const xaxisDropdown = document.getElementById("xaxisDropdown");
    const sizeDropdown = document.getElementById("sizeDropdown");

    Promise.all([d3.csv('data/countries_regions.csv', d3.autoType), d3.csv('data/global_development.csv', d3.autoType)])
        .then(function (values) {
            console.log('loaded countries_regions.csv and global_development.csv');
            country_region = values[0];
            gddata = values[1];

            const countryRegionMap = {};
            country_region.forEach(entry => {
                countryRegionMap[entry.name] = entry['World bank region'];
            });

            gddata.forEach(entry => {
                entry['Region'] = countryRegionMap[entry.Country];
            });

            for (let i = 1980; i < 2014; i++) {
                const option = document.createElement('option');
                option.textContent = i;
                yearDropdown.appendChild(option);
            }

            for (let i = 0; i < attributes.length; i++) {
                const option = document.createElement('option');
                option.textContent = attributes[i];
                xaxisDropdown.appendChild(option);
            }

            for (let i = 0; i < attributes.length; i++) {
                const option = document.createElement('option');
                option.textContent = attributes[i];
                sizeDropdown.appendChild(option);
            }

            var selectedYear = document.getElementById('yearDropdown').value;
            drawChart(selectedYear);

        });
});

function drawChart(selectedYear, callBackFunc = function () { }) {

    const svg = d3.select('#myDataVis')
        .attr("width", width)
        .attr("height", height);


    if (!selectedYear) {
        selectedYear = document.getElementById('yearDropdown').value;
    }

    const selectedXAxis = attrMap[document.getElementById('xaxisDropdown').value];
    const selectedSize = attrMap[document.getElementById('sizeDropdown').value];

    const selectedRegions = Array.from(document.querySelectorAll('.checkbox input:checked'))
        .map(checkbox => checkbox.parentElement.textContent.trim());

    if (selectedSize == "None" || selectedXAxis == "None" || selectedYear == "None") {
        svg.selectAll("*").remove()
    }
    else {
        showSpinner();
        const filteredData = dataWrangler(gddata, [selectedXAxis, selectedSize], selectedRegions, selectedYear);

        var bswarm = d3.select("#beeSwarmChart");
        // bswarm.selectAll("*").remove();

        var width = +bswarm.style('width').replace('px', '');
        var height = +bswarm.style('width').replace('px', '');
        var chartWidth = width - margin[0] - margin[2] - 40;
        var chartHeight = height - margin[0] - margin[2];

        var g = bswarm.append('g').attr('transform', `translate(${50}, ${-380})`);
        drawYearLegend(selectedYear);
        var plotData = filteredData.map(d => {
            return {
                country: d["Country"],
                xSelected: parseFloat(parseFloat(d[selectedXAxis]).toFixed(2)),
                sizeSelected: parseFloat(parseFloat(d[selectedSize]).toFixed(2)),
                Color: d["Color"]
            }
        });

        svg.selectAll(".xAttribute").remove();
        bswarm.append('text')
            .attr('class', "xAttribute")
            .attr('x', chartWidth / 2 + 70)
            .attr('y', chartHeight / 2 + 15)
            .attr('text-anchor', 'middle')
            .attr("fill", "black")
            .text(document.getElementById('xaxisDropdown').value)
            .style('font-size', '24px')
            .style('font-weight', 'bold');

        var xScale = d3.scaleLinear()
            .domain(d3.extent(plotData.map((d) => d.xSelected)))
            .range([0, chartWidth]);

        var xAxis = d3.axisBottom(xScale);

        svg.selectAll(".x-axis").remove();
        g.append('g').call(xAxis)
            .attr('class', "x-axis")
            .attr('transform', `translate(20,${chartHeight / 2 + 310})`);

        var bubbleSize = d3.scaleSqrt().domain(d3.extent(plotData.map((d) => d.sizeSelected))).range([4, 40])

        var simulation = d3.forceSimulation(plotData)
            .force("x", d3.forceX((d) => xScale(d.xSelected)).strength(0.2))
            .force("y", d3.forceY(chartHeight / 2).strength(0.2))
            .force("collide", d3.forceCollide((d) => bubbleSize(d.sizeSelected) + 1).iterations(10).strength(2));

        for (i = 0; i < 10; i++) {
            simulation.tick();
        }
        simulation.on("end", () => {
            drawCirclesWithData(g, plotData, bubbleSize);
            hideSpinner();
        });
    }
    callBackFunc();
};

function drawCirclesWithData(g, data, bubbleSize) {
    var bswarm = d3.select('#beeSwarmChart');
    var width = +bswarm.style('width').replace('px', '');
    var height = +bswarm.style('width').replace('px', '');
    var chartWidth = width - margin[0] - margin[2] - 40;
    var chartHeight = height - margin[0] - margin[2];
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    bswarm.selectAll("circle")
        .data(data, (d) => {
            return d.country;
        })
        .join(
            enter => enter.append("circle")
                .attr("class", "circle")
                .attr("cx", (d) => Math.max(0, Math.min(chartWidth, d.x)) + 40)
                .attr("cy", (d) => Math.max(0, Math.min(chartHeight, d.y)) - 380)
                .attr("r", 0)
                .attr("stroke", "black")
                .attr("stroke-width", "1px")
                .attr("fill", (d) => d.Color)
                .on('mouseover', function (event, d) {
                    tooltip.transition()
                        .duration(0)
                        .style("display", "block")
                        .style("opacity", 0.9)

                    tooltip.html(`
                    <div>
                        <img src="flags/${d.country.replace(/ /g, "-")}.png" alt="${d.Country} Flag" width="50" height="30">
                        <br>
                        Country: ${d.country} <br>
                        ${document.getElementById('xaxisDropdown').value}: ${d.xSelected} <br>
                        ${document.getElementById('sizeDropdown').value}: ${d.sizeSelected}
                    </div>
                        `)
                        .style("left", (event.pageX) + "px")
                        .style("top", (event.pageY) + "px");

                })
                .on('mousemove', function (event, d) {
                    tooltip.transition()
                        .duration(0)
                        .style("display", "block")
                        .style("opacity", 0.9)
                        .style("left", (event.pageX) + "px")
                        .style("top", (event.pageY) + "px");
                })
                .on('mouseout', function (d) {
                    tooltip.transition()
                        .duration(500)
                        .style("display", "none");

                })
                .call(enter => enter
                    .transition()
                    .duration(500)
                    .attr("r", (d) => bubbleSize(d.sizeSelected))

                ),
            update => update
                .call(update => update.transition()
                    .delay(500)
                    .duration(1000)
                    .attr("cx", (d) => Math.max(0, Math.min(chartWidth, d.x)) + 100)
                    .attr("cy", (d) => Math.max(0, Math.min(chartHeight, d.y)) - 380)
                    .attr("r", (d) => bubbleSize(d.sizeSelected))
                ),

            exit => exit
                .call(exit => exit.transition()
                    .duration(200)
                    .attr("r", 0)
                    .remove())

        )

    bswarm.selectAll(".circle-label")
        .data(data, (d) => d.country)
        .join(
            enter => enter.append("text")
                .attr("class", "circle-label")
                .attr("x", (d) => Math.max(0, Math.min(chartWidth, d.x)) + 40)
                .attr("y", (d) => Math.max(0, Math.min(chartHeight, d.y)) - 380)
                .attr("dy", "0.3em")
                .attr("text-anchor", "middle")
                .attr("fill", "white")
                .attr("font-size", "10px")
                .text((d) => bubbleSize(d.sizeSelected).toFixed(0)),

            update => update
                .call(update => update.transition()
                    .delay(500)
                    .duration(1000)
                    .attr("x", (d) => Math.max(0, Math.min(chartWidth, d.x)) + 100)
                    .attr("y", (d) => Math.max(0, Math.min(chartHeight, d.y)) - 380)
                    .text((d) => bubbleSize(d.sizeSelected).toFixed(0))
                    .attr("text-anchor", "middle")
                ),
      
            exit => exit
                .call(exit => exit.transition()
                    .duration(200)
                    .remove())
        );


}