var React = require('react');
var Block = require('./Block');
var SurveyActions = require('../actions/SurveyActions');
var ItemTypes = require('./ItemTypes');
var HelpText = require('./HelpText');
var { List } = require('immutable');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;
var cx = require('classnames');
var { DropTarget } = require('react-dnd');
var ReactCSSTransitionGroup = require('react/addons').addons.CSSTransitionGroup;
var SurveyMan = require('../sub/surveyman.js/SurveyMan/surveyman');

var surveyTarget = {
  drop(props, monitor, component) {
    let droppedOnChild = !monitor.isOver({ shallow: true });
    if (!droppedOnChild) {
      component.handleBlockDrop();
    }
  }
};

function collect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOverCurrent: monitor.isOver({ shallow: true })
  };
}

function renderSubblocks(block) {
  var subblocks = block.subblocks;
  if (subblocks.length > 0) {
    return subblocks.map(subb =>
            <Block
                block={subb}
                id={subb.id}
                key={subb.id}
                >
              {renderSubblocks(subb)}
            </Block>
    );
  }
}

var Survey = React.createClass({
  mixins: [PureRenderMixin],
  propTypes: {
    survey: React.PropTypes.instanceOf(SurveyMan.survey.Survey).isRequired
  },
  handleBlockDrop() {
    SurveyActions.blockDropped();
  },
  render() {
    var { survey, isOverCurrent, connectDropTarget } = this.props;

    console.assert(survey !== undefined);

    var classes = cx({
      'survey': true,
      'dragging': isOverCurrent,
      'hovering': isOverCurrent
    });

    var blocks = survey.topLevelBlocks.map(block => {
      return (
          <Block
              block={block}
              id={block.id}
              key={block.id}
              >
            {renderSubblocks(block)}
          </Block>
      );
    });

    // wrapping the blocks in a react transition group
    var blockAnimationTag = (
        <ReactCSSTransitionGroup transitionName="itemTransition" transitionEnter={false}>
          { blocks }
        </ReactCSSTransitionGroup>
    );

    return connectDropTarget(
        <div className={classes}>
          { survey.topLevelBlocks.length > 0 ? blockAnimationTag : <HelpText itemType="Block" /> }
        </div>
    );
  }
});

module.exports = DropTarget(ItemTypes.BLOCK, surveyTarget, collect)(Survey);
