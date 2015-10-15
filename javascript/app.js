var CurrentTaxID, NewTaxID, EnclosureTaxonomyMetaStack, NextTaxonomyMetaStack;
var CurrentMainID = 'main1';
var NextMainID = 'main2';

function prepNext(callback){   
    var TaxaMetaObject, OneTaxaObject;

    if(!EnclosureTaxonomyMetaStack.hasMetaObjects()) {
        if(!NextTaxonomyMetaStack.hasMetaObjects())
            reset(0);
        else {   
            /* david 03/04/2015 - for now we don't want to have new data show up while the sign is active */ 
            EnclosureTaxonomyMetaStack.ObjArray = NextTaxonomyMetaStack.ObjArray.slice(0);
                                                                                                
            //EnclosureTaxonomyMetaStack = NextTaxonomyMetaStack;
            //getTaxaListForEnclosure($("#" + APP_UI_CONTAINER_ELEMENT_ID).data("EnclosureID"));    
        }
    }                                                                              

    TaxaMetaObject = EnclosureTaxonomyMetaStack.pop();
    
    ///* david 03/04/2015 - for now we don't want to have new data show up while the sign is active */            
    //EnclosureTaxonomyMetaStack.ObjArray.reverse();              
    //EnclosureTaxonomyMetaStack.ObjArray.push(TaxaMetaObject);              
    //EnclosureTaxonomyMetaStack.ObjArray.reverse(); 
        
    OneTaxaObject = new TaxaObject();
                             
    OneTaxaObject.setAfterInit(function(){      
        drawNext(OneTaxaObject, callback);
    });   

    OneTaxaObject.init(TaxaMetaObject);                             
}

/* This function tells the object to draw the next Taxa Page into 
   the hidden panel so that it will be ready and rendered. It pops
   a TaxaMeta object from the stack. If it pulls the last one
   it calls for the list to be refreshed. 
   It maintains the state of the global variable NewTaxID. */
function drawNext(OneTaxaObject, callback) {
    var TargetDiv, LastOne;      
                                                       
    NewTaxID = OneTaxaObject.TaxonomyID;
    LastOne = !EnclosureTaxonomyMetaStack.hasMetaObjects();
        
    $('#' + CurrentMainID + ' .tax_image').attr('id', 'main_image');
    NextMainID = CurrentMainID;        
    if(CurrentMainID == 'main1'){
        CurrentMainID = 'main2';    
    }
    else{
        CurrentMainID = 'main1';  
    }                                                                 
    
    $('#' + CurrentMainID).html('<div id="' + NewTaxID + 'Div" class="SpeciesContainer"></div>');    
    TargetDiv = $('#' + NewTaxID + 'Div');
                                                     
    OneTaxaObject.drawPage(TargetDiv);                 
    $('#' + CurrentMainID + ' .tax_image').attr('id', 'next_image');
    $('#' + CurrentMainID + ' .TaxonomyReferenceNotes').css('opacity', 0);
        
    $('#' + CurrentMainID + ' .tax_image').off('load');
    $('#' + CurrentMainID + ' .tax_image').on('load', function(){
        after_next_image_load();  
        if(callback != undefined){
            callback();
        }                
    });
}
/* After a SignageID has been inputted, this function draws the Enclosure and
   Institution semi-static data. */
function drawEnclosureInitialSign(EnclosureAnimalObjArray) {
    var EnclosureObj, EnclosureID, EnclosureName, EnclosureDescription;

    EnclosureObj = EnclosureAnimalObjArray.data[0];
    EnclosureID = EnclosureObj.EnclosureID;
    EnclosureName = EnclosureObj.Name;
    EnclosureDescription = EnclosureObj.Description; 

    $("#" + APP_UI_CONTAINER_ELEMENT_ID).data("EnclosureID", EnclosureID);
    $("#" + APP_UI_CONTAINER_ELEMENT_ID).data("EnclosureName", EnclosureName);
    $("#" + APP_UI_CONTAINER_ELEMENT_ID).data("EnclosureDescription", EnclosureDescription);
    
    $('#' + APP_UI_CONTAINER_ELEMENT_ID).html('<div id="main1"></div><div id="main2"></div>');
}
/* Whenever the TaxaMetaStack is empty (including startup) this function 
   is called to reset it. If any taxa has changed (additions, deletions, 
   changes in reference notes or media), the changes will be picked
   up now. */
