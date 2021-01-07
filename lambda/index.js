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

const SOUND = "<audio src='https://aarp-meditation.s3-us-west-2.amazonaws.com/Media/piano.mp3'/>";
const WELECOME_SPEECH = "Welcome to Staying Sharp Meditations by AARP. Meditation can help you calm the mind and stay present. Now, select a meditation to start a session, which would you like?";
const WELECOME_SPEECH_NOT_APL = "Welcome to Staying Sharp Meditations by AARP. Meditation can help you calm the mind and stay present. You can choose from 1. Australian Tropical Sunrise long 15 minutes, 2. Austrailian Tropical Sunrise Short 7 minutes, 3. Behind a Waterfall long 11 minutes, 4. Behind a Waterfall short 7 minutes, 5. Rockpools long 10 minutes, 6. Rockpools short 5 minutes, or 7. Into the Silence - Utah 6 minutes unguided.";
const STOP_SPEECH = "Would you like to continue with another meditation or stop for the day?";
const BACK_SPEECH = "You can choose from 1. Australian Tropical Sunrise long 15 minutes, 2. Austrailian Tropical Sunrise Short 7 minutes, 3. Behind a Waterfall long 11 minutes, 4. Behind a Waterfall short 7 minutes, 5. Rockpools long 10 minutes, 6. Rockpools short 5 minutes, or 7. Into the Silence - Utah 6 minutes unguided.";
const REPROMPT_SPEECH = "Now, select a meditation to start a session, which would you like? You can say select the first one";
const REPROMPT_RESELECT_SPEECH = "I am sorry, I couldn't quite get that. Could you select one again? or you can say select the first one.";
const REPROMPT_RESPEECH_AARP = "I am sorry, I couldn't quite get that. You cans say play the rockpools.";
const HELP_SPEECH = "You can say open AARP meditation or play the rockpools full version.";
const NOT_SUPPORTED_VIDEO = "Your device is not supporting the video.";
const NULL_SELECT_SPEECH = "There is an error in the user input. You can say select the first one";
const EXIT_SPEECH = "Thanks for using Staying Sharp Meditations by AARP. We hope to see you again soon.";

let inPlaybackSession = false;
let offsetInMilliseconds = 0;
let audioPlayIndex = 0;

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        if(supportedInterfaces("apl", handlerInput)){
            return handlerInput.responseBuilder
                .speak(SOUND + WELECOME_SPEECH)
                .addDirective({
                    type: 'Alexa.Presentation.APL.RenderDocument',
                    version: '1.0',
                    document: ListLayout,
                    datasources: Data
                })
                .reprompt(REPROMPT_SPEECH)
                .getResponse();
        } else{
            return handlerInput.responseBuilder
                .speak(SOUND + WELECOME_SPEECH_NOT_APL + REPROMPT_SPEECH)
                .reprompt(REPROMPT_SPEECH)
                .getResponse();
        }
    }
};

const RequestPlayIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RequestPlayIntent';
    },
    handle(handlerInput) {
        console.log("[RequestPlayIntentHandler]");
        let aarpAsset = handlerInput.requestEnvelope.request.intent.slots.aarpAsset.value;
        let version = handlerInput.requestEnvelope.request.intent.slots.version.value;
        
        let index = findIndex(aarpAsset, version);
        
        if(index !== -1){
            audioPlayIndex = index;
            let aarpData = Data.listData.listItemsToShow[index];
        
            const speakOutput = "Ok, starting " + aarpData.primaryText +" "+ aarpData.speechMin + " in <emphasis level='strong'>3, 2, 1</emphasis>";
            
            if (supportedInterfaces("video", handlerInput) && index !== 6) {
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

const BackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.PreviousIntent'
            || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.BackIntent');
    },
    handle(handlerInput) {
        console.log("[BackIntentHandler]");
        if(supportedInterfaces("apl", handlerInput)){
            return handlerInput.responseBuilder
                .speak(REPROMPT_SPEECH)
                .addDirective({
                    type: 'Alexa.Presentation.APL.RenderDocument',
                    version: '1.0',
                    document: ListLayout,
                    datasources: Data
                })
                .reprompt(REPROMPT_SPEECH)
                .getResponse();
        } else{
            return handlerInput.responseBuilder
                .speak(BACK_SPEECH)
                .reprompt(REPROMPT_SPEECH)
                .getResponse();
        }
    }
};

const PauseIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
                && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.PauseIntent');
    },
    handle(handlerInput) {
        console.log("[PauseIntentHandler] inPlaybackSession : " + inPlaybackSession);
        if(inPlaybackSession){
            handlerInput.responseBuilder.addAudioPlayerStopDirective();
        }
        return handlerInput.responseBuilder.getResponse();
    }
};

