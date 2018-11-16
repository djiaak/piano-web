import storage from '../util/storage';
import base64ToArrayBuffer from '../util/base64ToArrayBuffer';
import arrayBufferToBase64 from '../util/arrayBufferToBase64';
import sampleSong from '../external/MidiSheetMusic/songs/Beethoven__Moonlight_Sonata.mid';
import ParsedMidiFile from '../util/ParsedMidiFile';

import { 
  PLAY,
  PAUSE,
  SET_TEMPO,
  LOAD_FILE_SUCCESS,
  LOAD_FILE_DATA_SUCCESS,
} from '../constants/actionTypes';

const SAMPLE_SONG_NAME = 'Beethoven__Moonlight_Sonata.mid';

export const loadFile = file => (dispatch, getState) =>
  readFile(file, file.name)
    .then(result => dispatch(fileLoaded(result.arrayBuffer, result.filename)))
    .then(result => dispatch(loadFileData(result.payload.midiFileName)))
    .then(result => storage.saveGlobalData(stateToSave(getState())));

export const loadGlobalData = () => dispatch =>
  storage.loadGlobalData()
    .then(data => { 
      if (data && data.midiArrayBuffer) {
        return dispatch(fileLoaded(
          base64ToArrayBuffer(data.midiArrayBuffer), data.midiFileName));
      }

      return loadSampleData()
        .then(result => dispatch(fileLoaded(result.arrayBuffer, result.filename)));
    })
    .then(result => dispatch(loadFileData(result.payload.midiFileName)));

export const loadFileData = filename => dispatch => 
  storage.loadFileData(filename)
    .then(result => dispatch(fileDataLoaded(result)));

const loadSampleData = () =>
  fetch(sampleSong)
      .then(response => response.blob())
      .then(blob => readFile(blob, SAMPLE_SONG_NAME));

const readFile = (file, filename) => 
  new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve({arrayBuffer: e.target.result, filename});
    reader.readAsArrayBuffer(file);
  });

const stateToSave = state => ({
  midiArrayBuffer: state.midiArrayBuffer,
  midiFileName: state.midiFileName,
});

const fileLoaded = (arrayBuffer, filename) => ({
  type: LOAD_FILE_SUCCESS,
  payload: {
    parsedMidiFile: new ParsedMidiFile(arrayBuffer, filename),
    midiArrayBuffer: arrayBufferToBase64(arrayBuffer),
    midiFileName: filename,
  }
});

const fileDataLoaded = data => ({
  type: LOAD_FILE_DATA_SUCCESS,
  payload: {
    ...data,
  },
});