function refreshTaxaObjectArray(TaxaObjArray) {
    NextTaxonomyMetaStack = new TaxaMetaStack(TaxaObjArray.data);

    if(EnclosureTaxonomyMetaStack == null) {
        EnclosureTaxonomyMetaStack = new TaxaMetaStack(TaxaObjArray.data);

        CurrentTaxID = 1; //this should probably get called in draw next, if it is needed
        prepNext(function(){   /* get first slide */ 
            animate_main_image(); 
            prepNext();   /* get hidden second slide */ 
        });    
                         
        /* Start the timer to cycle through taxa until the app is ended. */         
        window.setInterval(function(){        
            animate_main_image(); 
            /* after every animation is finished get next slide */
            window.setTimeout(function(){
                prepNext();  
            }, ANIMATION_FADE_MS + 500);  
        }, ANIMATION_TIME_MS);                                           
    }
}

/* Ajax function to get listing and meta details 
   for each taxa currently in enclosure. */
function getTaxaListForEnclosure(EnclosureID) {
    var URI = LOOKUP_ISAPI_URI + ENCLOSURE_TAXA_LIST_POSTFIX + SLASH + EnclosureID +
              QUESTION + DATATYPE_PAIR_NAME + EQUALS + TAXA_DATATYPE +
              AMPER + IMAGE_TYPE_PAIR_NAME + EQUALS + VISITOR_ENGAGEMENT_TAXA_MEDIA_TAG +
              AMPER + NOTES_CATEGORIES_PAIR_NAME + EQUALS + SPECIES_INFO_NOTE_TYPE + COMMA + HABITAT_INFO_NOTE_TYPE +
              AMPER + sessionIDQuerystringPair(false);
 //&NotesCategories=Species%20Characteristics,Habitat
    getTracksAjax(URI, function(JSONResponseArray) {
        refreshTaxaObjectArray(JSONResponseArray);
    }, true);
}
/* Ajax lookup function to get Enclosure associated with SignageID */
function getEnclosureIDFromSignage(SignageID) {
    var URI;

    if(SignageID == null || SignageID == '') {
        console.log("why is signage null?");
        return false;
    }

    URI = LOOKUP_ISAPI_URI + LOOKUP_ENCLOSURE_POSTFIX + QUESTION +
          ENCLOSURE_IDENTIFIER_TYPE + EQUALS + SIGNAGE_IDENTIFIER_TYPE + AMPER +
          ENCLOSURE_ID + EQUALS + SignageID + AMPER + sessionIDQuerystringPair(false);

    getTracksAjax(URI, function(JSONResponseArray) {
        if(SignageID != SESSION_CHECK_CALL_TAG) {
            if(JSONResponseArray.data == EMPTY_RESULT_SET_INDICATOR)
                $("#SignageLookupMessageDiv").html("Could not match that signage ID. Try again.");
            else {
                $("#" + APP_UI_CONTAINER_ELEMENT_ID).empty();

                drawEnclosureInitialSign(JSONResponseArray);
                getTaxaListForEnclosure(JSONResponseArray.data[0].EnclosureID);
            }
        }
    }, true);
}

function populateTaxaImage(TaxonomyObj, MediaMasterID) {
    TaxonomyObj.loadImage(
        LOOKUP_ISAPI_URI + MEDIA_POSTFIX + SLASH + MediaMasterID +
        QUESTION + RETURN_TYPE_PAIR_NAME + EQUALS + LARGE_IMAGE_RETURN_TYPE +
        AMPER + sessionIDQuerystringPair(true));
    TaxonomyObj.afterInitJSON();
}

