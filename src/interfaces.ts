export interface PlayerData {
    savedRolls:any[],
    selectedEmpire:string,
    empires:any[]
}

export interface ServerData {
    globalData:{
        timeScale:number,
        weatherRain:number,
        weatherTimeOfDay:number,
        weatherFog:number
    },
    resourceIndex:any[],
    buildingIndex:any[]
}