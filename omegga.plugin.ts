//Code is messy, good luck trying to make sense of it all.

import OmeggaPlugin, { OL, PS, PC } from 'omegga';
import { Empire, Building, Resource, EmpireBuilding, EmpireResource } from 'src/classes';
import MERPCommands from './src/commands';
import { PlayerData, ServerData } from './src/interfaces';
import * as merpEval from './src/merpEval';

type Config = { foo: string };


export var x = 10

export default class MERPTools implements OmeggaPlugin<Config, Storage> {
  omegga: OL;
  config: PC<Config>;
  store: PS<Storage>;
  resourceChange:any;
  weatherChange:any;
  runLoop:any;

  constructor(omegga: OL, config: PC<Config>, store: PS<Storage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
    this.resourceChange = async function(){
      let serverData:ServerData = await this.store.get("ServerStore")
      for(let i = 0; i < serverData.allPlayers.length; i++){
        const player = serverData.allPlayers[i]
        let playerData:PlayerData = await this.store.get(player.id)
        if(playerData.empires.length != 0){
          playerData = MERPCommands.calcResourceChange(playerData,serverData)
          await this.store.set(player.id,playerData)
        }
      }  
    }
    this.weatherChange = async function(){
      let serverData:ServerData = await this.store.get("ServerStore")
      serverData = 
      await this.store.set("ServerStore",serverData)
    }
    this.runLoop = async function(){
      //This handles start up
      let runLoopServerData:ServerData = await this.store.get("ServerStore")
      if(this.config['enable-time-system']){
        if(this.config['realistic-day-night-cycle']){
        if(runLoopServerData.globalData.timeScale < 100){runLoopServerData.globalData.timeScale = 100}      
        } else{
          Omegga.loadEnvironmentData({Sky:{timeChangeSpeed:1,cloudSpeedMultiplier:1}})
        }
        runLoopServerData.runLoopData.countdown = Math.floor(runLoopServerData.globalData.time%86400/86400*runLoopServerData.globalData.timeScale);
      }
      //This handles every tick
      setInterval(async() =>{
        let serverData:ServerData = await this.store.get("ServerStore")
        serverData.runLoopData.countdown += 1/this.config['mechanics-simulation-quality'];
        serverData.globalData.time += 1/serverData.globalData.timeScale*86400/this.config['mechanics-simulation-quality'];
        if(this.config['enable-time-system']){
          if(this.config['realistic-day-night-cycle']){
            let nightDayModifier;
            //1 brickadia day is 2700 seconds, although night progresses twice as fast as day, to correct this day/night imbalance, I made night only half the normal speed.
            if(Math.floor((serverData.globalData.time%86400)/3600) >= 6 && Math.floor((serverData.globalData.time%86400)/3600) < 18) {nightDayModifier = 2} else {nightDayModifier = 1}
            if(serverData.globalData.timeScale < 0) {serverData.globalData.timeScale = 10}
            Omegga.loadEnvironmentData({Sky:{timeOfDay:(serverData.globalData.time%86400)/3600,timeChangeSpeed:1800/serverData.globalData.timeScale*nightDayModifier,cloudSpeedMultiplier:(1/nightDayModifier)*2}})
            
          }
        }
        const test = "string"
        test.match 
        if(this.config['enable-weather-system']){
          MERPCommands.calcWeatherChange(serverData)
        }
        //This handles the end of timescale completion
        if(serverData.runLoopData.countdown >= serverData.globalData.timeScale){
          if(this.config['enable-time-system']){
            if(this.config['realistic-day-night-cycle']){
              let weekday:any = Math.floor(serverData.globalData.time/86400);
              if(weekday%7 == 0){weekday = "Sunday"} else
              if(weekday%7 == 1){weekday = "Monday"} else
              if(weekday%7 == 2){weekday = "Tuesday"} else
              if(weekday%7 == 3){weekday = "Wednesday"} else
              if(weekday%7 == 4){weekday = "Thursday"} else
              if(weekday%7 == 5){weekday = "Friday"} else
              if(weekday%7 == 6){weekday = "Saturday"}
              let year:string|number = Math.floor(serverData.globalData.time/31104000)-100000000
              if(year < 0){
                year = year*-1
                if(year.toString().length !<= 5) {const a = 4-year.toString().length; for(let i = 0; i < a; i++){year = "0"+year; if(i+1==a){year = "-"+year}}}
              } else {
                if(year.toString().length !<= 4) {const a = 4-year.toString().length; for(let i = 0; i < a; i++){year = "0"+year}}
              }
              let month:string|number = Math.floor((serverData.globalData.time%31104000)/2592000)+1
              if(month.toString().length !<= 2) {const a = 2-month.toString().length; for(let i = 0; i < a; i++){month = "0"+month}} 
              let day:string|number = Math.floor((serverData.globalData.time%2592000)/86400)+1
              if(day.toString().length !<= 2) {const a = 2-day.toString().length; for(let i = 0; i < a; i++){day = "0"+day}}
              let hour:string|number = Math.floor((serverData.globalData.time%86400)/3600)
              if(hour.toString().length !<= 2) {const a = 2-hour.toString().length; for(let i = 0; i < a; i++){hour = "0"+hour}}
              let minute:string|number = Math.floor((serverData.globalData.time%3600)/60)
              if(minute.toString().length !<= 2) {const a = 2-minute.toString().length; for(let i = 0; i < a; i++){minute = "0"+minute}}
              Omegga.broadcast(`Today is ${weekday}, The date is now ${year}/${month}/${day}`)
            }
          }
          if(this.config['enable-resource-system']){
            this.resourceChange()
          }
          serverData.runLoopData.countdown = 0;
        }
        await this.store.set("ServerStore",serverData)
      },1000/this.config['mechanics-simulation-quality'])
      await this.store.set("ServerStore",runLoopServerData)
    }
  }