const ResumeIntentHandler = {
    canHandle(handlerInput) {
        
        return inPlaybackSession
            && Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ResumeIntent';
    },
    handle(handlerInput) {
        console.log("[ResumeIntentHandler] ");
        if(inPlaybackSession){
            handlerInput.responseBuilder.addAudioPlayerPlayDirective("REPLACE_ALL", StreamData[audioPlayIndex].url, StreamData[audioPlayIndex].token, offsetInMilliseconds, null, StreamData[audioPlayIndex].metadata);
        }
        return handlerInput.responseBuilder.getResponse();
    }
};

const YesHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.YesIntent';
    },
    handle(handlerInput) {
        console.log("[YesHandler]");
        if(supportedInterfaces("apl", handlerInput)){
            return handlerInput.responseBuilder
                .speak(WELECOME_SPEECH)
                .reprompt(REPROMPT_SPEECH)
                .getResponse();
        } else{
            return handlerInput.responseBuilder
                .speak(WELECOME_SPEECH)
                .addDirective({
                    type: 'Alexa.Presentation.APL.RenderDocument',
                    version: '1.0',
                    document: ListLayout,
                    datasources: Data
                })
                .reprompt(REPROMPT_SPEECH)
                .getResponse();
        }
    }
};

const NoHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NoIntent';
    },
    handle(handlerInput) {
        console.log("[NoHandler]");
        if(inPlaybackSession){
            handlerInput.responseBuilder.addAudioPlayerStopDirective();
        }
        return handlerInput.responseBuilder
            .speak(EXIT_SPEECH + SOUND)
            .withShouldEndSession(true)
            .getResponse();
  }
};

const ExitIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent';
    },
    handle(handlerInput) {
        console.log("[ExitIntentHandler]");
        return handlerInput.responseBuilder.speak(STOP_SPEECH).reprompt(STOP_SPEECH).getResponse();
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
            return handlerInput.responseBuilder.speak(EXIT_SPEECH + SOUND).getResponse();
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
        console.log("[IntentReflectorHandler] : " + intentName);

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

      if(argumentFromSkill === "listItemPressed"){
        let selectIdx = handlerInput.requestEnvelope.request.arguments[1];
        
        if(selectIdx === null){
            return handlerInput.responseBuilder.speak(NULL_SELECT_SPEECH).reprompt(NULL_SELECT_SPEECH).getResponse();
        } 
        
        audioPlayIndex = selectIdx;
        let aarpData = Data.listData.listItemsToShow[selectIdx];
        
        const speakOutput = "Ok, starting " + aarpData.primaryText +" "+ aarpData.speechMin + " in <emphasis level='strong'>3, 2, 1</emphasis>";
        console.log("INDEX : " + selectIdx);
        console.log(JSON.stringify(StreamData[selectIdx]));
        
        if (supportedInterfaces("video", handlerInput) && selectIdx !== 6) {
            handlerInput.responseBuilder.addVideoAppLaunchDirective(aarpData.url, aarpData.primaryText, aarpData.secondaryText);
            return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        } else{
            handlerInput.responseBuilder.addAudioPlayerPlayDirective("REPLACE_ALL", StreamData[selectIdx].url, StreamData[selectIdx].token, 0, null, StreamData[selectIdx].metadata);
            return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        }
     }
  }
};

