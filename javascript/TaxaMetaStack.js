TaxaMetaStack = function(TaxaMetaObjArray) {
	this.init(TaxaMetaObjArray);
}
/* This object is a stack implementation, most useful because 
   it can instantiate itself from the JSON returned from an 
   AJAX call for all taxa in a given enclosure. 
   Stack of simple objects, each representing a taxa found in this enclosure. */
$.extend(TaxaMetaStack.prototype, {
    ObjArray: null,

    init: function(MetaObjArray) {
        var TempObjArray, ThisHabitatNote, ThisSpeciesNote;

        TempObjArray = [];

        $.each(MetaObjArray, function(idx, OneMetaObj) {
            ThisHabitatNote = '';
            ThisSpeciesNote = '';

            $.each(OneMetaObj.Notes, function(idx, NoteObj) {
                if(NoteObj.Category == SPECIES_INFO_NOTE_TYPE)
                    ThisSpeciesNote = NoteObj.Note;
                if(NoteObj.Category == HABITAT_INFO_NOTE_TYPE)
                    ThisHabitatNote = NoteObj.Note;
            });

            var MetaObject = {
                TaxonomyID: OneMetaObj.TaxID,
                TaxCommon: OneMetaObj.Common,
                TaxGSS: OneMetaObj.Scientific,
                MediaID: OneMetaObj.Media[0].MediaMasterID,
                HabitatNote: ThisHabitatNote,
                SpeciesNote: ThisSpeciesNote,
                Rank: OneMetaObj.Rank,
                Endangered: OneMetaObj.Endangered,
                Venomous: OneMetaObj.Venomous
            };

            TempObjArray.push(MetaObject);
        });

        this.ObjArray = TempObjArray.reverse();
    },

    pop: function() { return this.ObjArray.pop(); },

    hasMetaObjects: function() { return this.ObjArray.length > 0; }
});