function populateTaxaNotes(TaxaObject, NoteText, NoteType) {
    if(NoteType == HABITAT_INFO_NOTE_TYPE)
        TaxaObject.loadHabitatInfo(NoteText);
    if(NoteType == SPECIES_INFO_NOTE_TYPE)
        TaxaObject.loadSpeciesCharacteristics(NoteText);

    TaxaObject.afterInitJSON();
}
/* Utility Functions: */
function validateLogin(userName, password) {
    console.log('validateLogin');
    var URI;

    URI = LOOKUP_ISAPI_URI + LOGIN_POSTFIX + QUESTION +
          "UserName" + EQUALS + userName + AMPER +
          "Password" + EQUALS + password;

    getTracksAjax(URI, function(JSONResponseArray) {
        console.log('validateLogin Response');
        console.log(JSONResponseArray);
        setLoggedIn(JSONResponseArray);
    }, false);
}

function setLoggedIn(LoginResponse) {
    var SessionID = LoginResponse.data.TracksSessionID;
                                                  
    $.jStorage.set(SESSION_COOKIE_NAME, SessionID);

    reset();
}

function checkLoginCookies() {
    var SessionID;                   
                                                   
    SessionID = $.jStorage.get(SESSION_COOKIE_NAME, SessionID);
    console.log('checkLoginCookies:' + SessionID);
    
    if (SessionID == null || SessionID == NOT_LOGGED_IN) {
        $.jStorage.set(SESSION_COOKIE_NAME, NOT_LOGGED_IN);

        return NOT_LOGGED_IN;
    }
    else {
        $.jStorage.set(SESSION_COOKIE_NAME, SessionID);

        return LOGGED_IN;
    }
}

function getTracksAjax(URI, callback, isAsync) {
    var request;

    //if cross origin
    URI = URI +((URI.indexOf(QUESTION) >= 0) ? AMPER : QUESTION) + "no_cache" + EQUALS + new Date().getTime();
    
    if(isAsync == undefined)
        isAsync = true;

    request = $.ajax({
        type: REQUEST_TYPE_GET,
        async: isAsync,
        url: URI,
        timeout: 20000,
        dataType: DATA_TYPE_JSON
    });

    request.success(callback);

    request.error(function(XMLHttpRequest, TextStatus, ErrorThrown) {
        var JSONResponseArray, ErrorText;
        JSONResponseArray = $.parseJSON(XMLHttpRequest.responseText);
        /* Timeout is being enforced at 20 seconds. In this application,
           the only timeout vulnerability that is being addressed is
           that the NextTaxonomyMetaStack could be empty, so the call
           to build it from server data is made. Other vulnerabilities
           to timeout may be discovered later. */
        if(TextStatus === "timeout") {
            if(NextTaxonomyMetaStack == null || !NextTaxonomyMetaStack.hasMetaObjects())
                getTaxaListForEnclosure($("#" + APP_UI_CONTAINER_ELEMENT_ID).data("EnclosureID"));
        }
        if(JSONResponseArray != null) {
            ErrorText = JSONResponseArray.error.response_code;
            console.log(ErrorText);
    /* if execution goes to this block, and the call was made
       with the check call tag string, the check call ran into
       bad session and bombed. Reset session cookie and call reset() */
            if(URI.indexOf(SESSION_CHECK_CALL_TAG) > 0) {          
                $.jStorage.set(SESSION_COOKIE_NAME, NOT_LOGGED_IN);

                reset();
            }
            else
                alert("An error occurred communicating with the server. Please reload the application.");
        }
    });
}

function getSystemSetting(settingName) {
    var QueryString, URI, request, settingValue;

    QueryString = sessionIDQuerystringPair(false) + AMPER + SETTING_ID_PAIR_NAME + EQUALS + settingName;
    URI = LOOKUP_ISAPI_URI + SYSTEMSETTING_POSTFIX + QUESTION + QueryString;

    request = $.ajax({
        type: REQUEST_TYPE_GET,
        async: false,
        url: URI,
        dataType: DATA_TYPE_JSON
    });

    request.success(function(JSONResponse) {
        settingValue = JSONResponse.data;
    });

    request.error(function(XMLHttpRequest) {
        var JSONResponseArray, ErrorText;
        JSONResponseArray = $.parseJSON(XMLHttpRequest.responseText);

        if(JSONResponseArray != null) {
            ErrorText = JSONResponseArray.error.response_code;
            settingValue = -1;
            console.log(ErrorText);
        }
    });

    return settingValue;
}