  async init() {
    Omegga.broadcast("MERP-Tools Loaded.")
    Omegga.broadcast('<size="12">Version 0.1</>')
    //Add basic resources to first time start
    let serverData:ServerData = await this.store.get("ServerStore")
    if(serverData == null) {
        serverData = {
          runLoopData:{
            countdown:0
          },
          globalData:{
            time:3110400000000000,
            timeScale:300,
            regionLatitiude:0, // 90 to -90
            regionMoisture:0,
            regionHumidity:0,
            regionTemperature:21, // In C
            regionWindSpeed:0,
            worldAxisTilt:23, // 0 to 90
          },
          allPlayers:[],
          defaultRolls:[],
          resourceIndex:[
            new Resource("Wood","ffffff","A Descriptor"),
            new Resource("Stone","ffffff","A Descriptor"),
            new Resource("Metal","ffffff","A Descriptor"),
            new Resource("Food","ffffff","A Descriptor")
          ],
          buildingIndex:[
            // Name, Cost, Production
            new Building("Lumber_Mill", "ffffff",[{resource:"Wood", amount:10},{resource:"Stone", amount:20}],[{resource:"Wood", amount:2}]),
            new Building("Quarry", "ffffff",[{resource:"Wood", amount:10},{resource:"Stone", amount:20}],[{resource:"Stone", amount:5}]),
            new Building("Smeltery", "ffffff",[{resource:"Wood", amount:10},{resource:"Stone", amount:20}],[{resource:"Metal", amount:2},{resource:"Stone", amount:-5}]),
            new Building("Farm", "ffffff",[{resource:"Wood", amount:10},{resource:"Stone", amount:20}],[{resource:"Food", amount:10}]),
          ],
          startingBuildingIndex:[],
          startingResourceIndex:[]
        }
      await this.store.set("ServerStore",serverData)
    }
    //Initalize mechanic loops
    this.runLoop();


    // MERP-Tools
    Omegga
    .on('join', async player => {
      try {
        let serverData:ServerData = await this.store.get("ServerStore")
        let playerData:PlayerData = await this.store.get(player.id)
        if(playerData === null){
          playerData = {
            savedRolls:[],
            selectedEmpire:null,
            empires:[]
          }
          for(let i = 0; i < serverData.defaultRolls.length; i++){
            playerData.savedRolls.push(serverData.defaultRolls[i])
          }
          await this.store.set(player.id,playerData)
          serverData.allPlayers.push(player);
          await this.store.set("ServerStore",serverData)
        };
      } catch (err) {
        console.error('Error giving player starting Data', err);
      }
    })

    //ROLLING COMMANDS

    //Basic Dice rolling
    .on('cmd:helpmerptools', (name: string, section:string, page:number) => {MERPCommands.helpList(name, section, page)})
    .on('cmd:roll', (name: string, limit:number, amount:number, modifier:number, silent?:number) => {MERPCommands.diceRoll(name, limit, amount, modifier, silent)})
    //Advanced Dice rolling, supports variables, numeric operators in an equation format, can be saved, but takes awhile longer to type out. 
    .on('cmd:advroll', (name: string, equation: string, silent?:number, ...args:string[]) => {
      const player = Omegga.getPlayer(name);
      if(equation === undefined) {
        Omegga.whisper(player,`Allowed formats:
        <color="ffff00">/AdvRoll</> <color="00ff00">[Equation]</> <color="ff0000">[Silent]</> - Allows you to use the advanced rolling format`)
        return;
      }
      MERPCommands.advancedRoll(name, equation, silent, ...args)
    })
    //Uses Advanced Dice rolling's equation formatting, same usage with an added "name" as the first parameter.
    .on('cmd:saveroll', async (name: string, rollName: string, equation: string) => {
      const player = Omegga.getPlayer(name)
      if(rollName === undefined|| equation === undefined) {
        Omegga.whisper(player,`Allowed formats:
        <color="ffff00">/SaveRoll</> <color="00ff00">[Preset Name] [Equation]</> <color="ff0000">[Silent]</> - Creates a new roll preset using the advanced rolling format`)
        return;
      }

      const savedRollObj = {
        label:rollName,
        equation:equation,
        description:"Use this space to explain your roll and what order the arguments might be in"
      }
      let playerData:PlayerData = await this.store.get(player.id)
      for(let i = 0; i < playerData.savedRolls.length; i++) {
        if (playerData.savedRolls[i].label == rollName) {
          Omegga.whisper(player,`You already have a roll preset named ${rollName}!`)
          return;
        }
      }
      playerData.savedRolls.push(savedRollObj)
      Omegga.whisper(player,`Saved roll preset ${rollName}!`)
      await this.store.set(player.id,playerData)
    })
    //Deletes a saved rolling equation
    .on('cmd:deleteroll', async (name: string, rollName: string) => {
      const player = Omegga.getPlayer(name)
      if(rollName === undefined) {
        Omegga.whisper(player,`Allowed formats:
        <color="ffff00">/DeleteRoll</> <color="00ff00">[Preset Name]</> <color="ff0000">[Silent]</> - Deletes a roll preset.`)
        return;
      }
      let playerData:PlayerData = await this.store.get(player.id)
      for(let i = 0; i < playerData.savedRolls.length; i++) {
        if (playerData.savedRolls[i].label == rollName) {
          playerData.savedRolls.splice(i,1)
          Omegga.whisper(player,`Deleted roll preset ${rollName}!`)
          await this.store.set(player.id,playerData)
          return;
        }
      }
      Omegga.whisper(player,`Couldn't find roll preset named ${rollName}!`)
    })
    //Lets you use saved adv roll equations much quicker
    .on('cmd:useroll', async (name: string, rollName: string, silent?:number, ...args:string[]) => {
      const player = Omegga.getPlayer(name)
      if(rollName === undefined) {
        Omegga.whisper(player,`Allowed formats:
        <color="ffff00">/UseRoll</> <color="00ff00">[Preset Name]</> <color="ff0000">[Silent]</> - Uses a roll preset. /RollPresets lets you view your presets`)
        return;
      }
      let playerData:PlayerData = await this.store.get(player.id)
      for(let i = 0; i < playerData.savedRolls.length; i++) {
        if (playerData.savedRolls[i].label == rollName) {
          const equation = playerData.savedRolls[i].equation
          MERPCommands.advancedRoll(name, equation, silent, ...args)
          return;
        }
      }
      Omegga.whisper(player,`Couldn't find roll preset named ${rollName}!`)
    })
    .on('cmd:setrolldescription', async (name: string, rollName: string, ...args:string[]) => {
      const player = Omegga.getPlayer(name)
      if(rollName === undefined|| args[0] === undefined) {
        Omegga.whisper(player,`Allowed formats:
        <color="ffff00">/SetRollDescription</> <color="00ff00">[Preset Name]</> <color="ff0000">...[Description]</> - Sets the roll preset's description.`)
        return;
      }
      let playerData:PlayerData = await this.store.get(player.id)
        for(let i = 0; i < playerData.savedRolls.length; i++) {
          if (playerData.savedRolls[i].label == rollName) {
            playerData.savedRolls[i].description = args.join(' ')
            await this.store.set(player.id,playerData)
            Omegga.whisper(player,`${rollName}'s description set to
            "${playerData.savedRolls[i].description}"`)
            return;
          }
        }
      
    })
    .on('cmd:rollpresets', async (name: string) => {
      const player = Omegga.getPlayer(name)
      let playerData:PlayerData = await this.store.get(player.id)
      if(playerData.savedRolls.length <= 0){
        Omegga.whisper(player,`You have no presets! Create one by using /saveroll`)
      }
      for(let i = 0; i < playerData.savedRolls.length; i++) {
        Omegga.whisper(player,`<color="ffff00"><size="24">${playerData.savedRolls[i].label}<color="ffffff">:</></> ${playerData.savedRolls[i].equation}</>`)
        Omegga.whisper(player,`<color="aaaaaa">${playerData.savedRolls[i].description}</>`)
      }
    })

    //EMPIRE COMMANDS

    //Creates an empire for a player
    .on('cmd:createempire', async (name: string, ...empireInput:string[]) => {
      let empireName = empireInput.join(' ')
      const player = Omegga.getPlayer(name);
      if(empireName[0] === undefined) {
        Omegga.whisper(player,'<color="ffff00">/CreateEmpire</> <color="00ff00">[Empire Name]</>')
        return;
      }
      let playerData:PlayerData = await this.store.get(player.id)
      for(let i = 0; i < playerData.empires.length; i++) {
        if(playerData.empires[i].name == empireName){
          Omegga.whisper(player, `You already have an empire named ${empireName}!`)
          return;
        }
      }
        playerData.empires.push(new Empire(empireName,"ffffff"))
        let empireIndex;
        for(let i = 0; i < playerData.empires.length; i++){
          if(playerData.empires[i].name == empireName){
            empireIndex = i
          }
        }
        for(let i = 0; i < serverData.startingResourceIndex.length; i++){
          playerData.empires[empireIndex].resources.push(new EmpireResource(serverData.startingResourceIndex[i].name,serverData.startingResourceIndex[i].amount))
        }
        for(let i = 0; i < serverData.startingBuildingIndex.length; i++){
          playerData.empires[empireIndex].buildings.push(new EmpireBuilding(serverData.startingBuildingIndex[i].name,serverData.startingBuildingIndex[i].amount))
        }
        playerData.selectedEmpire = empireName
        Omegga.broadcast(`${name} has created ${empireName}!`);
        Omegga.whisper(player, `Automatically switched empire identity to ${empireName}.
        to switch empires, use /switchempire [name]`);
        await this.store.set(player.id,playerData);
    })
    //Colors a player's empire
    .on('cmd:empirecolor', async (name: string, color:string, ...empireInput:string[]) => {
      let empireName = empireInput.join(' ')
      const player = Omegga.getPlayer(name);
      if(empireName === undefined|| color === undefined) {
        Omegga.whisper(player,`Allowed formats:
        <color="ffff00">/EmpireColor</> <color="00ff00">[Empire Name] [Color]</> - Allows you to recolor a specified empire`)
        return;
      }
      let playerData:PlayerData = await this.store.get(player.id)

      for(let i = 0; i < playerData.empires.length; i++) {
        if(playerData.empires[i].name == empireName){
          
          const match = color.match(
            /(?<x>-?[0-9a-f]{6})?/i
          );
          if(!match.groups.x) {
            Omegga.whisper(player, `Invalid Color!`)
            return;
          }
          playerData.empires[i].color = color
          await this.store.set(player.id,playerData);
          Omegga.whisper(player, `Successfuly changed <color="${color}">${empireName}'s</> color to ${color}!`)
          return;
        }
      }
        Omegga.whisper(player, `You dont have an empire named ${empireName}!`);
    })
    //Deletes a player's empire
    .on('cmd:deleteempire', async (name: string, ...empireInput:string[]) => {
      let empireName = empireInput.join(' ')
      const player = Omegga.getPlayer(name);
      if(empireName === undefined) {
        Omegga.whisper(player,`Allowed formats:
        <color="ffff00">/DeleteEmpire</> <color="00ff00">[Empire Name]</> - Deletes a specifed empire`)
        return;
      }
      let playerData:PlayerData = await this.store.get(player.id)
      for(let i = 0; i < playerData.empires.length; i++) {
        if(playerData.empires[i].name == empireName){
          playerData.empires.splice(i,1)
          await this.store.set(player.id,playerData);
          Omegga.whisper(player, `Empire ${empireName} deleted successfully!`)
          return;
        }
      }
      Omegga.whisper(player, `Couldn't find empire ${empireName}`);
    })
    //Enables switches between a player's empires
    .on('cmd:switchempire', async (name: string, ...empireInput:string[]) => {
      let empireName = empireInput.join(' ')
      const player = Omegga.getPlayer(name);
      if(empireName === undefined) {
        Omegga.whisper(player,`Allowed formats:
        <color="ffff00">/SwitchEmpire</> <color="00ff00">[Empire Name]</> - Switches your empire alias a specifed empire you own`)
        return;
      }
      let playerData:PlayerData = await this.store.get(player.id)
      for(let i = 0; i < playerData.empires.length; i++) {
        if(playerData.empires[i].name == empireName){
          playerData.selectedEmpire = empireName
          await this.store.set(player.id,playerData);
          Omegga.whisper(player, `Switched empire identity to ${empireName}!`)
          return;
        }
      }
      Omegga.whisper(player, `Couldn't find empire ${empireName}!`)
    })
    //Lists a players empires

    //NOTE TO SELF: REDO THIS CODE. Doesn't work as intended, and is messy.
    .on('cmd:playerinfo', async (name: string, ...user:string[]) => { 
      let target:string;
      if(user[0] === undefined) {
        target = name;
      } else {
        target = user.join(' ')
      }
      const player = Omegga.getPlayer(target);
      if(player === undefined) {
        Omegga.whisper(Omegga.getPlayer(name),`Couldn't find player ${target}`)
        return;
      }
      let playerData:PlayerData = await this.store.get(player.id)
        if(playerData.empires.length === 0) {
          Omegga.whisper(Omegga.getPlayer(name),`<size="24">${target}'s Empires</>
          This player has no empires!`)
        } else {
          Omegga.whisper(Omegga.getPlayer(name),`<size="24">${target}'s Empires</>`)
          for(let i = 0; i < playerData.empires.length; i++) {
            Omegga.whisper(player,`<color="${playerData.empires[i].color}">${playerData.empires[i].name}</>`)
          }
        }
      }).
      //Speaking as your empire.
      on('cmd:s', async (name: string, ...args: string[]) => {
        const player = Omegga.getPlayer(name);
        if(args[0] === undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/S</> <color="00ff00">[Text]</> - Allows you to speak, under an empire alias`)
          return;
        }
        let playerData:PlayerData = await this.store.get(player.id)
        if(playerData.selectedEmpire === null|| playerData.selectedEmpire === undefined) {
          Omegga.whisper(player, `You dont have an empire identity selected! Use /switchempire [name] If you dont have an empire, Use /createempire [name]`);
          return;
        }
        for(let i = 0; i < playerData.empires.length; i++) {
          if(playerData.empires[i].name === playerData.selectedEmpire) {
            Omegga.broadcast(`<color="00ffff"><size="12">></></> <b><color="${playerData.empires[i].color}">${playerData.selectedEmpire}</></>: ${args.join(' '
            )}`)
          }
        }
      })
      //when your data gets corrupted, or you want to clear your data
      .on('cmd:resetplayerdata', async (name: string) => {
        const player = Omegga.getPlayer(name);
        let serverData:ServerData = await this.store.get("ServerStore")
        let playerData:PlayerData = await this.store.get(player.id)
        playerData = {
          selectedEmpire:null,
          savedRolls:[],
          empires:[]
        }
        for(let i = 0; i < serverData.defaultRolls.length; i++){
          playerData.savedRolls.push(serverData.defaultRolls[i])
        }
        Omegga.whisper(player, `Player data reset!`);
        await this.store.set(player.id,playerData)
      })
      //Resets resources to default state
      .on('cmd:resetserverdata', async (name: string) => {
        const player = Omegga.getPlayer(name);
        if(!this.validate(name)){
          return;
        }
        
        let serverData:ServerData = await this.store.get("ServerStore")
        serverData = {
          runLoopData:{
            countdown:0,
          },
          globalData:{
            time:3110400000000000,
            timeScale:300,
            regionLatitiude:0, // 90 to -90
            regionMoisture:0,
            regionHumidity:0,
            regionTemperature:21, // In C
            regionWindSpeed:0,
            worldAxisTilt:23, // 0 to 90
          },
          allPlayers:[],
          defaultRolls:[],
          resourceIndex:[
            new Resource("Wood","ffffff","A Descriptor."),
            new Resource("Stone","ffffff","A Descriptor."),
            new Resource("Metal","ffffff","A Descriptor."),
            new Resource("Food","ffffff","A Descriptor.")
          ],
          buildingIndex:[
            // Name, Color, Cost, Production
            new Building("Lumber_Mill", "ffffff",[{resource:"Wood", amount:10},{resource:"Stone", amount:20}],[{resource:"Wood", amount:2}]),
            new Building("Quarry", "ffffff",[{resource:"Wood", amount:10},{resource:"Stone", amount:20}],[{resource:"Stone", amount:5}]),
            new Building("Smeltery", "ffffff",[{resource:"Wood", amount:10},{resource:"Stone", amount:20}],[{resource:"Metal", amount:2},{resource:"Stone", amount:-5}]),
            new Building("Farm", "ffffff",[{resource:"Wood", amount:10},{resource:"Stone", amount:20}],[{resource:"Food", amount:10}]),
          ],
          startingBuildingIndex:[],
          startingResourceIndex:[]
        }
        for(let i = 0; i < Omegga.getPlayers().length; i++ ){
          let selectedPlayer = Omegga.getPlayers()[i]
          let onlinePlayer = Omegga.getPlayer(selectedPlayer.name)
          serverData.allPlayers.push(onlinePlayer);
        }
        
        Omegga.whisper(player, `Resource data has been reset!`);
        await this.store.set("ServerStore",serverData)
      })
      //Views the list of resources the server has
      .on('cmd:resourcelist', async (name: string) => {
        const player = Omegga.getPlayer(name);
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        Omegga.whisper(player,`<color="ffff00"><size="24">Resource List</></>`)
        if(serverData.resourceIndex[0] == null) {
          Omegga.whisper(player,`<color="777777"><size="20">There are no resources!</></>`)
        }
        for(let i = 0; i < serverData.resourceIndex.length; i++) {
          Omegga.whisper(player,`<color="${serverData.resourceIndex[i].color}">${serverData.resourceIndex[i].name}</>
          <color="aaaaaa"><size="16">${serverData.resourceIndex[i].description}</></>`)
        }
        
      })
      .on('cmd:deleteresource', async (name: string, resource:string) => {
        const player = Omegga.getPlayer(name);
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        if(!this.validate(name)){
          return;
        }
        if(resource === undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/DeleteResource</> <color="00ff00">[Resource]</> - Removes a resource from the active resource list`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        for(let i = 0; i < serverData.resourceIndex.length; i++){
          if(serverData.resourceIndex[i].name.toLowerCase() == resource.toLowerCase()) {
            serverData.resourceIndex.splice(i,1)
            await this.store.set("ServerStore",serverData)
            Omegga.whisper(player, `Resource ${resource} deleted succesfully!`);
            return;
          }
        }
          Omegga.whisper(player, `Resource ${resource} doesn't exist!`);
          return;
      })
      .on('cmd:addresource', async (name: string, resource:string, color:string, ...description:string[]) => {
        const player = Omegga.getPlayer(name);
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        if(!this.validate(name)){
          return;
        }
        if(resource === undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/AddResource</> <color="00ff00">[Resource]</> <color="ff0000">[Color] [Description]</> - Adds a resource to the active resource list`)
          return;
        }
        if(color === undefined) {
          color = "ffffff"
        } else {
          const match = color.match(
            /(?<x>-?[0-9a-f]{6})?/i
          );
          if(!match.groups.x) {
            Omegga.whisper(player, `Invalid Color!`)
            return;
          }
        }
        if(description[0] === undefined) {
          description[0] = "A Descriptor."
        }

        let serverData:ServerData = await this.store.get("ServerStore")
        for(let i = 0; i < serverData.resourceIndex.length; i++){
          if(serverData.resourceIndex[i].name.toLowerCase() == resource.toLowerCase()) {
            Omegga.whisper(player, `Resource ${resource} already exists!`);
            return;
          }
        }
          serverData.resourceIndex.push(new Resource(resource,color,description))
          Omegga.whisper(player, `Resource ${resource} added succesfully!`);
          await this.store.set("ServerStore",serverData)
      })
      .on('cmd:setresourcecolor', async (name: string, resource:string, color:string) => {
        const player = Omegga.getPlayer(name);
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        if(!this.validate(name)){
          return;
        }
        if(resource === undefined || color === undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/SetResourceColor</> <color="00ff00">[Resource] [Color] </> - Sets a color value to an active resource`)
          return;
        }
        const match = color.match(
          /(?<x>-?[0-9a-f]{6})?/i
        );
        if(!match.groups.x) {
          Omegga.whisper(player, `Invalid Color!`)
          return;
        }
        for(let i = 0; i < serverData.resourceIndex.length; i++){
          if(serverData.resourceIndex[i].name.toLowerCase() == resource.toLowerCase()) {
            serverData.resourceIndex[i].color = color
            await this.store.set("ServerStore",serverData)
            Omegga.whisper(player, `<color="${color}">${resource}'s</> color set successfully!`)
            return;
          }
        }
        Omegga.whisper(player, `Couldn't find resource ${resource}!`)
      })
      .on('cmd:buildinglist', async (name: string) => {
        const player = Omegga.getPlayer(name);
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        Omegga.whisper(player,`<color="ffff00"><size="24">Building List</></>`)
        if(serverData.buildingIndex[0] == null) {
          Omegga.whisper(player,`<color="777777"><size="20">There are no buildings!</></>`)
          return;
        }
        
        for(let i = 0; i < serverData.buildingIndex.length; i++) {
          let message = '';
          message += `<color="${serverData.buildingIndex[i].color}">${serverData.buildingIndex[i].name} </>`
          message += '<color="ffff00"><size="14">Costs:  </></>'
          for(let j = 0; j < serverData.buildingIndex[i].cost.length; j++){
            message += `<color="aaaaaa"><size="10">${serverData.buildingIndex[i].cost[j].resource}<color="ffffff">:</> ${serverData.buildingIndex[i].cost[j].amount} </></>`
            if(j+1 < serverData.buildingIndex[i].cost.length) {
              message += `, `
            }
          }
          message +='<color="ffff00"><size="14">Produces:  </></>'
          for(let j = 0; j < serverData.buildingIndex[i].production.length; j++){
            message += `<color="aaaaaa"><size="10">${serverData.buildingIndex[i].production[j].resource}<color="ffffff">:</> ${serverData.buildingIndex[i].production[j].amount} </></>`
            if(j+1 < serverData.buildingIndex[i].production.length) {
              message += `, `
            }
          }
          Omegga.whisper(player,message)
        }
        
        
      })

      .on('cmd:deletebuilding', async (name: string, building:string) => {
        const player = Omegga.getPlayer(name);
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        if(!this.validate(name)){
          return;
        }
        if(building === undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/DeleteBuilding</> <color="00ff00">[Building]</> - Removes a building from the active building list`)
          return;
        }

        for(let i = 0; i < serverData.buildingIndex.length; i++){
          if(serverData.buildingIndex[i].name.toLowerCase() == building.toLowerCase()) {
            serverData.buildingIndex.splice(i,1)
            await this.store.set("ServerStore",serverData)
            Omegga.whisper(player, `Building ${building} deleted succesfully!`);
            return;
          }
        }
          Omegga.whisper(player, `Building ${building} doesn't exist!`);
          return;

      })
      .on('cmd:addbuilding', async (name: string, building:string, color:string) => {
        const player = Omegga.getPlayer(name);
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        if(!this.validate(name)){
          return;
        }
        if(building === undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/AddBuilding</> <color="00ff00">[Building]</> <color="ff0000">[Color] </> - Adds a building to the active building list`)
          return;
        }
        if(color === undefined) {
          color = "ffffff"
        } else {
          const match = color.match(
            /(?<x>-?[0-9a-f]{6})?/i
          );
          if(!match.groups.x) {
            Omegga.whisper(player, `Invalid Color!`)
            return;
          }
        }

        let serverData:ServerData = await this.store.get("ServerStore")
        for(let i = 0; i < serverData.buildingIndex.length; i++){
          if(serverData.buildingIndex[i].name.toLowerCase() == building.toLowerCase()) {
            Omegga.whisper(player, `Building <color="${serverData.buildingIndex[i].color}">${building}</> already exists!`);
            return;
          }
        }
          serverData.buildingIndex.push(new Building(building,color,[],[]))
          Omegga.whisper(player, `Building <color="${color}">${building}</> added succesfully! To set a cost, use /SetBuildingCost. To set production, use /SetBuildingProduction `);
          await this.store.set("ServerStore",serverData)
      })

      .on('cmd:setbuildingcost', async (name: string, building:string, ...cost:string[]) => {
        const player = Omegga.getPlayer(name);
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        if(!this.validate(name)){
          return;
        }
        if(building === undefined || cost[0] === undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/AddBuilding</> <color="00ff00">[Building] ...[Resource] [Value] </> - Sets a cost value to an active building`)
          return;
        }
        if(cost.length % 2 === 1) {
          Omegga.whisper(player, `Resource and Value pairs are required.`);
        }
        for(let i = 0; i < cost.length; i++){
          let error = true;
          for(let j = 0; j < serverData.resourceIndex.length; j++){
            if(cost[i].toLowerCase() == serverData.resourceIndex[j].name.toLowerCase()) {
              error = false;
            }
          }
          if(error){
            Omegga.whisper(player, `1st Value is the building, 2nd is the resource, 3rd is the Value, 4th repeats 2nd, 5th repeats 3rd, resource and value pairs are required.`);
            return;
          }
          i++
          if(typeof(parseInt(cost[i])) !== 'number') {
            Omegga.whisper(player, `1st Value is the building, 2nd is the resource, 3rd is the Value, 4th repeats 2nd, 5th repeats 3rd, resource and value pairs are required.`);
            return;
          }
        }
        for(let i = 0; i < serverData.buildingIndex.length; i++){
          if(serverData.buildingIndex[i].name.toLowerCase() == building.toLowerCase()) {
            serverData.buildingIndex[i].cost = []
            for(let j = 0; j < cost.length; j += 2){
              serverData.buildingIndex[i].cost.push({resource:cost[j], amount:cost[j+1]})
            }
            await this.store.set("ServerStore",serverData)
            Omegga.whisper(player, 'Properties on building cost set!');
            return;
          }
        }
        Omegga.whisper(player, `Building <color="ffffff">${building}</> doesn't exist!`);
      })

      .on('cmd:setbuildingproduction', async (name: string, building:string, ...production:string[]) => {
        const player = Omegga.getPlayer(name);
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        if(!this.validate(name)){
          return;
        }
        if(building === undefined || production[0] === undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/AddBuilding</> <color="00ff00">[Building] ...[Resource] [Value] </> - Sets a production value to an active building`)
          return;
        }
        if(production.length % 2 === 1) {
          Omegga.whisper(player, `Resource and Value pairs are required.`);
        }
        for(let i = 0; i < production.length; i++){
          let error = true;
          for(let j = 0; j < serverData.resourceIndex.length; j++){
            if(production[i].toLowerCase() == serverData.resourceIndex[j].name.toLowerCase()) {
              error = false;
            }
          }
          if(error){
            Omegga.whisper(player, `1st Value is the building, 2nd is the resource, 3rd is the Value, 4th repeats 2nd, 5th repeats 3rd, resource and value pairs are required.`);
            return;
          }
          i++
          if(typeof(parseInt(production[i])) !== 'number') {
            Omegga.whisper(player, `1st Value is the building, 2nd is the resource, 3rd is the Value, 4th repeats 2nd, 5th repeats 3rd, resource and value pairs are required.`);
            return;
          }
        }
        for(let i = 0; i < serverData.buildingIndex.length; i++){
          if(serverData.buildingIndex[i].name.toLowerCase() == building.toLowerCase()) {
            serverData.buildingIndex[i].production = []
            for(let j = 0; j < production.length; j += 2){
              serverData.buildingIndex[i].production.push({resource:production[j], amount:production[j+1]})
            }
            await this.store.set("ServerStore",serverData)
            Omegga.whisper(player, 'Properties on building production set!');
            return;
          }
        }
        Omegga.whisper(player, `Building <color="ffffff">${building}</> doesn't exist!`);
      })

      .on('cmd:setbuildingcolor', async (name: string, building:string, color:string) => {
        const player = Omegga.getPlayer(name);
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        if(!this.validate(name)){
          return;
        }
        if(building === undefined || color === undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/SetBuildingColor</> <color="00ff00">[Building] [Color] </> - Sets a color value to an active building`)
          return;
        }
        const match = color.match(
          /(?<x>-?[0-9a-f]{6})?/i
        );
        if(!match.groups.x) {
          Omegga.whisper(player, `Invalid Color!`)
          return;
        }
        for(let i = 0; i < serverData.buildingIndex.length; i++){
          if(serverData.buildingIndex[i].name.toLowerCase() == building.toLowerCase()) {
            serverData.buildingIndex[i].color = color
            await this.store.set("ServerStore",serverData)
            Omegga.whisper(player, `<color="${color}">${building}'s</> color set successfully!`)
            return;
          }
        }
        Omegga.whisper(player, `Couldn't find building ${building}!`)
      })

      .on('cmd:build', async (name: string, building:string, amount) => {
        const player = Omegga.getPlayer(name);
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        if(building === undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/Build</> <color="00ff00">[Building]</><color="ff0000"> [Amount] </> - Builds a building that generates resources on your selected empire's behalf`)
          return;
        }
        amount = parseInt(amount)
        if(amount === undefined||Number.isNaN(amount)||amount < 0) {
          amount = 1
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        let selectedBuildingIndex;
        let buildingFound = false
        for(let i = 0; i < serverData.buildingIndex.length; i++) {
          if(serverData.buildingIndex[i].name.toLowerCase() == building.toLowerCase()) {
            selectedBuildingIndex = i;
            buildingFound = true;
          }
        }
        if(!buildingFound) {
          Omegga.whisper(player, `Couldn't find building ${building}!`)
          return;
        }

        let playerData:PlayerData = await this.store.get(player.id)
        if(playerData.selectedEmpire === null|| playerData.selectedEmpire === undefined) {
          Omegga.whisper(player, `You dont have an empire identity selected! Use /switchempire [name] If you dont have an empire, Use /createempire [name]`);
          return;
        }
        //Find the selected empire's index position
        let empireIndex;
        for(let i = 0; i < playerData.empires.length; i++) {
          if(playerData.empires[i].name == playerData.selectedEmpire) {
            empireIndex = i;
          }
        }
        let failCostMessage = ``;
        let storedI = [];
        let storedJ = [];
        let storedK = [];
        //Check if the player has enough resources to build
        if(playerData.empires[empireIndex].resources.length == 0) {
          failCostMessage = `Not enough resources!`
        } else{
          for(let i = 0; i < playerData.empires[empireIndex].resources.length; i++) {
            for(let j = 0; j < serverData.buildingIndex.length; j++) {
              //Filter out all buildings unrelated to the command
              if(serverData.buildingIndex[j].name.toLowerCase() == building.toLowerCase()){
                for(let k = 0; k < serverData.buildingIndex[k].cost.length; k++) {
                  //Checks if one of the empire's resources matches any of the building's costs 
                  if(playerData.empires[empireIndex].resources[i].name == serverData.buildingIndex[j].cost[k].resource){
                    //Checks if that resource's amount is greater than the cost's amount
                    if(playerData.empires[empireIndex].resources[i].amount >= serverData.buildingIndex[j].cost[k].amount*amount){
                      storedI.push(i)
                      storedJ.push(j)
                      storedK.push(k)
                    } else {
                      failCostMessage = `Not enough resources!`
                    }
                  }
                }
              }
            }
          }
        }
        if(failCostMessage != ``){
          Omegga.whisper(player,failCostMessage)
        } else {
          for(let a = 0; a < storedI.length; a++){
            playerData.empires[empireIndex].resources[storedI[a]].amount += -serverData.buildingIndex[storedJ[a]].cost[storedK[a]].amount*amount
          }
          let buildingFound = false;
          for(let a = 0; a < playerData.empires[empireIndex].buildings.length ; a++ ) {
            //If a building is already found, simply add to it's amount property
            if(playerData.empires[empireIndex].buildings[a].name.toLowerCase() == building.toLowerCase()){
              playerData.empires[empireIndex].buildings[a].amount += amount;
              buildingFound = true;
            }
          }
          //If a building not is found, make a new object from the EmpireBuilding Class
          if(!buildingFound) {
            playerData.empires[empireIndex].buildings.push(new EmpireBuilding(serverData.buildingIndex[selectedBuildingIndex].name,amount))
          }
          await this.store.set(player.id,playerData)
          Omegga.whisper(player,`Built ${amount} ${building} successfully!`)
        }
      })
      .on('cmd:viewempirebuildings', async (name: string, empire:string) => {
        const player = Omegga.getPlayer(name);
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let playerData:PlayerData = await this.store.get(player.id)
        if(empire === undefined) {
          if(playerData.selectedEmpire === null|| playerData.selectedEmpire === undefined) {
            Omegga.whisper(player, `You dont have an empire identity selected! Use /switchempire [name] If you dont have an empire, Use /createempire [name]`);
            return;
          }
          empire = playerData.selectedEmpire
        } else {
          for(let i = 0; i < playerData.empires.length; i++) {
            if(playerData.empires[i].name != empire) {
              Omegga.whisper(player,`Can't find empire ${empire}!`)
              return;
            }
          }
        }
        //Find the selected empire's index position
        let empireIndex;
        for(let i = 0; i < playerData.empires.length; i++) {
          if(playerData.empires[i].name == playerData.selectedEmpire) {
            empireIndex = i;
          }
        }
        Omegga.whisper(player,`<color="ffff00"><size="24">${empire} Empire's Buildings</></>`)

        for(let i = 0; i < playerData.empires[empireIndex].buildings.length; i++){
          Omegga.whisper(player,`${playerData.empires[empireIndex].buildings[i].name}: ${playerData.empires[empireIndex].buildings[i].amount}`)
        }
        if(playerData.empires[empireIndex].buildings.length === 0) {
          Omegga.whisper(player,`This empire has no buildings!`)
        }
      })
      .on('cmd:demolish', async (name: string, building:string, amount) => {
        const player = Omegga.getPlayer(name);
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        if(building === undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/Demolish</> <color="00ff00">[Building]</><color="ff0000"> [Amount] </> - Destroys a building that generates resources on your selected empire's behalf, giving back a % of the build cost`)
          return;
        }
        amount = parseInt(amount)
        if(amount === undefined||Number.isNaN(amount)||amount < 0) {
          amount = 1
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        let playerData:PlayerData = await this.store.get(player.id)
        
        if(playerData.selectedEmpire === null|| playerData.selectedEmpire === undefined) {
          Omegga.whisper(player, `You dont have an empire identity selected! Use /switchempire [name] If you dont have an empire, Use /createempire [name]`);
          return;
        }
        //Find the selected empire's index position
        let empireIndex;
        for(let i = 0; i < playerData.empires.length; i++) {
          if(playerData.empires[i].name == playerData.selectedEmpire) {
            empireIndex = i;
          }
        }
        //Get the building from the playerdata
        let selectedBuildingIndex;
        let buildingFound = false
        for(let i = 0; i < playerData.empires[empireIndex].buildings.length; i++) {
          if(playerData.empires[empireIndex].buildings[i].name.toLowerCase() == building.toLowerCase()) {
            selectedBuildingIndex = i;
            buildingFound = true;
          }
        }
        if(!buildingFound) {
          Omegga.whisper(player, `Couldn't find building ${building}!`)
          return;
        } else {
          let prevAmount = playerData.empires[empireIndex].buildings[selectedBuildingIndex].amount
          playerData.empires[empireIndex].buildings[selectedBuildingIndex].amount += -amount
          //Refund spent resources
          for(let i = 0; i < serverData.buildingIndex.length; i++) {
            //Check if building matches the search
            
            if(serverData.buildingIndex[i].name.toLowerCase() == building.toLowerCase()) {
              for(let j = 0; j < playerData.empires[empireIndex].resources.length; j++) {
                for(let k = 0; k < serverData.buildingIndex[i].cost.length; k++) {
                  if(playerData.empires[empireIndex].resources[j].name == serverData.buildingIndex[i].cost[k].resource){
                    //Add a refund percentage reduction to this later...
                    playerData.empires[empireIndex].resources[j].amount += serverData.buildingIndex[i].cost[k].amount*amount
                  }
                }
              }
            }
          }
          if(playerData.empires[empireIndex].buildings[selectedBuildingIndex].amount < 0) {
            playerData.empires[empireIndex].buildings.splice(selectedBuildingIndex,1)
          } else {
          }
          this.store.set(player.id,playerData)
          if(playerData.empires[empireIndex].buildings[selectedBuildingIndex] === null||playerData.empires[empireIndex].buildings[selectedBuildingIndex] === undefined){
            Omegga.whisper(player, `Successfully demolished ${prevAmount} ${building}'s !`)
          } else {
            Omegga.whisper(player, `Successfully demolished ${prevAmount - playerData.empires[empireIndex].buildings[selectedBuildingIndex].amount} ${building}'s !`)
          }
        }
      })

      .on('cmd:settimescale', async (name: string,  value) => {
        const player = Omegga.getPlayer(name)
        let serverData:ServerData = await this.store.get("ServerStore")
        if(value == undefined|| value == "") {
          Omegga.whisper(player,`The current timescale is, ${serverData.globalData.timeScale} seconds per day!`)
        } else {
          if(!this.validate(name)){
            return;
          }
          if(this.config['realistic-day-night-cycle']){
            if(value < 100) {value = 100; Omegga.whisper(player,`Realistic day night cycles must be turned off if you want time to go faster than 100s per day`)}
          } else {
            if(value <= 0.1) {value = 0.1}
          }
          serverData.globalData.timeScale = value;
          serverData.runLoopData.countdown = Math.floor(serverData.globalData.time%86400/86400*serverData.globalData.timeScale)
          Omegga.whisper(player,`Timescale set to, ${serverData.globalData.timeScale} seconds per day!`)
          this.store.set("ServerStore",serverData)
        }
      })
      .on('cmd:settime', async (name: string, yearInput:number, monthInput:number, dayInput:number, hourInput:number, minuteInput:number) => {
        const player = Omegga.getPlayer(name)
        if(!this.config['enable-time-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Time system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        if(yearInput == undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/SetTime</> <color="00ff00">[Year]</><color="ff0000"> [Month] [Day] [Hour] [Minute] </> - Sets the plugin's time.`)
          return;
        } else {
          if(!this.validate(name)){
            return;
          }
          if(monthInput == undefined){monthInput = 1}
          if(dayInput == undefined){dayInput = 1}
          if(hourInput == undefined){hourInput = 0}
          if(minuteInput == undefined){minuteInput = 0}
          serverData.globalData.time = 3110400000000000+yearInput*31104000+(monthInput-1)*2592000+(dayInput-1)*86400+hourInput*3600+minuteInput*60
          if(yearInput > 100000000 || yearInput < -100000000) {
            Omegga.whisper(player,`You can only set the year in between -100,000,000 and 100,000,000!`)
            return;
          }
          serverData.runLoopData.countdown = Math.floor(serverData.globalData.time%86400/86400*serverData.globalData.timeScale);
          let year:string|number = Math.floor(serverData.globalData.time/31104000)-100000000
          if(year < 0){
            year = year*-1
            if(year.toString().length !<= 5) {const a = 4-year.toString().length; for(let i = 0; i < a; i++){year = "0"+year; if(i+1==a){year = "-"+year}}}
          } else {
            if(year.toString().length !<= 4) {const a = 4-year.toString().length; for(let i = 0; i < a; i++){year = "0"+year}}
          }
          let month:string|number = Math.floor((serverData.globalData.time%31104000)/2592000)+1
          if(month.toString().length !<= 2) {const a = 2-month.toString().length; for(let i = 0; i < a; i++){month = "0"+month}} 
          let day:string|number = Math.floor((serverData.globalData.time%2592000)/86400)+1
          if(day.toString().length !<= 2) {const a = 2-day.toString().length; for(let i = 0; i < a; i++){day = "0"+day}}
          let hour:string|number = Math.floor((serverData.globalData.time%86400)/3600)
          if(hour.toString().length !<= 2) {const a = 2-hour.toString().length; for(let i = 0; i < a; i++){hour = "0"+hour}}
          let minute:string|number = Math.floor((serverData.globalData.time%3600)/60)
          if(minute.toString().length !<= 2) {const a = 2-minute.toString().length; for(let i = 0; i < a; i++){minute = "0"+minute}}
          Omegga.whisper(player,`Time set to ${year}/${month}/${day} ${hour}:${minute}!`)
          this.store.set("ServerStore",serverData)
        }
      })
      .on('cmd:time', async (name: string) => {
        const player = Omegga.getPlayer(name)
        if(!this.config['enable-time-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Time system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        let year:string|number = Math.floor(serverData.globalData.time/31104000)-100000000
        if(year < 0){
          year = year*-1
          if(year.toString().length !<= 5) {const a = 4-year.toString().length; for(let i = 0; i < a; i++){year = "0"+year; if(i+1==a){year = "-"+year}}}
        } else {
          if(year.toString().length !<= 4) {const a = 4-year.toString().length; for(let i = 0; i < a; i++){year = "0"+year}}
        }
        let month:string|number = Math.floor((serverData.globalData.time%31104000)/2592000)+1
        if(month.toString().length !<= 2) {const a = 2-month.toString().length; for(let i = 0; i < a; i++){month = "0"+month}} 
        let day:string|number = Math.floor((serverData.globalData.time%2592000)/86400)+1
        if(day.toString().length !<= 2) {const a = 2-day.toString().length; for(let i = 0; i < a; i++){day = "0"+day}}
        let hour:string|number = Math.floor((serverData.globalData.time%86400)/3600)
        if(hour.toString().length !<= 2) {const a = 2-hour.toString().length; for(let i = 0; i < a; i++){hour = "0"+hour}}
        let minute:string|number = Math.floor((serverData.globalData.time%3600)/60)
        if(minute.toString().length !<= 2) {const a = 2-minute.toString().length; for(let i = 0; i < a; i++){minute = "0"+minute}}
        Omegga.whisper(player,`The time is, ${year}/${month}/${day} ${hour}:${minute}!`)
      })
      .on('cmd:viewempireresources', async (name: string, empire:string) => {
        const player = Omegga.getPlayer(name);
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let playerData:PlayerData = await this.store.get(player.id)
        if(empire === undefined) {
          if(playerData.selectedEmpire === null|| playerData.selectedEmpire === undefined) {
            Omegga.whisper(player, `You dont have an empire identity selected! Use /switchempire [name] If you dont have an empire, Use /createempire [name]`);
            return;
          }
          empire = playerData.selectedEmpire
        } else {
          for(let i = 0; i < playerData.empires.length; i++) {
            if(playerData.empires[i].name != empire) {
              Omegga.whisper(player,`Can't find empire ${empire}!`)
              return;
            }
          }
        }
        //Find the selected empire's index position
        let empireIndex;
        for(let i = 0; i < playerData.empires.length; i++) {
          if(playerData.empires[i].name == playerData.selectedEmpire) {
            empireIndex = i;
          }
        }
        Omegga.whisper(player,`<color="ffff00"><size="24">${empire} Empire's Resources</></>`)

        for(let i = 0; i < playerData.empires[empireIndex].resources.length; i++){
          Omegga.whisper(player,`${playerData.empires[empireIndex].resources[i].name}: ${playerData.empires[empireIndex].resources[i].amount}`)
        }
        if(playerData.empires[empireIndex].resources.length === 0) {
          Omegga.whisper(player,`This empire has no resources!`)
        }
      })
      .on('cmd:empireinitalizetrade', async (name: string, ...empireInput:string[]) => {
        //This command is going to initalize a trade offer to another empire.
        let empireName = empireInput.join(' ')
        const player = Omegga.getPlayer(name)
        if(empireName == undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/Timer</> <color="00ff00">[Time]</><color="ff0000"> [Description] </> - Sets a timer to go off, time is in seconds`)
          return;
        }
        Omegga.whisper(player,`Not working right now.`)
      })
      .on('cmd:addstartingresource', async (name: string, resource:string, amount:string) => {
        if(!this.validate(name)){
          return;
        }
        const player = Omegga.getPlayer(name)
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        if(resource == undefined|| amount == undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/AddStartingResource</> <color="00ff00">[Resource] [Amount]</> - Adds a resource empries get upon their creation `)
          return;
        }
        for(let i = 0; i < serverData.startingResourceIndex.length; i++){
          if(serverData.startingResourceIndex[i].name == resource){
            Omegga.whisper(player,`Starting resource already assigned!`)
            return;
          }
        }
        let resourceFound = false;
        for(let i = 0; i < serverData.resourceIndex.length; i++){
          if(serverData.resourceIndex[i].name == resource){
            resourceFound = true
          }
        }
        if(!resourceFound){
          Omegga.whisper(player,`Resource not found!`)
          return;
        }
        serverData.startingResourceIndex.push(new EmpireResource(resource,amount))
        await this.store.set("ServerStore",serverData)
        Omegga.whisper(player,`Starter resource added!`)
      })
      .on('cmd:deletestartingresource', async (name: string, resource:string) => {
        if(!this.validate(name)){
          return;
        }
        const player = Omegga.getPlayer(name)
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        if(resource == undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/RemoveStartingResource</> <color="00ff00">[Resource]</> - Removes a resource empries get upon their creation `)
          return;
        }
        for(let i = 0; i < serverData.startingResourceIndex.length; i++){
          if(serverData.startingResourceIndex[i].name == resource){
            serverData.startingResourceIndex.splice(i,1)
          }
        }
        await this.store.set("ServerStore",serverData)
        Omegga.whisper(player,`Starter resource deleted!`)
      })
      .on('cmd:viewstartingresources', async (name: string) => {
        const player = Omegga.getPlayer(name)
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        Omegga.whisper(player,`<color="ffff00">Starter resources:</>`)
        for(let i = 0; i < serverData.startingResourceIndex.length; i++){
          Omegga.whisper(player,`${serverData.startingResourceIndex[i].name}, Amount: ${serverData.startingResourceIndex[i].amount}`)
        }
      })
      .on('cmd:addstartingbuilding', async (name: string, building:string, amount:string) => {
        if(!this.validate(name)){
          return;
        }
        const player = Omegga.getPlayer(name)
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        if(building == undefined|| amount == undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/AddStartingBuilding</> <color="00ff00">[Building] [Amount]</> - Adds a building empries get upon their creation `)
          return;
        }
        for(let i = 0; i < serverData.startingBuildingIndex.length; i++){
          if(serverData.startingBuildingIndex[i].name == building){
            Omegga.whisper(player,`Starting building already assigned!`)
            return;
          }
        }
        let buildingFound = false;
        for(let i = 0; i < serverData.buildingIndex.length; i++){
          if(serverData.buildingIndex[i].name == building){
            buildingFound = true
          }
        }
        if(!buildingFound){
          Omegga.whisper(player,`Building not found!`)
          return;
        }
        serverData.startingBuildingIndex.push(new EmpireBuilding(building,amount))
        await this.store.set("ServerStore",serverData)
        Omegga.whisper(player,`Starter building added!`)
      })
      .on('cmd:deletestartingbuilding', async (name: string, building:string) => {
        if(!this.validate(name)){
          return;
        }
        const player = Omegga.getPlayer(name)
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        if(building == undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/RemoveStartingBuilding</> <color="00ff00">[Building]</> - Removes a building empries get upon their creation `)
          return;
        }
        for(let i = 0; i < serverData.startingBuildingIndex.length; i++){
          if(serverData.startingBuildingIndex[i].name == building){
            serverData.startingBuildingIndex.splice(i,1)
          }
        }
        await this.store.set("ServerStore",serverData)
        Omegga.whisper(player,`Starter building deleted!`)
      })
      .on('cmd:viewstartingbuildings', async (name: string) => {
        const player = Omegga.getPlayer(name)
        if(!this.config['enable-resource-system']){
          Omegga.whisper(player,`<color="ff0000">Error using this command. Resource system is disabled.</>`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        Omegga.whisper(player,`<color="ffff00">Starter buildings:</>`)
        for(let i = 0; i < serverData.startingBuildingIndex.length; i++){
          Omegga.whisper(player,`${serverData.startingBuildingIndex[i].name}, Amount: ${serverData.startingBuildingIndex[i].amount}`)
        }
      })
      .on('cmd:addstartingroll', async (name: string, rollName: string, equation: string) => {
        if(!this.validate(name)){
          return;
        }
        const player = Omegga.getPlayer(name)
        if(rollName === undefined|| equation === undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/AddStartingRoll</> <color="00ff00">[Preset Name] [Equation]</> - Creates a default roll preset using the advanced rolling format`)
          return;
        }
  
        const savedRollObj = {
          label:rollName,
          equation:equation,
          description:"Use this space to explain your roll and what order the arguments might be in"
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        for(let i = 0; i < serverData.defaultRolls.length; i++) {
          if (serverData.defaultRolls[i].label == rollName) {
            Omegga.whisper(player,`There's already a default roll preset named ${rollName}!`)
            return;
          }
        }
        serverData.defaultRolls.push(savedRollObj)
        Omegga.whisper(player,`Saved roll preset ${rollName}!`)
        await this.store.set("ServerStore",serverData)
      })
      //Deletes a saved rolling equation
      .on('cmd:deletestartingroll', async (name: string, rollName: string) => {
        if(!this.validate(name)){
          return;
        }
        const player = Omegga.getPlayer(name)
        if(rollName === undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/DeleteStartingRoll</> <color="00ff00">[Preset Name]</> - Deletes a default roll preset.`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
        for(let i = 0; i < serverData.defaultRolls.length; i++) {
          if (serverData.defaultRolls[i].label == rollName) {
            serverData.defaultRolls.splice(i,1)
            Omegga.whisper(player,`Deleted default roll preset ${rollName}!`)
            await this.store.set("ServerStore",serverData)
            return;
          }
        }
        Omegga.whisper(player,`Couldn't find roll preset named ${rollName}!`)
      })
      .on('cmd:setstartingrolldescription', async (name: string, rollName: string, ...args:string[]) => {
        if(!this.validate(name)){
          return;
        }
        const player = Omegga.getPlayer(name)
        if(rollName === undefined|| args[0] === undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/SetRollDescription</> <color="00ff00">[Preset Name] ...[Description]</> - Sets the roll preset's description.`)
          return;
        }
        let serverData:ServerData = await this.store.get("ServerStore")
          for(let i = 0; i < serverData.defaultRolls.length; i++) {
            if (serverData.defaultRolls[i].label == rollName) {
              serverData.defaultRolls[i].description = args.join(' ')
              await this.store.set(player.id,serverData)
              Omegga.whisper(player,`${rollName}'s description set to
              "${serverData.defaultRolls[i].description}"`)
              return;
            }
          }
        
      })
      .on('cmd:viewstartingrolls', async (name: string) => {
        const player = Omegga.getPlayer(name)
        let serverData:ServerData = await this.store.get("ServerStore")
        if(serverData.defaultRolls.length <= 0){
          Omegga.whisper(player,`You have no presets! Create one by using /AddStartingRoll`)
        }
        for(let i = 0; i < serverData.defaultRolls.length; i++) {
          Omegga.whisper(player,`<color="ffff00"><size="24">${serverData.defaultRolls[i].label}<color="ffffff">:</></> ${serverData.defaultRolls[i].equation}</>`)
          Omegga.whisper(player,`<color="aaaaaa">${serverData.defaultRolls[i].description}</>`)
        }
      })
      .on('cmd:timer', async (name: string, time:number, ...description:string[]) => {
        const player = Omegga.getPlayer(name)
        if(time == undefined) {
          Omegga.whisper(player,`Allowed formats:
          <color="ffff00">/Timer</> <color="00ff00">[Time]</><color="ff0000"> [Description] </> - Sets a timer to go off, time is in seconds`)
          return;
        }
        setTimeout(() => {
          Omegga.whisper(player,`<size="24"><color="ff0000"><b>Timer is done!</></></> ${description.join(' ')}`)
        },time*1000)
      })
      .on('cmd:merpeval', async (name: string, equation:string) => {
        const player = Omegga.getPlayer(name)
        console.log(merpEval.evalString(equation));
      });

      

    return{ 
      registeredCommands:
      [
      // Having trouble finding a command? Use this as an index and use your editing program's find feature (Usually CTRL + F) and enter the name of the command in the search box.
      //Help
      'helpmerptools',
      //General empire commands
      'createempire','empirecolor','deleteempire','switchempire','playerinfo','s','resetplayerdata',
      //Server resource editing !Editting of these values requires a trusted role
      'resetserverdata','resourcelist','deleteresource','addresource','setresourcecolor',
      //Server building editing !Editting of these values requires a trusted role
      'buildinglist','deletebuilding','addbuilding','setbuildingcost','setbuildingproduction','setbuildingcolor',
      //General server commands !Editting of these values requires a trusted role
      'settimescale','settime',
      //UX server commands !Editting of these values requires a trusted role
      'addstartingresource','addstartingbuilding','addstartingroll','deletestartingresource','deletestartingbuilding','deletestartingroll','viewstartingresources','viewstartingbuildings','viewstartingrolls','setstartingrolldescription',
      //Roll commands
      'roll','advroll','saveroll','deleteroll','setrolldescription','rollpresets','useroll','merpeval',
      //Empire building commands
      'build','viewempirebuildings','demolish',
      //Empire resource commands
      'viewempireresources','empiretrade',
      //Clock Commands
      'timer'
      ]   
    };
  }

  validate(speaker: string):boolean{
    const user = Omegga.getPlayer(speaker);

    if(user.getRoles().includes(this.config['authorized-role'])){
      return true;
    } 
    Omegga.whisper(user, "You are not authorized to use this command.");
    return false;
  }

  async stop() {
    Omegga.broadcast("MERP-Tools Unloaded...")
    // Anything that needs to be cleaned up...
  }
  
}
