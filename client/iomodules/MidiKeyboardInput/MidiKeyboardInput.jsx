import React from 'react';
import midiIo from '../../util/midiIo';
import midiConstants from '../../util/midiConstants';

export default class MidiKeyboardInput extends React.Component {
  constructor(props) {
    super(props);

    this.LIMIT_MS = 100;
    
    this.state = {
      availableMidiInputs: [],
      notesPressed: [],
    };

    this.init = this.init.bind(this);
    this.onMidiMessage = this.onMidiMessage.bind(this);
    this.setActiveMidiInput = this.setActiveMidiInput.bind(this);
    this.animate = this.animate.bind(this);
    this.handleToggleWaitForInput = this.handleToggleWaitForInput.bind(this);
    this.noteOn = this.noteOn.bind(this);
    this.checkInput = this.checkInput.bind(this);
    this.clearNotesRequired = this.clearNotesRequired.bind(this);
    this.currentMsChanged = this.currentMsChanged.bind(this);
    
    this.keyBuffer = [];
    this.notesRequired = [];

    this.init();
  }

  init() {
    midiIo.get().then(midi => {
      const availableMidiInputs = [];
      midi.inputs.forEach(input => {
        availableMidiInputs.push(input);
        if (!this.activeMidiInput) {
          this.setActiveMidiInput(input);
        }
      });
      this.setState({
        availableMidiInputs,
      });
    });
  }

  noteFoundInKeyBuffer(noteNumber) {
    for (let i=0; i < this.keyBuffer.length; i++) {
      let key = this.keyBuffer[this.keyBuffer.length - i - 1];
      if (this.globalTimestamp - key.globalTimestamp > this.LIMIT_MS) {
        return false;
      }
      if (key.key === noteNumber)  {
        return true;
      }
    }
    return false;
  }

  clearNotesRequired() {
    this.notesRequired = [];
    clearTimeout(this.waitingTimeout);
    this.waitingTimeout = null;
  }

  checkInput() {
    if (this.notesRequired.every(required => this.noteFoundInKeyBuffer(required))) {
      this.clearNotesRequired();
      this.props.setPlaying(true);
    }
  }

  onMidiMessage(evt) {
    let updatedNotes = null;
    const [ message, key, velocity ] = evt.data;
    if (message === midiConstants.NOTE_OFF) {
      updatedNotes = this.state.notesPressed.filter(n => n !== key);
    } else if (message === midiConstants.NOTE_ON) {
      if (!this.state.notesPressed.includes(key)) {
        updatedNotes = [ ...this.state.notesPressed, key ];
      }
      this.keyBuffer.push({ 
        key, 
        globalTimestamp: this.globalTimestamp, 
        playerTimeMillis: this.playerTimeMillis,
      });
    }
    if (updatedNotes) {
      this.setState({
        notesPressed: updatedNotes,
      });
    }

    if (this.state.waitForInput) {
      this.checkInput();
    }
  }

  animate(playerTimeMillis, parsedMidiFile, timestamp) {
    this.playerTimeMillis = playerTimeMillis;
    this.globalTimestamp = timestamp;

    if (this.state.waitForInput && this.notesRequired.length && !this.waitingTimeout) {
      this.waitingTimeout = setTimeout(() => {
        this.props.setPlaying(false);
      }, 100);
    }
  }

  setActiveMidiInput(input) {
    input.onmidimessage = this.onMidiMessage;
    this.activeMidiInput = input;
  }

  noteOn(note) {
    if (this.state.waitForInput) {
      this.notesRequired.push(note.noteNumber);
    }
  }

  handleToggleWaitForInput() {
    const newState = this.state.waitForInput;
    if (!newState) {
      this.notesRequired = [];
    }
    this.setState({
      waitForInput: !newState,
    });
  }

  currentMsChanged() {
    this.clearNotesRequired();
  }

  render() {
    return (
       <div>
         <div>
          <span>MIDI input device</span>
          <span>
            <select>
              { this.state.availableMidiInputs.map(input =>
                <option key={input.id} value={input.id}>{input.name}</option>
              ) }
            </select>
            <input type='checkbox' value={this.state.waitForInput} onClick={this.handleToggleWaitForInput} /> Wait for correct input
          </span>
        </div>
        <div>
          { this.state.notesPressed.join(',') || '...' }
        </div>
      </div>
    );
  }
}