function getQueryStringAssocArray(HrefString) {
    var ReturnArray, HrefArray;

    ReturnArray = {};
    HrefArray = HrefString.split("?");
    
    if(HrefArray.length > 1) {
        $.each(HrefArray[1].split("&"), function(idx, Pair) {
            var PairArray = Pair.split("=");

            if(PairArray.length > 1) 
                ReturnArray[PairArray[0]] = decodeURIComponent(PairArray[1]);
        });
    }

    return ReturnArray;
}

function reset(count) {   
    console.log('reset:' + count);   
    var LoginThingy, SessionFault, PreLoadEncID;

    EnclosureTaxonomyMetaStack = null;

    PreLoadEncID = getQueryStringAssocArray($(location).attr("href"))[ENCLOSURE_ID];

    if (count == undefined){
        count = 10;
    }
    if(count == 0){       
        return;
    }
    
    LoginThingy = checkLoginCookies();    

    if(LoginThingy == NOT_LOGGED_IN)
        validateLogin(VISITOR_USER, VISITOR_PASS);
    else {
        try {
            SessionFault = false;
            getEnclosureIDFromSignage(SESSION_CHECK_CALL_TAG);
        } // if the session is bad, the above call will bomb, but doesn't seem to throw exception
        catch(e) { // if it bombs we know that the session cookie is out of sync with the server
            console.log(e);
            SessionFault = true;
                                                              
            $.jStorage.set(SESSION_COOKIE_NAME, NOT_LOGGED_IN);

            reset(count - 1);
        }

        if(!SessionFault) {
            $("#" + APP_UI_CONTAINER_ELEMENT_ID).data(INSTITUTION, getSystemSetting(INSTITUTION));
            //$('.institution .institution_name').html(getSystemSetting(INSTITUTION));
            $('.institution .institution_name').html('World Aquarium');

            CurrentTaxID = -1;
            NewTaxID = -1;

            if(PreLoadEncID != null)
                getEnclosureIDFromSignage(PreLoadEncID);
            else {
                $("#StartButton").attr("disabled", false);

                $(document).on("click", "#StartButton", function() {
                    getEnclosureIDFromSignage($("#SignageID").val());
                });
            }
        }
    }
}

function sessionIDQuerystringPair(NoDynamic) {
    if(NoDynamic)
        return SESSION_ID_NAME + EQUALS + $.jStorage.get(SESSION_COOKIE_NAME);
    else
        return SESSION_ID_NAME + EQUALS + $.jStorage.get(SESSION_COOKIE_NAME) + AMPER + "dt=" + Date.now();
}

$(function(){
//    $('#next_image').on('load', function(){
//        after_next_image_load();                   
//    })
    
    $(window).on('resize', resize_appui);  
    resize_appui();   
}); 

function resize_appui(){    
    var new_height;
    new_height = $('html').outerHeight(true);
    if($('#appui_head').css('display') != 'none'){
        new_height = new_height - $('#appui_head').outerHeight(true);
    }
    if($('#appui_foot').css('display') != 'none'){
        new_height = new_height - $('#appui_foot').outerHeight(true);
    }     
    $('#appui').height(new_height);
} 

