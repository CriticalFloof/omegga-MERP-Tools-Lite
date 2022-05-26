//import type  Store  from '../omegga.plugin';

//These commands being inside of a class is unnessesary, however it allows me to know where the methods comes from so it's not so bad.
export default class MERPCommands {

    static helpList(name, section, page) {
      const player = Omegga.getPlayer(name)
      if(section == undefined) {
        Omegga.whisper(player, `<size="24"><color="00ffff"> > Brickadia MERP-Tools Help Pages</></>
        <color="00ffff"> > </>Use <color="00ff00">/Roll</> to roll a dice <color="ff0000">[Limit] [Amount] [Modifier]</>
        <color="00ffff"> > </><color="00ff00">/helpmerptools empirecommands</> - How to create empires, and features.
        <color="00ffff"> > </><color="00ff00">/helpmerptools advancedrolls</> - Learn how to use the advanced rolling features and it's syntax.`
        )
      } else if(section == "empirecommands"){
        if(page == undefined|| page == "1"){
          Omegga.whisper(player, `<size="24"><color="00ffff"> > </>Help page: <color="00ff00">Empire Commands</></>
          <color="00ffff"> > </>Create an empire - <color="00ff00">/CreateEmpire [Empire Name]</>
          <color="00ffff"> > </>Recolor your empire - <color="00ff00">/EmpireColor [Empire Name] [Color]]</>
          <color="00ffff"> > </>Delete an empire - <color="00ff00">/DeleteEmpire [Empire Name]</>
          <color="00ffff"> > </>You can own multiple empires. <color="00ff00">/PlayerInfo </>displays your empires
          <color="00ffff"> > </>Switch your player's empire identity - <color="00ff00">/SwitchEmpire</>
          <color="00ffff"> > </>Speak as your empire! <color="00ff00">/s </>`)
        }
      } else if(section == "advancedrolls"){
        if(page == undefined|| page == "1"){
          Omegga.whisper(player, `<size="24"><color="00ffff"> > </>Help page: <color="00ff00">Advanced Rolling Page 1</></>
          <color="00ffff"> > </>Use the command <color="00ff00">/AdvRoll [Equation]</> <color="ff0000">[Silent]</>
          <color="00ffff"> > </>The rolling system uses d(equation) to work. example: d(10) output: rolls die that ranges from 1-10
          <color="00ffff"> > </>Multi-dice example: 5d(10) output: rolls 5 dice that range from 1-10
          <color="00ffff"> > </>Modifier example: d(10)+10 output: 1 die, range 11-20
          <color="00ffff"> > </>Math operators example: 2*5d(50/10+10)*2 outputs: 10 dice, range 2-30
          <color="00ffff"> > </>Concatenation example: d(10)10 range 110-1010
          <color="00ffff"> > </>Next page is on <color="00ff00">/helpmerptools advancedrolls 2</></>`)
        } else if(page == "2"){
          Omegga.whisper(player, `<size="24"><color="00ffff"> > </>Help page: <color="00ff00">Advanced Rolling Page 2</></>
          <color="00ffff"> > </>You can add arguments to advanced rolls, using arg(). 
          <color="00ffff"> > </>Each arg() placed in a roll will require that much more arguments to be provided at the end of the command.
          <color="00ffff"> > </>Example: <color="00ff00">/advroll d(arg())+arg() 0 10 5</> output: 1 die, range 6-15
          <color="00ffff"> > </>You save the advanced roll formats for later using <color="00ff00">/SaveRoll [Roll Name][Equation]</>
          <color="00ffff"> > </>You can call these saved rolls using <color="00ff00">/UseRoll [Roll Name]</> and can delete rolls using <color="00ff00">/DeleteRoll [Roll Name]</>
          <color="00ffff"> > </>If you forget what one of your advanced rolls are called you can use <color="00ff00">/RollPresets</>
          `)
        }
      }
    }

