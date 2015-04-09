var Reflux = require('reflux');
var _ = require('underscore');
var SurveyData = require('../data.js');
var SurveyActions = require('../actions/SurveyActions');
var ItemTypes = require('../components/ItemTypes');

var SurveyStore = Reflux.createStore({
    listenables: [SurveyActions],
    data: {
        surveyData: [],
        dropTargetID: null,
        modalState: {
            option: false,
            block: false,
            question: false
        }
    },
    init() {
        this.listenTo(SurveyActions.load, this.fetchData);

        // initialize question and option map which will help in
        // faster retrieval of associated blocks and questions.
        this.questionMap = {};      // question -> block
        this.optionMap = {};        // option -> question
    },
    fetchData() {
        this.updateData(SurveyData);
    },
    updateData(data) {
        this.data.surveyData = data;
        this.trigger(this.data);
    },
    getInitialState() {
        return {
            surveyData: this.data.surveyData,
            modalState: this.data.modalState
        }
    },
    getNewBlock(block) {
        return {
            id: block.id,
            questions: [],
            subblocks: []
        }
    },
    getNewQuestionId() {
        // TODO: Refer to java code for ID generation
        return Math.floor((Math.random() * 1000) + 1);
    },
    getNewQuestion(question) {
        var id = this.getNewQuestionId();
        return {
            id: id,
            options: [],
            qtext: question.qtext
        }
    },
    getNewOption(option) {
        var id = this.getNewQuestionId();
        return {
            id: id,
            otext: option.otext
        }
    },
    /**
     * Runs when the blockDropped action is called by the view.
     * Adds a new block to the end of the survey object.
     */
    onBlockDropped() {
        var survey = this.data.surveyData;
        var newId = survey.length,
            newBlock = this.getNewBlock({id: newId}),
            newSurvey = survey.concat(newBlock);

        this.updateData(newSurvey);
        console.log("new block added");
    },
    /**
     * Runs when the questionDropped action is called by the view.
     * Adds a question to the block who's id is provided as param
     * @param questionObj A POJO containing data the for the new question.
     * with the following keys - parentID, qtext, ordering, freetext, exclusive
     */
    onQuestionDropped(questionObj) {

        var survey = this.data.surveyData,
            position = questionObj.parentID,
            block = survey[position];

        if (!block) {
            throw new Error("block does not exist");
        }

        // TODO: pass other params
        var newQuestion = this.getNewQuestion({qtext: questionObj.qtext});
        block.questions = block.questions.concat(newQuestion);

        // update question map with new question
        this.questionMap[newQuestion.id] = questionObj.parentID;

        this.updateData(survey);
        console.log("New question added");
    },
    /**
     * Runs when the optionDropped action is called by the view.
     * Adds an option to the question whose id is provided as an argument.
     * @param questionId (int) of the question to which the option will be added.
     */
    onOptionDropped(questionId) {
        var survey = this.data.surveyData,
            blockId = this.questionMap[questionId];

        var question = _.find(survey[blockId].questions, ques => {
            return ques.id === questionId
        });

        if (!question) {
            throw new Error('Question not found');
        }

        var otext = prompt("Enter option text");
        if (otext == undefined) {
            return;
        }

        var newOption = this.getNewOption({otext: otext});
        question.options = question.options.concat(newOption);

        // update the option map
        this.optionMap[newOption.id] = question.id;

        this.updateData(survey);
        console.log("new option added");
    },
    /**
     * Run when the action toggleModal is called by the view
     * @param modalType - Refer to the type of object that was dropped
     * @param dropTargetID - Refers to the ID on which the object was dropped
     */
    onToggleModal(modalType, dropTargetID) {

        // causes a modal popup to toggle
        var modalState = this.data.modalState;
        if (modalType === ItemTypes.QUESTION) {
            modalState.question = !modalState.question;
        } else if (modalType === ItemTypes.OPTION) {
            modalState.option = !modalState.option;
        } else {
            modalState.block = !modalState.block;
        }

        // sets the correct dropTarget to pass down to component
        this.data.dropTargetID = dropTargetID;
        this.trigger(this.data);
    }
});

module.exports = SurveyStore;