function animate_main_image(){                  
    $.keyframe.define([{
        name: 'animate_main_image_move_' + CurrentMainID,   
        '100%': {
            height: $('#' + CurrentMainID + ' .tax_image').attr('end_height') + 'px',
            transform: 'translate(' + 
                ($('#' + CurrentMainID + ' .tax_image').attr('end_margin_left') - $('#' + CurrentMainID + ' .tax_image').attr('start_margin_left')) + 'px' + ', ' + 
                ($('#' + CurrentMainID + ' .tax_image').attr('end_margin_top') - $('#' + CurrentMainID + ' .tax_image').attr('start_margin_top')) + 'px)'  
        }
    }]);                             
    $.keyframe.define([{
        name: 'animate_fade_out',   
        '100%': {        
            opacity: 0
        }
    }]);  
    
    $('#' + CurrentMainID + ' .tax_image').css('animation', 'animate_main_image_move_' + CurrentMainID + ' ' + (ANIMATION_TIME_MS + ANIMATION_FADE_MS + 500) + 'ms linear 0s 1, animate_fade_out ' + (ANIMATION_FADE_MS + 100) + 'ms linear ' + ANIMATION_TIME_MS + 'ms 1');    
                                                                    
                                                                            
    $('#' + CurrentMainID + ' .TaxonomyReferenceNotes').animate({
        opacity: 1
    }, ANIMATION_FADE_MS);                                                 
    $('#' + NextMainID + ' .TaxonomyReferenceNotes').animate({
        opacity: 0
    }, ANIMATION_FADE_MS);   
    
    var thisCurrentMainID = CurrentMainID;  
    if($('#' + thisCurrentMainID + ' .taxa').length > 0){
        $('#appui_foot .taxa2').css('opacity', 0).html($('#' + thisCurrentMainID + ' .taxa').html());
    }
    else{
        $('#appui_foot .taxa2').html('');  
    }
    $('#appui_foot .taxa2').animate({
        opacity: 1
    }, ANIMATION_FADE_MS + 100);
    $('#appui_foot .taxa').animate({
        opacity: 0
    }, ANIMATION_FADE_MS, function(){     
        $('#appui_foot .taxa').html($('#appui_foot .taxa2').html()).css('opacity', 1);                                    
//        if($('#' + thisCurrentMainID + ' .taxa').length > 0){
//            $('#appui_foot .taxa').replaceWith($('#' + thisCurrentMainID + ' .taxa')).css(opacity, 1);
//        }
//        else{
//            $('#appui_foot .taxa').empty();  
//        } 
    });             
    window.setTimeout(function(){   
        $('#' + thisCurrentMainID + ' .tax_image').css('opacity', 0);  
    }, ANIMATION_TIME_MS + ANIMATION_FADE_MS);                             
}

function after_next_image_load(){  
    var container_height, container_width, image_height, image_width, 
        min_next_image_height, min_next_image_width;
        
    /* calc next_image height and offsets for animation start */
    container_height = $('#appui').height();
    container_width = $('#appui').width();
    image_height = $('#next_image').height();
    image_width = $('#next_image').width();
                                                         
    if((container_height / container_width) > (image_height / image_width)){
        /* Container is taller per width than image */
        min_next_image_height = container_height; 
        min_next_image_width = container_height * (image_width / image_height);
    }
    else{
        /* Container is wider per height than image */
        min_next_image_height = container_width * (image_height / image_width); 
        min_next_image_width = container_width;       
    }         
                                                       
    small_percent = getRandomInt(100, 115);
    percent_change = getRandomInt(20, 40);
    
    margin_left_offset_start = 0;// getRandomFloat(0, 0.2); 
    margin_left_offset_end = 0;// getRandomFloat(0, 0.2);
    
    margin_top_offset_start = 0;// getRandomFloat(0, 0.2); 
    margin_top_offset_end = 0;// getRandomFloat(0, 0.2);
    
    small_height = Math.round(min_next_image_height * (small_percent / 100));
    large_height = Math.round(min_next_image_height * ((small_percent + percent_change) / 100));
    
    /* grow or srink? */
    if(getRandomInt(1, 2) == 1){  
        start_height = small_height;
        end_height = large_height; 
    }
    else{   
        start_height = large_height;
        end_height = small_height; 
    }
                               
    /* Right to left, or left to right? */
    if(getRandomInt(1, 2) == 1){  
        start_margin_left = -Math.round((start_height * (image_width / image_height) - min_next_image_width) * margin_left_offset_start); 
        end_margin_left = -Math.round((end_height * (image_width / image_height) - min_next_image_width) * (1 - margin_left_offset_end));
    }
    else{   
        start_margin_left = -Math.round((start_height * (image_width / image_height) - min_next_image_width) * (1 - margin_left_offset_start)) 
        end_margin_left = -Math.round((end_height * (image_width / image_height) - min_next_image_width) * margin_left_offset_end);
    }
      
    /* Top to bottom, or bottom to top */
    if(getRandomInt(1, 2) == 1){     
        start_margin_top = -Math.round((start_height - min_next_image_height) * margin_top_offset_start); 
        end_margin_top = -Math.round((end_height - min_next_image_height)  * (1 - margin_top_offset_end));
    }
    else{   
        start_margin_top = -Math.round((start_height - min_next_image_height)  * (1 - margin_top_offset_start)); 
        end_margin_top = -Math.round((end_height - min_next_image_height) * margin_top_offset_end);
    }
                                   
    $('#next_image').height(start_height + 'px');                              
    $('#next_image').attr('start_height', start_height);
    $('#next_image').attr('end_height', end_height);             
    
    $('#next_image').css('marginLeft', start_margin_left + 'px');
    $('#next_image').attr('start_margin_left', start_margin_left);
    $('#next_image').attr('end_margin_left', end_margin_left);
    
    $('#next_image').css('marginTop', start_margin_top + 'px');  
    $('#next_image').attr('start_margin_top', start_margin_top);
    $('#next_image').attr('end_margin_top', end_margin_top);
}

