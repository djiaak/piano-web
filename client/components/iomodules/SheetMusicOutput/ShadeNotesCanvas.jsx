import React from 'react';
import PropTypes from 'prop-types';
import {
  SHADE_NOTE_TYPE_CURRENT,
  SHADE_NOTE_TYPE_SELECTION,
  SHADE_NOTE_TYPE_TRANSPARENT,
} from '../../../constants/shadeNoteTypes';

export default class ShadeNotesCanvas extends React.Component {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    shadeNotesFunc: PropTypes.func,
    setCurrentNotePosition: PropTypes.func,
    setCurrentSelection: PropTypes.func,
    shadedNotes: PropTypes.arrayOf(
      PropTypes.shape({
        pulseTime: PropTypes.number,
        type: PropTypes.number,
      }),
    ),
  };

  constructor(props) {
    super(props);

    this.shadedNotesSet = new Set();
    this.toAdd = [];
    this.toRemove = [];
  }

  componentDidMount() {
    this.ctx = this.canvasShadeNotes.getContext('2d');
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
        (this.props.shadedNotes || []).map(n => this.noteToKey(n)),
      );
      this.toRemove = [...previousNotesSet].filter(
        n => !this.shadedNotesSet.has(n),
      );
      this.toAdd = [...this.shadedNotesSet].filter(
        n => !previousNotesSet.has(n),
      );
      this.toAdd.forEach(key => {
        const { pulseTime, type } = this.noteFromKey(key);
        if (type === SHADE_NOTE_TYPE_SELECTION) {
          const shadeRect =
            this.props.shadeNotesFunc &&
            this.props.shadeNotesFunc(
              pulseTime,
              SHADE_NOTE_TYPE_TRANSPARENT,
              false,
            );
          shadeRect &&
            this.props.setCurrentSelection &&
            this.props.setCurrentSelection(shadeRect);
        }
      });
    }
  }

  noteToKey = n => `${n.pulseTime}_${n.type}`;

  noteFromKey = key => {
    const parts = key.split('_');
    return {
      pulseTime: parseFloat(parts[0]),
      type: parseInt(parts[1], 10),
    };
  };

  unshadePreviousNotes = () => {
    this.toRemove.forEach(key => {
      const { pulseTime, type } = this.noteFromKey(key);
      this.props.shadeNotesFunc &&
        this.props.shadeNotesFunc(pulseTime, type, true);
    });
    if (this.lastCurrentNoteShadeRect) {
      this.ctx.clearRect(
        this.lastCurrentNoteShadeRect.X,
        this.lastCurrentNoteShadeRect.Y,
        this.lastCurrentNoteShadeRect.Width,
        this.lastCurrentNoteShadeRect.Height,
      );
    }
  }

  shadeNewNotes = playingPulseTime => {
    this.toAdd.forEach(key => {
      const { pulseTime, type } = this.noteFromKey(key);
      this.props.shadeNotesFunc &&
        this.props.shadeNotesFunc(pulseTime, type, false);
    });
    this.toAdd.length = 0;
    this.toRemove.length = 0;

    if (playingPulseTime >= 0) {
      const shadeRect =
        this.props.shadeNotesFunc &&
        this.props.shadeNotesFunc(
          playingPulseTime,
          SHADE_NOTE_TYPE_CURRENT,
          false,
        );

      if (
        shadeRect &&
        this.props.setCurrentNotePosition &&
        this.lastNoteY !== shadeRect.Y
      ) {
        this.props.setCurrentNotePosition(shadeRect.Y);
        this.lastCurrentNoteShadeRect = shadeRect;
      }
    }
  }

  animate = (scrollOffset, playingPulseTime) => {
    this.ctx.translate(0, -this.lastScrollOffset);
    this.unshadePreviousNotes();
    this.ctx.translate(0, this.lastScrollOffset);

    this.ctx.translate(0, -scrollOffset);
    this.shadeNewNotes(playingPulseTime);
    this.ctx.translate(0, scrollOffset);

    this.lastScrollOffset = scrollOffset;
  };

  clearShadeNotes = () => {
    this.ctx.clearRect(
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
