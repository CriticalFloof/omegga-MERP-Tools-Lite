export class Empire {

    name;
    color;
    buildings;
    resources;

    constructor(name, color){
        this.name = name;
        this.color = color;
        this.buildings = []
        this.resources = []
    };
}

export class Building {

    name;
    color;
    cost;
    production;
    

    constructor(name, color, cost:any[], production:any[]){
        this.name = name;
        this.color = color;
        this.cost = cost;
        this.production = production
        
    };
}

export class EmpireBuilding {

    name;
    amount;

    constructor(name, amount){
        this.name = name;
        this.amount = amount
        
    };
}

export class Resource {

    name;
    color;
    description;

    constructor(name, color, description){
        this.name = name;
        this.color = color;
        this.description = description;
    };
}

export class EmpireResource {

    name;
    color;
    amount;

    constructor(name, color, amount){
        this.name = name;
        this.color = color;
        this.amount = amount;
    };
}