    static diceRoll(name,limit,amount,modifier,silent?) {
      const player = Omegga.getPlayer(name)
      //Input Corrections
      console.log(typeof(limit))
      if(limit === undefined || limit === '') limit = 20;
      if(amount === undefined || amount === '' || amount <= 0) amount = 1;
      if(amount >= 10) amount = 10;
      if(modifier === undefined || modifier === '') modifier = 0;
      limit = parseInt(limit)
      amount = parseInt(amount)
      modifier = parseInt(modifier)
      silent = parseInt(silent)
      //Function
      let diceIndex = [];
      for(let i = 0; i < amount; i++) {
        diceIndex.push(Math.ceil(Math.random()*limit+modifier))
      };
      let message = `<color="ffff00">${name}</> rolled a <color="ffff00">${diceIndex.join('<color="ffffff">,</> ')}</> `;
      if(amount != 1) {message += `from ${amount}, ${limit} sided dice `;} else
      {message += `from a ${limit} sided die `;};
      if(modifier != 0) message += `with a modifier of ${modifier} `;
      message = message.slice(0, -1);
      message += `!`;
      if(silent == 1) {
        message = '<color="aaaaaa">[SILENT] </>'+message
        Omegga.whisper(player,message);
      } else {
        Omegga.broadcast(message);
      }
    };

    static advancedRoll(name,equation,silent?, ...args) {

      const player = Omegga.getPlayer(name);    
      let variables = equation.match(/[v][a][r][(](?<x>[^)]+)/ig)
      let paramerters = equation.match(/[a][r][g][(][)]/ig)
      console.log(variables)
      console.log(paramerters)
      //Input variables from store
      
      /*
      Variables are planned and supported, however the code to import the variables into the fuction to use isn't here yet.
      */

      //Converting Advanced roll syntax to Javascript syntax
      if(paramerters != null) {
        console.log(paramerters.length)
        for(let i = 0; i < paramerters.length; i++){
          if(args[i] == null) {
            Omegga.whisper(player,"Haven't provided any arguments!")
            return;
          }
          args[i] = args[i].replace(/[^a-z0-9+*\/^.-]/gim, "")
          args[i] = eval(args[i])

          equation = equation.replace(/[a][r][g][(][)]/i, args[i])
        }
      }
      let body = equation.match(/^[^d]*.(?<x>.*)/i).groups.x
      let amount = equation.match(/^(?<x>[^d]+)/i)
      if(amount === null){
        amount = 1
      } else {
        amount = amount.groups.x
        amount.replace(/[^0-9_+*\/^.-]/gim, "")
        amount = eval(amount)
        if(amount < 1) amount = 1;
        if(amount > 10) amount = 10;
      }

      let rollEquation = body.match(/[(].*[)]/i)[0];
      //Sanitize again for good measure.
      rollEquation.replace(/[^0-9_+*\/^.-]/gim, "")
      //More conversions...
      const rollValue = eval(rollEquation)
      let diceIndex = [];
      let modValue = body.match(/[)].*/i)[0]
      modValue = modValue.replace(/[^0-9_+*\/^.-]/gim, "")
      body = body.replace(/(?<=\)).*/, '')
      //Apply modifier to roll
      for(let i = 0; i < amount; i++) {
        const rollOutput = Math.ceil(Math.random()*rollValue)
        const newBody = body.replace(/[(].*[)]/i, rollOutput)
        const evalInput = newBody+modValue
        const output = eval(evalInput)
        diceIndex.push(output)
        
      };
      //Display the results
      let message = `<color="ffff00">${name}</> rolled a <color="ffff00">${diceIndex.join('<color="ffffff">,</> ')}</> `
      if(amount != 1) {message += `from ${amount}, ${rollValue} sided dice `;} else
      {message += `from a ${rollValue} sided die `;};
      if(modValue != null&&modValue != '') {message += `with a modifier of ${modValue} `;}
      message = message.slice(0, -1);
      message += `!`;
      if(silent == 1) {
        message = '<color="aaaaaa">[SILENT] </>'+message
        Omegga.whisper(player,message);
      } else {
        Omegga.broadcast(message);
      }
      
    };
};
