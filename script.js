const margin = { top: 40, right: 30, bottom: 60, left: 70 };
const container = document.getElementById("chart-container");

const width = container.clientWidth - margin.left - margin.right;
const height = container.clientHeight - margin.top - margin.bottom;

const svg = d3.select("#chart-container")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");
const YEAR = 2015;

d3.csv("data/merged_life_expectancy_dataset.csv").then(raw => {

  // Format and clean data
  let data = raw.map(d => ({
    country: d.country,
    year: +d.year,
    lifeExp: +d.life_expectancy,
    schooling: +d.schooling,
    mortality: +d.adult_mortality,
    status: d.status
  }));

  data = data.filter(d =>
    d.year === YEAR &&
    !isNaN(d.lifeExp) &&
    !isNaN(d.schooling) &&
    !isNaN(d.mortality) &&
    d.status && d.status.trim() !== ""
  );

  console.log("Valid 2015 records:", data.length);

  const r = d3.scaleSqrt()
    .domain(d3.extent(data, d => d.mortality))
    .range([4, 26]);

  const maxR = d3.max(data, d => r(d.mortality));

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.schooling)).nice()
    .range([maxR, width - maxR]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.lifeExp)).nice()
    .range([height - maxR, maxR]);

  const statusValues = Array.from(new Set(data.map(d => d.status)));
  const color = d3.scaleOrdinal()
    .domain(statusValues)
    .range(["#4a90e2", "#f5a623", "#7ed321"].slice(0, statusValues.length));

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width / 2).attr("y", height + 45)
    .attr("text-anchor", "middle")
    .text("Average years of schooling");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2).attr("y", -50)
    .attr("text-anchor", "middle")
    .text("Life expectancy (years)");

  svg.append("clipPath")
    .attr("id", "chart-clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  const bubbleGroup = svg.append("g")
    .attr("clip-path", "url(#chart-clip)");

  function drawBubbles(filteredData) {
    const circles = bubbleGroup.selectAll("circle")
      .data(filteredData, d => d.country);

    circles.exit()
      .transition().duration(500)
      .attr("r", 0)
      .remove();

    circles.transition().duration(500)
      .attr("cx", d => x(d.schooling))
      .attr("cy", d => y(d.lifeExp))
      .attr("r", d => r(d.mortality))
      .attr("fill", d => color(d.status));

    circles.enter()
      .append("circle")
      .attr("cx", d => x(d.schooling))
      .attr("cy", d => y(d.lifeExp))
      .attr("r", 0)
      .attr("fill", d => color(d.status))
      .attr("fill-opacity", 0.7)
      .on("mouseover", (event, d) => {
        tooltip.style("opacity", 1)
          .html(`<strong>${d.country}</strong><br/>
                 Life Exp: ${d.lifeExp}<br/>
                 Schooling: ${d.schooling}<br/>
                 Adult Mortality: ${d.mortality}`);
      })
      .on("mousemove", event => {
        const [xPos, yPos] = d3.pointer(event, container);
        tooltip.style("left", xPos + 20 + "px")
          .style("top", yPos + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0))
      .transition().duration(800)
      .attr("r", d => r(d.mortality));
  }

  drawBubbles(data);

  d3.selectAll("#status-filter button").on("click", function() {
    const status = d3.select(this).attr("data-status");
    const filtered =
      status === "All" ? data : data.filter(d => d.status === status);
    drawBubbles(filtered);
  });

});
