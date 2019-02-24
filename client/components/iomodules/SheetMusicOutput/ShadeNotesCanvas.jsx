import React from 'react';
import PropTypes from 'prop-types';
import { SHADE_NOTE_TYPE_CURRENT, SHADE_NOTE_TYPE_SELECTION } from '../../../constants/shadeNoteTypes';

export default class ShadeNotesCanvas extends React.Component {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    shadeNotesFunc: PropTypes.func,
    setCurrentNotePosition: PropTypes.func,
    setCurrentSelection: PropTypes.func,
    shadedNotes: PropTypes.arrayOf(PropTypes.shape({
      pulseTime: PropTypes.number,
      type: PropTypes.number,
    }))
  };

  constructor(props) {
    super(props);

    this.shadedNotesSet = new Set();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.width) {
      this.canvasShadeNotes.width = this.props.width;
    }
    if (this.props.height) {
      this.canvasShadeNotes.height = this.props.height;
    }
    if (this.props.shadedNotes !== prevProps.shadedNotes) {
      const previousNotesSet = this.shadedNotesSet;
      this.shadedNotesSet = new Set(
        (this.props.shadedNotes || []).map(n => this.noteKey(n))
      );
      const toRemove = [...previousNotesSet]
        .filter(n => !this.shadedNotesSet.has(n));
      const toAdd = [...this.shadedNotesSet]
        .filter(n => !previousNotesSet.has(n));
      
        
      this.props.shadedNotes.forEach(n => {
        const shadeRect = this.props.shadeNotesFunc && this.props.shadeNotesFunc(n.pulseTime, n.type);
        if (n.type === SHADE_NOTE_TYPE_SELECTION) {
          if (shadeRect) {
            this.props.setCurrentSelection &&
              this.props.setCurrentSelection(shadeRect);
          }
        } 
      });
    }
    // let difference = arrA
    //              .filter(x => !arrB.includes(x))
    //              .concat(arrB.filter(x => !arrA.includes(x)));
  }

  noteKey = n => `${n.pulseTime}_${n.type}`;

  animate = (scrollOffset, playingPulseTime) => {
    const ctx = this.canvasShadeNotes.getContext('2d');
    ctx.translate(0, -scrollOffset);

    if (this.lastCurrentNoteShadeRect) {
      ctx.clearRect(
        this.lastCurrentNoteShadeRect.X,
        this.lastCurrentNoteShadeRect.Y,
        this.lastCurrentNoteShadeRect.Width,
        this.lastCurrentNoteShadeRect.Height
      );
    }

    if (playingPulseTime >= 0) {
      const shadeRect = this.props.shadeNotesFunc &&
        this.props.shadeNotesFunc(playingPulseTime, SHADE_NOTE_TYPE_CURRENT);

      if (shadeRect && this.props.setCurrentNotePosition && this.lastNoteY !== shadeRect.Y) {
        this.props.setCurrentNotePosition(shadeRect.Y);
        this.lastCurrentNoteShadeRect = shadeRect;
      }
    }

    ctx.translate(0, scrollOffset);
  }

  clearShadeNotes = () => {
    const ctx = this.canvasShadeNotes.getContext('2d');
    ctx.clearRect(
      0,
      0,
      this.canvasShadeNotes.width,
      this.canvasShadeNotes.height,
    );
  };

  render() {
    return (
      <canvas
        style={{ zIndex: 1, pointerEvents: 'none' }}
        className="canvas-shadeNotes"
        ref={el => (this.canvasShadeNotes = el)}
        width={1}
        height={1}
      />
    );
  }
}