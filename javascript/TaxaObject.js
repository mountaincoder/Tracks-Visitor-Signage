TaxaObject = function(TaxaObj) {
    if(TaxaObj != undefined){
        this.init(TaxaObj);
    }
}
/* This object represents all the attributes of a Taxonomy necessary 
   to draw a panel. It includes a drawPage method for generating its own HTML */
$.extend(TaxaObject.prototype, {
    TaxonomyID: -1,
    TaxCommon: '',
    TaxGSS: '',
    SpeciesCharacteristics: null,
    Habitat: null,
    ReferenceImage: null,
    JSONInitCount: 0,
    JSONTotalCount: 3,
    AfterInitCallback: null,
    
    drawPage: function(DivToDraw) {
        var SpeciesContainerDivName, SpeciesContainerHideDivName;            

        $('<div>').attr({
            id: "ImageDiv" + this.TaxonomyID,
            class: "TaxaReferenceMedia"
        }).appendTo(DivToDraw);

        $("#ImageDiv" + this.TaxonomyID).html(
            '<img class="tax_image" src="' + this.ReferenceImage + '" alt="' + this.TaxCommon + '">');  
                                                      
        $('<div>').attr({
            id: "ReferenceNotesDiv",
            class: "TaxonomyReferenceNotes"
        }).appendTo(DivToDraw)
            .append(
                '<div class="HabitatNote">' + this.Habitat + '</div>' +
                '<div class="SpeciesCharacteristics">' + this.SpeciesCharacteristics + '</div>'
            );
            
        $(DivToDraw).append('<div class="taxa"><div class="common">' + this.TaxCommon + '</div><div class="gss">' + this.TaxGSS + '</div></div>');
    },

    init: function(TaxaObj) {
        this.TaxonomyID = TaxaObj.TaxonomyID;
        this.TaxCommon = TaxaObj.TaxCommon;
        this.TaxGSS = TaxaObj.TaxGSS;

        populateTaxaImage(this, TaxaObj.MediaID);
        populateTaxaNotes(this, TaxaObj.SpeciesNote, SPECIES_INFO_NOTE_TYPE);
        populateTaxaNotes(this, TaxaObj.HabitatNote, HABITAT_INFO_NOTE_TYPE);
    },
    setAfterInit: function(callback){
        this.AfterInitCallback = callback;
    },
    afterInitJSON: function(){
        this.JSONInitCount++;          
        if(this.JSONInitCount == this.JSONTotalCount){
            if(this.AfterInitCallback != null){
                this.AfterInitCallback();  
            }
        }
    },
	/* Callback for the Ajax request to send found data. */
	loadSpeciesCharacteristics: function(SpeciesCharText) {
		this.SpeciesCharacteristics = SpeciesCharText;
	},
    /* Callback for the Ajax request to send found data. */
	loadHabitatInfo: function(HabitatInfoText) {
		this.Habitat = HabitatInfoText;
	},
    /* Callback for the Ajax request to send found data. */
	loadImage: function(ImgSrc) {
        this.ReferenceImage = ImgSrc;
	},
    /* accessor method for Tax ID property */
    getThisTaxonomyID: function() { return this.TaxonomyID; }
});
