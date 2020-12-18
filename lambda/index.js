/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const Util = require('./util.js');
const ListLayout = require('./listLayout.json');
const Data = require('./data.json');
const StreamData = require('./stream.json');

const WELECOME_SPEECH = "Welcome to Staying Sharp Meditations by AARP. Meditation can help you calm the mind and stay present. Now, select a meditation to start a session, which would you like?";
const REPROMPT_SPEECH = "Now, select a meditation to start a session, which would you like? You can say select the first one";
const REPROMPT_RESELECT_SPEECH = "I am sorry, I couldn't quite get that. Could you select one again? or you can say select the first one.";
const REPROMPT_RESPEECH_AARP = "I am sorry, I couldn't quite get that. You cans say play the rockpools.";
const HELP_SPEECH = "You can say open AARP meditation or play the rockpools full version.";
const NOT_SUPPORTED_VIDEO = "Your device is not supported video.";
const EXIT_SPEECH = "Thanks for using Staying Sharp Meditations from AARP. We hope to see you again soon.";

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
                .speak(WELECOME_SPEECH)
                .addDirective({
                    type: 'Alexa.Presentation.APL.RenderDocument',
                    version: '1.0',
                    document: ListLayout,
                    datasources: Data
                })
                //.reprompt(REPROMPT_SPEECH)
                .getResponse();
    }
};

const RequestPlayIntentHandler = {
    canHandle(handlerInput) {
        console.log("RequestPlayIntentHandler");
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RequestPlayIntent';
    },
    handle(handlerInput) {
        console.log(JSON.stringify(handlerInput));
        let aarpAsset = handlerInput.requestEnvelope.request.intent.slots.aarpAsset.value;
        let version = handlerInput.requestEnvelope.request.intent.slots.version.value;
        
        console.log("[aarpAsset] " + aarpAsset);
        console.log("[version] " + version);
        
        let index = findIndex(aarpAsset, version);
        console.log("index : " + index);
        if(index !== -1){
            let aarpData = Data.listData.listItemsToShow[index];
        
            const speakOutput = "Ok, starting " + aarpData.primaryText +" "+ aarpData.speechMin + " in 3, 2, 1";
            
            if (supportsVideo(handlerInput) && index !== 6) {
                handlerInput.responseBuilder.addVideoAppLaunchDirective(aarpData.url, aarpData.primaryText, aarpData.secondaryText);
                return handlerInput.responseBuilder.speak(speakOutput).getResponse();
            } else{
                handlerInput.responseBuilder.addAudioPlayerPlayDirective("REPLACE_ALL", StreamData[index].url, StreamData[index].token, 0, null, StreamData[index].metadata);
                return handlerInput.responseBuilder.speak(speakOutput).getResponse();
            }
        } else{
            return handlerInput.responseBuilder.speak(REPROMPT_RESPEECH_AARP).reprompt(REPROMPT_RESPEECH_AARP).getResponse();
        }
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak("good bye!")
            .getResponse();
    }
};

/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        console.log("handlerInput.requestEnvelope.request.reason : " + handlerInput.requestEnvelope.request.reason);
        if(handlerInput.requestEnvelope.request.reason === "USER_INITIATED"){
            return handlerInput.responseBuilder.speak(EXIT_SPEECH).getResponse();
        } else{
            return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
        }
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log('~~~~ Error handled: ' + JSON.stringify(error));

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const sendEventHandler = {
  canHandle(handlerInput) { 
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'Alexa.Presentation.APL.UserEvent' && request.arguments.length > 0;
  },
  handle(handlerInput) {
      console.log("[sendEventHandler]");
      let argumentFromSkill = handlerInput.requestEnvelope.request.arguments[0];
      console.log("[argumentFromSkill] : " + argumentFromSkill);
      if(argumentFromSkill === "ListItemSelected"){
        let selectIdx = handlerInput.requestEnvelope.request.arguments[1];
        
        if(selectIdx === null){
            selectIdx = 0;
        } else{
            selectIdx -= 1;
        }
        
        let aarpData = Data.listData.listItemsToShow[selectIdx];
        
        const speakOutput = "Ok, starting " + aarpData.primaryText +" "+ aarpData.speechMin;
        console.log("INDEX : " + selectIdx);
        console.log(JSON.stringify(StreamData[selectIdx]));
        
        if (supportsVideo(handlerInput)) {
            handlerInput.responseBuilder.addVideoAppLaunchDirective(aarpData.url, aarpData.primaryText, aarpData.secondaryText);
            return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        } else{
            handlerInput.responseBuilder.addAudioPlayerPlayDirective("REPLACE_ALL", StreamData[selectIdx].url, StreamData[selectIdx].token, 0, null, StreamData[selectIdx].metadata);
            return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        }
     }
  }
};

const SelectIntentHandler = {
    canHandle(handlerInput) { 
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.SelectIntent';
  },
  handle(handlerInput) {
      console.log(JSON.stringify(handlerInput.requestEnvelope.request));
      let valueList = handlerInput.requestEnvelope.request.intent.slots.ListPosition;
      let speakOutput = "";
      
      if(valueList.hasOwnProperty("value")){
            let idx = valueList.value-1;
            let aarpData = Data.listData.listItemsToShow[idx];
            const speakOutput = "Ok, starting " + aarpData.primaryText +" "+ aarpData.speechMin;
          
            if (supportsVideo(handlerInput)) {
                console.log("Play Video");
                handlerInput.responseBuilder.addVideoAppLaunchDirective(aarpData.url, aarpData.primaryText, aarpData.secondaryText);
                return handlerInput.responseBuilder.speak(speakOutput).getResponse();
            } else{
                console.log("Play Audio");
                handlerInput.responseBuilder.addAudioPlayerPlayDirective("REPLACE_ALL", StreamData[idx].url, StreamData[idx].token, 0, null, StreamData[idx].metadata);
                return handlerInput.responseBuilder.speak(speakOutput).getResponse();
            }
      } else{
          return handlerInput.responseBuilder.speak(REPROMPT_RESELECT_SPEECH).reprompt(REPROMPT_RESELECT_SPEECH).getResponse();
      }
  }
};

function supportsVideo(handlerInput) {
  var hasVideo =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces.VideoApp

  console.log("Supported Interfaces are" + JSON.stringify(handlerInput.requestEnvelope.context.System.device.supportedInterfaces));
  console.log("hasDisplay : " + JSON.stringify(hasVideo));
  return hasVideo;
}

function findIndex(aarp, version){
    let user_AARP = aarp.replace(/ /g,"").toLowerCase();
    let user_Version = version.replace(/ /g,"").toLowerCase();
    
    let origin_AARP;
    let origin_Version;
    
    for(let i=0; i<Data.listData.listItemsToShow.length; i++){
        origin_AARP = Data.listData.listItemsToShow[i].primaryText.replace(/ /g,"").toLowerCase();
        origin_Version = Data.listData.listItemsToShow[i].secondaryText.replace(/ /g,"").toLowerCase();
        if(user_AARP === origin_AARP && origin_Version.indexOf(user_Version) !== -1){
            return  i;
        }
    }
    
    return  -1;
}

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        RequestPlayIntentHandler,
        SelectIntentHandler,
        sendEventHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();