const AudioPlayerEventHandler = {
    canHandle(handlerInput) {
        console.log("[AudioPlayerEventHandler] " + handlerInput.requestEnvelope.request.type);
        return handlerInput.requestEnvelope.request.type.startsWith('AudioPlayer.');
    },
    handle(handlerInput) {
        const audioPlayerEventName = handlerInput.requestEnvelope.request.type.split('.')[1];
        console.log("[audioPlayerEventName] " + audioPlayerEventName);
        
        switch (audioPlayerEventName) {
            case 'PlaybackStarted':
                inPlaybackSession = true;
                break;
            case 'PlaybackFinished':
                inPlaybackSession = false;
                offsetInMilliseconds = 0;
                audioPlayIndex = 0;
                console.log("complete!!");
                //playbackEnd(handlerInput);
            case 'PlaybackStopped':
                offsetInMilliseconds = getOffsetInMilliseconds(handlerInput);
                break;
            case 'PlaybackNearlyFinished':
                console.log("PlaybackNearlyFinished!!");
                return handlerInput.responseBuilder.addAudioPlayerPlayDirective('ENQUEUE', 'https://aarp-meditation.s3-us-west-2.amazonaws.com/Media/session_ended_and_continue_confirmation.mp3', 0, 0, null, null);
            case 'PlaybackFailed':
                inPlaybackSession = false;
                offsetInMilliseconds = 0;
                audioPlayIndex = 0;
                console.log('Playback Failed : %j', handlerInput.requestEnvelope.request.error);
                return;
            default:
                throw new Error('Should never reach here!');
        }

        return handlerInput.responseBuilder.getResponse();
    }
};

const SelectIntentHandler = {
    canHandle(handlerInput) { 
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.SelectIntent';
    },
    handle(handlerInput) {
        console.log("[SelectIntentHandler]");
        let valueList = handlerInput.requestEnvelope.request.intent.slots.ListPosition;
        let speakOutput = "";
      
        if(valueList.hasOwnProperty("value")){
            let idx = valueList.value-1;
            audioPlayIndex = idx;
            let aarpData = Data.listData.listItemsToShow[idx];
            const speakOutput = "Ok, starting " + aarpData.primaryText +" "+ aarpData.speechMin + " in <emphasis level='strong'>3, 2, 1</emphasis>";
          
            if (supportedInterfaces("video", handlerInput) && idx !== 6) {
                console.log("Play Video");
                handlerInput.responseBuilder.addVideoAppLaunchDirective(aarpData.url, aarpData.primaryText, aarpData.secondaryText);
                return handlerInput.responseBuilder.speak(speakOutput).getResponse();
            } else{
                console.log("Play Audio");
                handlerInput.responseBuilder.withShouldEndSession(true).addAudioPlayerPlayDirective("REPLACE_ALL", StreamData[idx].url, StreamData[idx].token, 0, null, StreamData[idx].metadata);
                return handlerInput.responseBuilder.speak(speakOutput).getResponse();
            }
        } else{
            return handlerInput.responseBuilder.speak(REPROMPT_RESELECT_SPEECH).reprompt(REPROMPT_RESELECT_SPEECH).getResponse();
        }
    }
};

function supportedInterfaces(checkInterface, handlerInput) {
    console.log("Supported Interfaces are" + JSON.stringify(handlerInput.requestEnvelope.context.System.device.supportedInterfaces));
    if(checkInterface === "video"){
        var hasVideo =
            handlerInput.requestEnvelope.context &&
            handlerInput.requestEnvelope.context.System &&
            handlerInput.requestEnvelope.context.System.device &&
            handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
            handlerInput.requestEnvelope.context.System.device.supportedInterfaces.VideoApp
        
        console.log("hasVideo : " + JSON.stringify(hasVideo));
        return hasVideo;
    } else if(checkInterface === "apl"){
        var hasAPL =
            handlerInput.requestEnvelope.context &&
            handlerInput.requestEnvelope.context.System &&
            handlerInput.requestEnvelope.context.System.device &&
            handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
            handlerInput.requestEnvelope.context.System.device.supportedInterfaces["Alexa.Presentation.APL"]
        
        console.log("hasAPL : " + JSON.stringify(hasAPL));
        return hasAPL;
    }
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

function getOffsetInMilliseconds(handlerInput) {
  // Extracting offsetInMilliseconds received in the request.
  return handlerInput.requestEnvelope.request.offsetInMilliseconds;
}

function playbackEnd(handlerInput){
    return handlerInput.responseBuilder.addAudioPlayerPlayDirective("REPLACE_ALL", "https://aarp-meditation.s3-us-west-2.amazonaws.com/Media/session_ended_and_continue_confirmation.mp3", 0, 0, null, null);
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
        AudioPlayerEventHandler,
        SelectIntentHandler,
        sendEventHandler,
        BackIntentHandler,
        YesHandler,
        NoHandler,
        HelpIntentHandler,
        ResumeIntentHandler,
        PauseIntentHandler,
        ExitIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();