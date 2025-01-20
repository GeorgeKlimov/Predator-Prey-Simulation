class Simulation{
    constructor(size, initial_prey, initial_predators, prey_birth_rate, prey_natural_death_rate, predator_kill_rate, predator_birth_rate, predator_death_rate, prey_movement_radius, predator_movement_radius){
        this.size = size
        this.grid = Array.from({length: size}, () => Array(size).fill(0))
        this.prey_birth_rate = prey_birth_rate
        this.initial_prey = initial_prey
        this.initial_predators = initial_predators
        this.prey_natural_death_rate = prey_natural_death_rate
        this.predator_kill_rate = predator_kill_rate
        this.predator_birth_rate = predator_birth_rate
        this.predator_death_rate = predator_death_rate
        this.prey_movement_radius = prey_movement_radius
        this.predator_movement_radius = predator_movement_radius
        this.populationHistory = [[this.initial_predators, this.initial_prey]]
        this.running = false
        this.simulationInterval = null

        this.populateGrid(initial_prey, initial_predators)
    }

    shuffleArray(array){
        for (let i = array.length - 1; i >=0; i --){
            let j = Math.floor(Math.random() * (i + 1))
            let temp = array[i]
            array[i] = array[j]
            array[j] = temp
        }
    }

    populateGrid(initial_prey, initial_predators){
        let positions = []
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                positions.push([x, y])
            }
        }

        this.shuffleArray(positions)
        this.shuffleArray(positions)

        for (let i = 0; i < initial_prey; i++) {
            let [x, y] = positions.pop()
            this.grid[x][y] = 1
        }

        for (let i = 0; i < initial_predators; i++) {
            let [x, y] = positions.pop()
            this.grid[x][y] = 2
        }
    }

    clamp(min, max, num){
        if(num < min){
            return min
        }
        if(num > max){
            return max
        }
        return num
    }   

    mooreNeighborhood(pos, radius=1, state){
        let count = 0

        for (let x = Math.max(0, pos[0] - radius); x <= Math.min(this.size-1, pos[0] + radius); x++){
            for (let y = Math.max(0, pos[1] - radius); y <= Math.min(this.size-1, pos[1] + radius); y++){
                if(this.grid[x][y] == state){
                    count += 1
                }
            }
        }
        return count
    }

    neumannNeighborhood(pos, radius=1, state){
        let count = 0

        for (let x = Math.max(0, pos[0] - radius); x <= Math.min(this.size-1, pos[0] + radius); x++){
            for (let y = Math.max(0, pos[1] - radius); y <= Math.min(this.size-1, pos[1] + radius); y++){
                if(Math.abs(x - pos[0]) + Math.abs(y - pos[1]) <= radius){
                    if(this.grid[x][y] == state){
                        count += 1
                    }
                }
            }
        }
        return count
    }

    getQuadrantCounts(pos){
        let counts = {"N": 0, "S": 0, "E": 0, "W": 0}
        let radius
        let stateCount
        if(this.grid[pos[0]][pos[1]] == 1){
            radius = this.prey_movement_radius
            stateCount = 2
        }
        else if(this.grid[pos[0]][pos[1]] == 2){
            radius = this.predator_movement_radius
            stateCount = 1
        }
        else{
            console.log("Get Quadrant Counts: You are using this function on a tile with no animals, dumbass")
            return null
        }
        //North Quadrant
        for(let x = Math.max(0, pos[0] - radius); x < pos[0]; x++){
            let i = Math.abs(pos[0] - x)
            for(let y = Math.max(0, pos[1] - i); y <= Math.min(pos[1] + i, this.size - 1); y++){
                if(this.grid[x][y] == stateCount){
                    counts["N"] += 1
                }
            }
        }
            //South Quadrant
            for(let x = pos[0] + 1; x <= Math.min(pos[0] + radius, this.size - 1); x++){
                let i = Math.abs(pos[0] - x)
                for(let y = Math.max(0, pos[1] - i); y <= Math.min(pos[1] + i, this.size - 1); y++){
                    if(this.grid[x][y] == stateCount){
                        counts["S"] += 1
                    }

                }
            }
            //West Quadrant
            for(let y = Math.max(0, pos[1] - radius); y < pos[1]; y++){
                let i = Math.abs(pos[1] - y)
                for(let x = Math.max(0, pos[0] - i); x <= Math.min(pos[0] + i, this.size - 1); x++){
                    if(this.grid[x][y] == stateCount){
                        counts["W"] += 1
                    }
                }
            }
            //East Quadrant
            for(let y = pos[1] + 1; y <= Math.min(pos[1] + radius, this.size - 1); y++){
                let i = Math.abs(pos[1] - y)
                for(let x = Math.max(0, pos[0] - i); x <= Math.min(pos[0] + i, this.size - 1); x++){
                    if(this.grid[x][y] == stateCount){
                        counts["E"] += 1
                    }

                }
            }    
        return counts
    }

    getTargetCell(pos){
        let counts, best, directions 
        counts = this.getQuadrantCounts(pos)
        if(this.grid[pos[0]][pos[1]] == 1){
            best = Math.min(...Object.values(counts))
        }
        else if(this.grid[pos[0]][pos[1]] == 2){
            best = Math.max(...Object.values(counts))
        }
        directions = Object.entries(counts)
            .filter(([_, count]) => count === best)
            .map(([direction, _]) => direction)
        
        let chosenDirection = directions.length > 0
            ? directions[Math.floor(Math.random() * directions.length)]
            : null;

        let x = pos[0]
        let y = pos[1]

        if(chosenDirection == "N"){
            return [Math.max(0, x-1), y]
        }
        else if(chosenDirection == "S"){
            return [Math.min(this.size-1, x+1), y]
        }
        else if(chosenDirection == "W"){
            return [x, Math.max(0, y-1)]
        }
        else if(chosenDirection == "E"){
            return [x, Math.min(this.size-1, y+1)]
        }
        else{
            return null
        }
    }

    drawGrid(){
        let canvas = document.getElementById("gridCanvas")
        let ctx = canvas.getContext("2d")
        let cellSize = canvas.width / this.size

        for(let x = 0; x < this.size; x++){
            for(let y = 0; y < this.size; y++){
                if(this.grid[x][y] == 0){
                    ctx.fillStyle = "black"
                }
                else if(this.grid[x][y] == 1){
                    ctx.fillStyle = "blue"
                }
                else if(this.grid[x][y] == 2){
                    ctx.fillStyle = "red"
                }
                ctx.fillRect(y * cellSize, x * cellSize, cellSize, cellSize)
            }
        }
    }

    drawPopulationGraph(){
        let canvas = document.getElementById('populationCanvas')
        let ctx = canvas.getContext('2d')

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        let margin = 10
        let width = canvas.width - 2 * margin
        let height = canvas.height - 2 * margin
        let maxPopulation = 1.1 * Math.max(...this.populationHistory.map(([pred, prey]) => Math.max(pred, prey)))

        ctx.strokeStyle = "black"
        ctx.beginPath()
        ctx.moveTo(margin, margin)
        ctx.lineTo(margin, canvas.height - margin)
        ctx.lineTo(canvas.width - margin, canvas.height - margin)
        ctx.stroke()

        ctx.strokeStyle = "red"
        ctx.beginPath()
        for (let i = 0; i < this.populationHistory.length; i++){
            let [predatorCount, preyCount] = this.populationHistory[i]
            let x = margin + (i / this.populationHistory.length) * width
            let y = canvas.height - margin - (predatorCount / maxPopulation) * height
            ctx.lineTo(x, y)
        }
        ctx.stroke()

        ctx.strokeStyle = "blue"
        ctx.beginPath()
        for (let i = 0; i < this.populationHistory.length; i++){
            let [predatorCount, preyCount] = this.populationHistory[i]
            let x = margin + (i / this.populationHistory.length) * width
            let y = canvas.height - margin - (preyCount / maxPopulation) * height
            ctx.lineTo(x, y)
        }
        ctx.stroke()
    }

    drawPopulationPhase(){
        let canvas = document.getElementById('phaseCanvas')
        let ctx = canvas.getContext('2d')

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        let margin = 10
        let width = canvas.width - 2 * margin
        let height = canvas.height - 2 * margin
        let maxPredPopulation = 1.1 * Math.max(...this.populationHistory.map(([pred, prey]) => pred))
        let maxPreyPopulation = 1.1 * Math.max(...this.populationHistory.map(([pred, prey]) => prey))

        ctx.strokeStyle = "black"
        ctx.beginPath()
        ctx.moveTo(margin, margin)
        ctx.lineTo(margin, canvas.height - margin)
        ctx.lineTo(canvas.width - margin, canvas.height - margin)
        ctx.lineTo(canvas.width - margin, margin)
        ctx.lineTo(margin, margin)
        ctx.stroke()

        ctx.strokeStyle = "purple"
        ctx.beginPath()
        ctx.moveTo(this.populationHistory[0][0], this.populationHistory[0][1])
        for (let i = 0; i < this.populationHistory.length; i++){
            let [predatorCount, preyCount] = this.populationHistory[i]
            let x = canvas.width - margin - (predatorCount / maxPredPopulation) * width
            let y = canvas.height - margin - (preyCount / maxPreyPopulation) * height
            ctx.lineTo(x, y)
        }
        ctx.stroke()
    }

    updateSimulation(){
        if (!this.running){
            return
        }
        let newGrid = this.grid.map(row => [...row])

        for(let x=0; x < this.size; x++){
            for(let y=0; y < this.size; y++){
                let currentState = this.grid[x][y]

                if(currentState == 0){
                    let predatorCount = this.mooreNeighborhood([x, y], 3, 2)
                    if (predatorCount == 0){
                        let preyCount = this.mooreNeighborhood([x, y], 2, 1)
                        if(Math.random() < this.prey_birth_rate * preyCount / (1 + this.prey_birth_rate * preyCount)){
                            if(Math.random() > this.prey_natural_death_rate){
                                newGrid[x][y] = 1
                                currentState = 1
                            }
                        }
                    }
                }

                if(currentState == 1){
                    let predatorCount = this.mooreNeighborhood([x, y], 1, 2)
                    if(predatorCount > 0){
                        if(Math.random() > Math.pow(1 - this.predator_kill_rate, predatorCount)){
                            if(Math.random() < this.predator_birth_rate){
                                newGrid[x][y] = 2
                                currentState = 2
                            }
                            else{
                                newGrid[x][y] = 0
                            }
                        }
                        else if(Math.random() < this.prey_natural_death_rate){
                            newGrid[x][y] = 0
                        }
                    }
                    else if(Math.random() < this.prey_natural_death_rate){
                        newGrid[x][y] = 0
                    }
                }

                if(currentState == 2){
                    let preyCount = this.mooreNeighborhood([x, y], 2, 1) > 0
                    if (preyCount){
                        if(Math.random() < this.predator_death_rate){
                            newGrid[x][y] = 0
                        }
                    }
                    else{
                        if(Math.random() < 5 * this.predator_death_rate){
                            newGrid[x][y] = 0
                        }
                    }
                }
            }
        }

        let predatorCount = 0
        let preyCount = 0
        for(let x = 0; x < this.size; x++){
            for(let y = 0; y < this.size; y++){
                if(this.grid[x][y] != 0){
                    if(this.grid[x][y] == 1){
                        preyCount++
                    }
                    else{
                        predatorCount++
                    }
                    let direction = this.getTargetCell([x, y])
                    if(direction){
                        let [targetX, targetY] = direction
                        if(newGrid[targetX][targetY] == 0){
                            newGrid[targetX][targetY] = newGrid[x][y]
                            newGrid[x][y] = 0
                        }
                    }
                }
            }
        }
    
    this.populationHistory.push([predatorCount, preyCount])
    this.grid = newGrid
    this.drawGrid()
    this.drawPopulationGraph()
    this.drawPopulationPhase()

    }

    startSimulation(){
        if(this.running){
            return
        }
        this.running = true
        this.simulationInterval = setInterval(() => this.updateSimulation(), 0)
    }

    pauseSimulation(){
        this.running = false
        clearInterval(this.simulationInterval)
        this.simulationInterval = null
    }

    restartSimulation(newSize, newPrey, newPredators, newPreyBirthRate, newPredatorKillRate, newPreyDeathRate, newPredatorBirthRate, newPredatorDeathRate, newPreyRadius, newPredatorRadius) {
        this.size = newSize
        this.grid = Array.from({ length: newSize }, () => Array(newSize).fill(0))
        this.prey_birth_rate = newPreyBirthRate
        this.predator_kill_rate = newPredatorKillRate
        this.initial_predators = newPredators
        this.initial_prey = newPrey
        this.prey_natural_death_rate = newPreyDeathRate
        this.predator_birth_rate = newPredatorBirthRate
        this.predator_death_rate = newPredatorDeathRate
        this.prey_movement_radius = newPreyRadius
        this.predator_movement_radius = newPredatorRadius
        this.populationHistory = [[newPredators, newPrey]]
        this.running = false
        if (this.simulationInterval){
            clearInterval(this.simulationInterval)
        }
        this.simulationInterval = null

        this.populateGrid(newPrey, newPredators)
        this.drawGrid()
        this.drawPopulationGraph()
        this.drawPopulationPhase()

        this.startSimulation()
    }

    printGrid(){
        console.log(this.grid.map(row => row.join(' ')).join('\n'))
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let startButton = document.getElementById("start-button");
    let pauseButton = document.getElementById("pause-button");
    let restartButton = document.getElementById("restart-button");

    let gridSizeInput = document.getElementById("gridSize");
    let preyInput = document.getElementById("initialPrey");
    let predatorInput = document.getElementById("initialPredators");
    let preyRateInput = document.getElementById("preyBirthRate");
    let predatorKillRateInput = document.getElementById("predatorKillRate");
    let preyDeathRateInput = document.getElementById("preyNaturalDeathRate")
    let predatorBirthRateInput = document.getElementById("predatorBirthRate")
    let predatorDeathRateInput = document.getElementById("predatorDeathRate")
    let preyRadiusInput = document.getElementById("preyMovementRadius")
    let predatorRadiusInput = document.getElementById("predatorMovementRadius")

    let sim = new Simulation(300, 3000, 1000, 1, 0.05, 1, 1, 0.1, 2, 3)

    startButton.addEventListener("click", (e) => {
        sim.startSimulation();
    });

    pauseButton.addEventListener("click", (e) => {
        sim.pauseSimulation();
    });

    restartButton.addEventListener("click", (e) => {
        let gridSize, initialPrey, initialPredators, preyBirthRate, predatorKillRate, preyDeathRate, predatorBirthRate, predatorDeathRate, preyRadius, predatorRadius
        if(gridSizeInput.value){gridSize = parseInt(gridSizeInput.value)}else{gridSize = sim.size}
        if(preyInput.value){initialPrey = parseInt(preyInput.value)}else{initialPrey = sim.initial_prey}
        if(predatorInput.value){initialPredators = parseInt(predatorInput.value)}else{initialPredators = sim.initial_predators}
        if(preyRateInput.value){preyBirthRate = parseFloat(preyRateInput.value)}else{preyBirthRate = sim.prey_birth_rate}
        if(predatorKillRateInput.value){predatorKillRate = parseFloat(predatorKillRateInput.value)}else{predatorKillRate = sim.predator_kill_rate}
        if(preyDeathRateInput.value){preyDeathRate = parseFloat(preyDeathRateInput.value)}else{preyDeathRate = sim.prey_natural_death_rate}
        if(predatorBirthRateInput.value){predatorBirthRate = parseFloat(predatorBirthRateInput.value)}else{predatorBirthRate = sim.predator_birth_rate}
        if(predatorDeathRateInput.value){predatorDeathRate = parseFloat(predatorDeathRateInput.value)}else{predatorDeathRate = sim.predator_death_rate}
        if(preyRadiusInput.value){preyRadius = parseInt(preyRadiusInput.value)}else{preyRadius = sim.prey_movement_radius}
        if(predatorRadiusInput.value){predatorRadius = parseInt(predatorRadiusInput.value)}else{predatorRadius = sim.predator_movement_radius}

        sim.pauseSimulation(); // Pause any running simulation
        sim.restartSimulation(gridSize, initialPrey, initialPredators, preyBirthRate, predatorKillRate, preyDeathRate, predatorBirthRate, predatorDeathRate, preyRadius, predatorRadius);
    });
});