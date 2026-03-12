let processes = [];
let chartInstance = null;

function addProcess() {
    const pid = document.getElementById("pid").value;
    const arrival = parseInt(document.getElementById("arrival").value);
    const burst = parseInt(document.getElementById("burst").value);
    const priority = parseInt(document.getElementById("priority").value) || 0;

    if(!pid || isNaN(arrival) || isNaN(burst)) {
        alert("Please enter valid details!");
        return;
    }

    processes.push({
        pid, arrival, burst, priority,
        remaining: burst
    });

    alert("Process Added!");
}

function resetAll() {
    processes = [];
    document.getElementById("gantt").innerHTML = "";
    document.getElementById("timeline").innerHTML = "";
    document.getElementById("result").innerHTML = "";
    if(chartInstance) chartInstance.destroy();
}

function runAlgorithm() {
    const algo = document.getElementById("algorithm").value;
    if(processes.length === 0) {
        alert("Add processes first!");
        return;
    }

    if(algo === "fcfs") simulate([...processes].sort((a,b)=>a.arrival-b.arrival));
    else if(algo === "sjf") simulate([...processes].sort((a,b)=>a.burst-b.burst));
    else if(algo === "priority") simulate([...processes].sort((a,b)=>a.priority-b.priority));
    else if(algo === "rr") runRR();
}

function runRR() {
    const quantum = parseInt(document.getElementById("quantum").value);
    if(isNaN(quantum)) {
        alert("Enter Time Quantum!");
        return;
    }

    let queue = processes.map(p => ({...p}));
    let ganttData = [];

    while(queue.length > 0) {
        let p = queue.shift();

        if(p.remaining > quantum) {
            ganttData.push({pid:p.pid, time:quantum});
            p.remaining -= quantum;
            queue.push(p);
        } else {
            ganttData.push({pid:p.pid, time:p.remaining});
        }
    }

    animateGantt(ganttData);
}

function simulate(sorted) {
    let currentTime = 0;
    let ganttData = [];
    let results = [];

    sorted.forEach(p => {
        if(currentTime < p.arrival)
            currentTime = p.arrival;

        let start = currentTime;
        let waiting = start - p.arrival;
        let tat = waiting + p.burst;

        results.push({pid:p.pid, waiting, tat});
        ganttData.push({pid:p.pid, time:p.burst});
        currentTime += p.burst;
    });

    animateGantt(ganttData);
    showResults(results);
    drawGraph(results);
}

function animateGantt(data) {
    const gantt = document.getElementById("gantt");
    const timeline = document.getElementById("timeline");
    gantt.innerHTML = "";
    timeline.innerHTML = "";

    let time = 0;
    timeline.innerHTML += `<span>${time}</span>`;

    data.forEach((block, i) => {
        setTimeout(() => {
            let div = document.createElement("div");
            div.className = "block";
            div.style.flex = block.time;
            div.style.background = randomColor();
            div.innerText = block.pid;
            gantt.appendChild(div);

            time += block.time;
            timeline.innerHTML += `<span>${time}</span>`;
        }, i * 700);
    });
}

function showResults(results) {
    let totalWT = 0, totalTAT = 0;
    let table = `
        <table>
            <tr>
                <th>Process</th>
                <th>Waiting Time</th>
                <th>Turnaround Time</th>
            </tr>
    `;

    results.forEach(r => {
        totalWT += r.waiting;
        totalTAT += r.tat;
        table += `
            <tr>
                <td>${r.pid}</td>
                <td>${r.waiting}</td>
                <td>${r.tat}</td>
            </tr>
        `;
    });

    table += `</table>
    <p><strong>Average Waiting Time:</strong> ${(totalWT/results.length).toFixed(2)}</p>
    <p><strong>Average Turnaround Time:</strong> ${(totalTAT/results.length).toFixed(2)}</p>`;

    document.getElementById("result").innerHTML = table;
}

function drawGraph(results) {
    const ctx = document.getElementById("chart").getContext("2d");
    if(chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: results.map(r=>r.pid),
            datasets: [
                {
                    label: "Waiting Time",
                    data: results.map(r=>r.waiting)
                },
                {
                    label: "Turnaround Time",
                    data: results.map(r=>r.tat)
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } }
        }
    });
}

function randomColor() {
    return `hsl(${Math.random()*360},70%,70%)`;
}