function getRandomInt(min, max) {
    return Math.round(getRandomFloat(min, max));
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function float2int (value) {
    return value | 0;
}

var LOOKUP_ISAPI_URI = SERVER_HREF + '/tracks/tracksmobile.dll';
var APP_UI_CONTAINER_ELEMENT_ID = 'appui';    
var ENCLOSURE_TAXA_LISTING_DIV = 'listing';
var TAXA_DETAIL_DISPLAY_DIV = 'detail';
var INSTITUTION = "InstitutionName";
var REQUEST_TYPE_GET = 'get';
var REQUEST_TYPE_POST = 'post';
var DATA_TYPE_JSON = 'json';  
var SESSION_COOKIE_NAME = 'SignageSessID';
var SESSION_ID_NAME = 'TracksSessionID';
var NOT_LOGGED_IN = "not-logged-in";
var LOGGED_IN = "logged-in";
var LOGIN_POSTFIX = '/login';
var AMPER = "&";
var EQUALS = "=";
var QUESTION = "?";
var SLASH = "/";
var COMMA = ",";
var SESSION_CHECK_CALL_TAG = "t-t-7-ß-4$^00b"
var EMPTY_RESULT_SET_INDICATOR = "NO_RECORDS";
var LOOKUP_ENCLOSURE_POSTFIX = '/guest-enclosure-lookup';
var ENCLOSURE_TAXA_LIST_POSTFIX = '/guest-enclosure';
var ANIMAL_INFO_POSTFIX = '/guest-animal';
var TAXA_INFO_POSTFIX = '/guest-taxa';
var SYSTEMSETTING_POSTFIX = '/systemsetting';
var VISITOR_ENGAGEMENT_TAXA_MEDIA_TAG = 'visitor%20engagement';
var MEDIA_POSTFIX = '/media';
var ENCLOSURE_IDENTIFIER_TYPE = 'IdentifierType';
var ENCLOSURE_ID = 'IdentifierValue';
var SIGNAGE_IDENTIFIER_TYPE = 'Signage%20ID';
var DATATYPE_PAIR_NAME = 'datatype';
var TEXT_PAIR_NAME = 'Text';
var RETURN_TYPE_PAIR_NAME = 'ReturnType';
var IMAGE_TYPE_PAIR_NAME = 'ImageTags';
var NOTES_CATEGORIES_PAIR_NAME = 'NotesCategories';
var SETTING_ID_PAIR_NAME = 'settingid';
var TAXA_DATATYPE = 'taxa';
var ANIMALS_DATATYPE = 'animals';
var ACTIVITY_DATATYPE = 'activity';
var IMAGE_DATATYPE = 'image';
var NOTES_DATAYPE = 'notes';
var SPECIES_INFO_NOTE_TYPE = 'Species Characteristics';
var HABITAT_INFO_NOTE_TYPE = 'Habitat';
var LARGE_IMAGE_RETURN_TYPE = 'file';