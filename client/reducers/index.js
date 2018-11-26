import pianoReducer from './pianoReducer';
import playerReducer from './playerReducer';
import sheetMusicOutputReducer from './sheetMusicOutputReducer';
import midiKeyboardInputReducer from './midiKeyboardInputReducer';
import ledStripOutputReducer from './ledStripOutputReducer';
import {
  PLAYER,
  SHEET_MUSIC_OUTPUT,
  MIDI_KEYBOARD_INPUT,
  LED_STRIP_OUTPUT,
} from '../constants/reducerNames';

const combineReducers = reducers => (state = {}, action) => {
  const rootState = pianoReducer(state, action);
  return Object.keys(reducers).reduce((nextState, key) => {
    nextState[key] = reducers[key](rootState[key], action);
    return nextState;
  }, rootState);
};

export default combineReducers({
  [PLAYER]: playerReducer,
  [SHEET_MUSIC_OUTPUT]: sheetMusicOutputReducer,
  [MIDI_KEYBOARD_INPUT]: midiKeyboardInputReducer,
  [LED_STRIP_OUTPUT]: ledStripOutputReducer,
});
