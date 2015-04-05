var Reflux = require('reflux');
var _ = require('underscore');
var SurveyData = require('../data.js');
var SurveyActions = require('../actions/SurveyActions');

var SurveyStore = Reflux.createStore({
    listenables: [SurveyActions],
    data: {
        surveyData: []
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
            surveyData: this.data.surveyData
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
    onBlockDropped() {
        var survey = this.data.surveyData;
        var newId = survey.length,
            newBlock = this.getNewBlock({id: newId}),
            newSurvey = survey.concat(newBlock);

        this.updateData(newSurvey);
        console.log("new block added");
    },
    /**
     * Run when the questionDropped action is called by the view.
     * Adds a question to the block who's id is provided as param
     * @param blockId (int) of the block to which the question will be added.
     */
    onQuestionDropped(blockId) {
        var survey = this.data.surveyData,
            position = blockId,
            block = survey[position];

        if (!block) {
            throw new Error("block does not exist");
        }

        var qtext = prompt("Enter question text");
        if (qtext == undefined) {
            return;
        }

        var newQuestion = this.getNewQuestion({qtext: qtext});
        block.questions = block.questions.concat(newQuestion);

        // update question map with new question
        this.questionMap[newQuestion.id] = blockId;

        this.updateData(survey);
        console.log("New question added");
    },
    /**
     * Run when the optionDropped action is called by the view.
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

        this.updateData(survey);
        console.log("new option added");
    }
});

module.exports = SurveyStore;