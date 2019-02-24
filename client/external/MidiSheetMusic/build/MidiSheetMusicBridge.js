/**
 * @version 1.0.0.0
 * @copyright Copyright ©  2017
 * @compiler Bridge.NET 16.6.0
 */
Bridge.assembly("MidiSheetMusicBridge", function ($asm, globals) {
    "use strict";

    Bridge.define("MidiSheetMusic.Accid", {
        $kind: "enum",
        statics: {
            fields: {
                None: 0,
                Sharp: 1,
                Flat: 2,
                Natural: 3
            }
        }
    });

    Bridge.define("MidiSheetMusic.MusicSymbol");

    Bridge.define("MidiSheetMusic.Image", {
        fields: {
            DomImage: null
        },
        props: {
            Width: {
                get: function () {
                    return bridgeUtil.image.getWidth(this);
                }
            },
            Height: {
                get: function () {
                    return bridgeUtil.image.getHeight(this);
                }
            }
        },
        ctors: {
            ctor: function (type, filename) {
                this.$initialize();
                bridgeUtil.image.ctor(this, type, filename);
            }
        }
    });

    Bridge.define("MidiSheetMusic.BoundedByteArray", {
        fields: {
            offset: 0,
            count: 0,
            data: null
        },
        ctors: {
            ctor: function (offset, count, data) {
                this.$initialize();
                this.offset = offset;
                this.count = count;
                this.data = data;
            }
        },
        methods: {
            GetData: function () {
                var slice = System.Array.init(this.count, 0, System.Byte);
                System.Array.copy(this.data, this.offset, slice, 0, this.count);
                return slice;
            }
        }
    });

    Bridge.define("MidiSheetMusic.Brush", {
        fields: {
            Color: null
        },
        ctors: {
            ctor: function (color) {
                this.$initialize();
                this.Color = color;
            }
        },
        methods: {
            Dispose: function () { }
        }
    });

    Bridge.define("MidiSheetMusic.Brushes", {
        statics: {
            props: {
                Black: {
                    get: function () {
                        return new MidiSheetMusic.Brush(MidiSheetMusic.Color.Black);
                    }
                },
                White: {
                    get: function () {
                        return new MidiSheetMusic.Brush(MidiSheetMusic.Color.White);
                    }
                },
                LightGray: {
                    get: function () {
                        return new MidiSheetMusic.Brush(MidiSheetMusic.Color.LightGray);
                    }
                }
            }
        }
    });

    Bridge.define("MidiSheetMusic.Clef", {
        $kind: "enum",
        statics: {
            fields: {
                Treble: 0,
                Bass: 1
            }
        }
    });

    Bridge.define("MidiSheetMusic.ClefMeasures", {
        statics: {
            methods: {
                MainClef: function (notes) {
                    var $t;
                    var middleC = MidiSheetMusic.WhiteNote.MiddleC.Number();
                    var total = 0;
                    $t = Bridge.getEnumerator(notes);
                    try {
                        while ($t.moveNext()) {
                            var m = $t.Current;
                            total = (total + m.Number) | 0;
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }if (notes.Count === 0) {
                        return MidiSheetMusic.Clef.Treble;
                    } else if (((Bridge.Int.div(total, notes.Count)) | 0) >= middleC) {
                        return MidiSheetMusic.Clef.Treble;
                    } else {
                        return MidiSheetMusic.Clef.Bass;
                    }
                }
            }
        },
        fields: {
            clefs: null,
            measure: 0
        },
        ctors: {
            ctor: function (notes, measurelen) {
                this.$initialize();
                this.measure = measurelen;
                var mainclef = MidiSheetMusic.ClefMeasures.MainClef(notes);
                var nextmeasure = measurelen;
                var pos = 0;
                var clef = mainclef;

                this.clefs = new (System.Collections.Generic.List$1(MidiSheetMusic.Clef)).ctor();

                while (pos < notes.Count) {
                    /* Sum all the notes in the current measure */
                    var sumnotes = 0;
                    var notecount = 0;
                    while (pos < notes.Count && notes.getItem(pos).StartTime < nextmeasure) {
                        sumnotes = (sumnotes + notes.getItem(pos).Number) | 0;
                        notecount = (notecount + 1) | 0;
                        pos = (pos + 1) | 0;
                    }
                    if (notecount === 0) {
                        notecount = 1;
                    }

                    /* Calculate the "average" note in the measure */
                    var avgnote = (Bridge.Int.div(sumnotes, notecount)) | 0;
                    if (avgnote === 0) {
                        /* This measure doesn't contain any notes.
                          Keep the previous clef.
                        */
                    } else if (avgnote >= MidiSheetMusic.WhiteNote.BottomTreble.Number()) {
                        clef = MidiSheetMusic.Clef.Treble;
                    } else if (avgnote <= MidiSheetMusic.WhiteNote.TopBass.Number()) {
                        clef = MidiSheetMusic.Clef.Bass;
                    } else {
                        /* The average note is between G3 and F4. We can use either
                          the treble or bass clef.  Use the "main" clef, the clef
                          that appears most for this track.
                        */
                        clef = mainclef;
                    }

                    this.clefs.add(clef);
                    nextmeasure = (nextmeasure + measurelen) | 0;
                }
                this.clefs.add(clef);
            }
        },
        methods: {
            GetClef: function (starttime) {

                /* If the time exceeds the last measure, return the last measure */
                if (((Bridge.Int.div(starttime, this.measure)) | 0) >= this.clefs.Count) {
                    return this.clefs.getItem(((this.clefs.Count - 1) | 0));
                } else {
                    return this.clefs.getItem(((Bridge.Int.div(starttime, this.measure)) | 0));
                }
            }
        }
    });

    Bridge.define("MidiSheetMusic.Color", {
        statics: {
            props: {
                Black: {
                    get: function () {
                        return new MidiSheetMusic.Color();
                    }
                },
                White: {
                    get: function () {
                        return MidiSheetMusic.Color.FromRgb(255, 255, 255);
                    }
                },
                LightGray: {
                    get: function () {
                        return MidiSheetMusic.Color.FromRgb(211, 211, 211);
                    }
                }
            },
            methods: {
                FromRgb: function (red, green, blue) {
                    return MidiSheetMusic.Color.FromArgb(255, red, green, blue);
                },
                FromArgb: function (alpha, red, green, blue) {
                    var $t;
                    return ($t = new MidiSheetMusic.Color(), $t.Alpha = alpha, $t.Red = red, $t.Green = green, $t.Blue = blue, $t);
                }
            }
        },
        fields: {
            Red: 0,
            Green: 0,
            Blue: 0,
            Alpha: 0
        },
        props: {
            R: {
                get: function () {
                    return this.Red;
                }
            },
            G: {
                get: function () {
                    return this.Green;
                }
            },
            B: {
                get: function () {
                    return this.Blue;
                }
            }
        },
        ctors: {
            ctor: function () {
                this.$initialize();
                this.Alpha = 255;
            }
        },
        methods: {
            Equals: function (color) {
                return this.Red === color.Red && this.Green === color.Green && this.Blue === color.Blue && this.Alpha === color.Alpha;
            }
        }
    });

    Bridge.define("MidiSheetMusic.Control", {
        fields: {
            Width: 0,
            Height: 0,
            BackColor: null
        },
        props: {
            Parent: {
                get: function () {
                    return new MidiSheetMusic.Panel();
                }
            }
        },
        methods: {
            Invalidate: function () { },
            CreateGraphics: function (name) {
                return new MidiSheetMusic.Graphics(name);
            }
        }
    });

    Bridge.define("MidiSheetMusic.File");

    Bridge.define("MidiSheetMusic.FileMode", {
        $kind: "enum",
        statics: {
            fields: {
                Create: 0
            }
        }
    });

    Bridge.define("MidiSheetMusic.Stream", {
        methods: {
            Write: function (buffer, offset, count) { },
            Close: function () { }
        }
    });

    Bridge.define("MidiSheetMusic.Font", {
        fields: {
            Name: null,
            Size: 0,
            Style: 0
        },
        ctors: {
            ctor: function (name, size, style) {
                this.$initialize();
                this.Name = name;
                this.Size = size;
                this.Style = style;
            }
        },
        methods: {
            GetHeight: function () {
                return 0;
            },
            Dispose: function () { }
        }
    });

    Bridge.define("MidiSheetMusic.FontStyle", {
        $kind: "enum",
        statics: {
            fields: {
                Regular: 0,
                Bold: 1
            }
        }
    });

    Bridge.define("MidiSheetMusic.Graphics", {
        fields: {
            Name: null,
            Context: null,
            SmoothingMode: 0,
            VisibleClipBounds: null,
            PageScale: 0
        },
        ctors: {
            ctor: function (name) {
                this.$initialize();
                this.Name = name;
                bridgeUtil.graphics.initGraphics(this);
            }
        },
        methods: {
            TranslateTransform: function (x, y) {
                bridgeUtil.graphics.translateTransform(this, x, y);
            },
            DrawImage: function (image, x, y, width, height) {
                bridgeUtil.graphics.drawImage(this, image, x, y, width, height);
            },
            DrawString: function (text, font, brush, x, y) {
                bridgeUtil.graphics.drawString(this, text, font, brush, x, y);
            },
            DrawLine: function (pen, xStart, yStart, xEnd, yEnd) {
                bridgeUtil.graphics.drawLine(this, pen, xStart, yStart, xEnd, yEnd);
            },
            DrawBezier: function (pen, x1, y1, x2, y2, x3, y3, x4, y4) {
                bridgeUtil.graphics.drawBezier(this, pen, x1, y1, x2, y2, x3, y3, x4, y4);
            },
            ScaleTransform: function (x, y) {
                bridgeUtil.graphics.scaleTransform(this, x, y);
            },
            FillRectangle: function (brush, x, y, width, height) {
                bridgeUtil.graphics.fillRectangle(this, brush, x, y, width, height);
            },
            ClearRectangle: function (x, y, width, height) {
                bridgeUtil.graphics.clearRectangle(this, x, y, width, height);
            },
            FillEllipse: function (brush, x, y, width, height) {
                bridgeUtil.graphics.fillEllipse(this, brush, x, y, width, height);
            },
            DrawEllipse: function (pen, x, y, width, height) {
                bridgeUtil.graphics.drawEllipse(this, pen, x, y, width, height);
            },
            RotateTransform: function (angleDeg) {
                bridgeUtil.graphics.rotateTransform(this, angleDeg);
            },
            Dispose: function () { }
        }
    });

    Bridge.define("MidiSheetMusic.IOException", {
        inherits: [System.Exception]
    });

    Bridge.define("MidiSheetMusic.KeySignature", {
        statics: {
            fields: {
                C: 0,
                G: 0,
                D: 0,
                A: 0,
                E: 0,
                B: 0,
                F: 0,
                Bflat: 0,
                Eflat: 0,
                Aflat: 0,
                Dflat: 0,
                Gflat: 0,
                sharpkeys: null,
                flatkeys: null
            },
            ctors: {
                init: function () {
                    this.C = 0;
                    this.G = 1;
                    this.D = 2;
                    this.A = 3;
                    this.E = 4;
                    this.B = 5;
                    this.F = 1;
                    this.Bflat = 2;
                    this.Eflat = 3;
                    this.Aflat = 4;
                    this.Dflat = 5;
                    this.Gflat = 6;
                }
            },
            methods: {
                CreateAccidentalMaps: function () {
                    if (MidiSheetMusic.KeySignature.sharpkeys != null) {
                        return;
                    }

                    var map;
                    MidiSheetMusic.KeySignature.sharpkeys = System.Array.init(8, null, System.Array.type(MidiSheetMusic.Accid));
                    MidiSheetMusic.KeySignature.flatkeys = System.Array.init(8, null, System.Array.type(MidiSheetMusic.Accid));

                    for (var i = 0; i < 8; i = (i + 1) | 0) {
                        MidiSheetMusic.KeySignature.sharpkeys[System.Array.index(i, MidiSheetMusic.KeySignature.sharpkeys)] = System.Array.init(12, 0, MidiSheetMusic.Accid);
                        MidiSheetMusic.KeySignature.flatkeys[System.Array.index(i, MidiSheetMusic.KeySignature.flatkeys)] = System.Array.init(12, 0, MidiSheetMusic.Accid);
                    }

                    map = MidiSheetMusic.KeySignature.sharpkeys[System.Array.index(MidiSheetMusic.KeySignature.C, MidiSheetMusic.KeySignature.sharpkeys)];
                    map[System.Array.index(MidiSheetMusic.NoteScale.A, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Asharp, map)] = MidiSheetMusic.Accid.Flat;
                    map[System.Array.index(MidiSheetMusic.NoteScale.B, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.C, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Csharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.D, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Dsharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.E, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.F, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Fsharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.G, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Gsharp, map)] = MidiSheetMusic.Accid.Sharp;

                    map = MidiSheetMusic.KeySignature.sharpkeys[System.Array.index(MidiSheetMusic.KeySignature.G, MidiSheetMusic.KeySignature.sharpkeys)];
                    map[System.Array.index(MidiSheetMusic.NoteScale.A, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Asharp, map)] = MidiSheetMusic.Accid.Flat;
                    map[System.Array.index(MidiSheetMusic.NoteScale.B, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.C, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Csharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.D, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Dsharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.E, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.F, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Fsharp, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.G, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Gsharp, map)] = MidiSheetMusic.Accid.Sharp;

                    map = MidiSheetMusic.KeySignature.sharpkeys[System.Array.index(MidiSheetMusic.KeySignature.D, MidiSheetMusic.KeySignature.sharpkeys)];
                    map[System.Array.index(MidiSheetMusic.NoteScale.A, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Asharp, map)] = MidiSheetMusic.Accid.Flat;
                    map[System.Array.index(MidiSheetMusic.NoteScale.B, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.C, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Csharp, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.D, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Dsharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.E, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.F, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Fsharp, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.G, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Gsharp, map)] = MidiSheetMusic.Accid.Sharp;

                    map = MidiSheetMusic.KeySignature.sharpkeys[System.Array.index(MidiSheetMusic.KeySignature.A, MidiSheetMusic.KeySignature.sharpkeys)];
                    map[System.Array.index(MidiSheetMusic.NoteScale.A, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Asharp, map)] = MidiSheetMusic.Accid.Flat;
                    map[System.Array.index(MidiSheetMusic.NoteScale.B, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.C, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Csharp, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.D, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Dsharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.E, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.F, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Fsharp, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.G, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Gsharp, map)] = MidiSheetMusic.Accid.None;

                    map = MidiSheetMusic.KeySignature.sharpkeys[System.Array.index(MidiSheetMusic.KeySignature.E, MidiSheetMusic.KeySignature.sharpkeys)];
                    map[System.Array.index(MidiSheetMusic.NoteScale.A, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Asharp, map)] = MidiSheetMusic.Accid.Flat;
                    map[System.Array.index(MidiSheetMusic.NoteScale.B, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.C, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Csharp, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.D, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Dsharp, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.E, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.F, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Fsharp, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.G, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Gsharp, map)] = MidiSheetMusic.Accid.None;

                    map = MidiSheetMusic.KeySignature.sharpkeys[System.Array.index(MidiSheetMusic.KeySignature.B, MidiSheetMusic.KeySignature.sharpkeys)];
                    map[System.Array.index(MidiSheetMusic.NoteScale.A, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Asharp, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.B, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.C, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Csharp, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.D, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Dsharp, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.E, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.F, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Fsharp, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.G, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Gsharp, map)] = MidiSheetMusic.Accid.None;

                    /* Flat keys */
                    map = MidiSheetMusic.KeySignature.flatkeys[System.Array.index(MidiSheetMusic.KeySignature.C, MidiSheetMusic.KeySignature.flatkeys)];
                    map[System.Array.index(MidiSheetMusic.NoteScale.A, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Asharp, map)] = MidiSheetMusic.Accid.Flat;
                    map[System.Array.index(MidiSheetMusic.NoteScale.B, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.C, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Csharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.D, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Dsharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.E, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.F, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Fsharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.G, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Gsharp, map)] = MidiSheetMusic.Accid.Sharp;

                    map = MidiSheetMusic.KeySignature.flatkeys[System.Array.index(MidiSheetMusic.KeySignature.F, MidiSheetMusic.KeySignature.flatkeys)];
                    map[System.Array.index(MidiSheetMusic.NoteScale.A, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Bflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.B, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.C, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Csharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.D, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Eflat, map)] = MidiSheetMusic.Accid.Flat;
                    map[System.Array.index(MidiSheetMusic.NoteScale.E, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.F, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Fsharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.G, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Aflat, map)] = MidiSheetMusic.Accid.Flat;

                    map = MidiSheetMusic.KeySignature.flatkeys[System.Array.index(MidiSheetMusic.KeySignature.Bflat, MidiSheetMusic.KeySignature.flatkeys)];
                    map[System.Array.index(MidiSheetMusic.NoteScale.A, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Bflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.B, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.C, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Csharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.D, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Eflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.E, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.F, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Fsharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.G, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Aflat, map)] = MidiSheetMusic.Accid.Flat;

                    map = MidiSheetMusic.KeySignature.flatkeys[System.Array.index(MidiSheetMusic.KeySignature.Eflat, MidiSheetMusic.KeySignature.flatkeys)];
                    map[System.Array.index(MidiSheetMusic.NoteScale.A, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Bflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.B, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.C, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Dflat, map)] = MidiSheetMusic.Accid.Flat;
                    map[System.Array.index(MidiSheetMusic.NoteScale.D, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Eflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.E, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.F, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Fsharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.G, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Aflat, map)] = MidiSheetMusic.Accid.None;

                    map = MidiSheetMusic.KeySignature.flatkeys[System.Array.index(MidiSheetMusic.KeySignature.Aflat, MidiSheetMusic.KeySignature.flatkeys)];
                    map[System.Array.index(MidiSheetMusic.NoteScale.A, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Bflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.B, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.C, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Dflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.D, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Eflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.E, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.F, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Fsharp, map)] = MidiSheetMusic.Accid.Sharp;
                    map[System.Array.index(MidiSheetMusic.NoteScale.G, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Aflat, map)] = MidiSheetMusic.Accid.None;

                    map = MidiSheetMusic.KeySignature.flatkeys[System.Array.index(MidiSheetMusic.KeySignature.Dflat, MidiSheetMusic.KeySignature.flatkeys)];
                    map[System.Array.index(MidiSheetMusic.NoteScale.A, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Bflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.B, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.C, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Dflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.D, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Eflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.E, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.F, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Gflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.G, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Aflat, map)] = MidiSheetMusic.Accid.None;

                    map = MidiSheetMusic.KeySignature.flatkeys[System.Array.index(MidiSheetMusic.KeySignature.Gflat, MidiSheetMusic.KeySignature.flatkeys)];
                    map[System.Array.index(MidiSheetMusic.NoteScale.A, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Bflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.B, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.C, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Dflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.D, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Eflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.E, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.F, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Gflat, map)] = MidiSheetMusic.Accid.None;
                    map[System.Array.index(MidiSheetMusic.NoteScale.G, map)] = MidiSheetMusic.Accid.Natural;
                    map[System.Array.index(MidiSheetMusic.NoteScale.Aflat, map)] = MidiSheetMusic.Accid.None;


                },
                Guess: function (notes) {
                    var $t, $t1;
                    MidiSheetMusic.KeySignature.CreateAccidentalMaps();

                    /* Get the frequency count of each note in the 12-note scale */
                    var notecount = System.Array.init(12, 0, System.Int32);
                    for (var i = 0; i < notes.Count; i = (i + 1) | 0) {
                        var notenumber = notes.getItem(i);
                        var notescale = (((notenumber + 3) | 0)) % 12;
                        notecount[System.Array.index(notescale, notecount)] = (notecount[System.Array.index(notescale, notecount)] + 1) | 0;
                    }

                    /* For each key signature, count the total number of accidentals
                      needed to display all the notes.  Choose the key signature
                      with the fewest accidentals.
                    */
                    var bestkey = 0;
                    var is_best_sharp = true;
                    var smallest_accid_count = notes.Count;
                    var key;

                    for (key = 0; key < 6; key = (key + 1) | 0) {
                        var accid_count = 0;
                        for (var n = 0; n < 12; n = (n + 1) | 0) {
                            if (($t = MidiSheetMusic.KeySignature.sharpkeys[System.Array.index(key, MidiSheetMusic.KeySignature.sharpkeys)])[System.Array.index(n, $t)] !== MidiSheetMusic.Accid.None) {
                                accid_count = (accid_count + notecount[System.Array.index(n, notecount)]) | 0;
                            }
                        }
                        if (accid_count < smallest_accid_count) {
                            smallest_accid_count = accid_count;
                            bestkey = key;
                            is_best_sharp = true;
                        }
                    }

                    for (key = 0; key < 7; key = (key + 1) | 0) {
                        var accid_count1 = 0;
                        for (var n1 = 0; n1 < 12; n1 = (n1 + 1) | 0) {
                            if (($t1 = MidiSheetMusic.KeySignature.flatkeys[System.Array.index(key, MidiSheetMusic.KeySignature.flatkeys)])[System.Array.index(n1, $t1)] !== MidiSheetMusic.Accid.None) {
                                accid_count1 = (accid_count1 + notecount[System.Array.index(n1, notecount)]) | 0;
                            }
                        }
                        if (accid_count1 < smallest_accid_count) {
                            smallest_accid_count = accid_count1;
                            bestkey = key;
                            is_best_sharp = false;
                        }
                    }
                    if (is_best_sharp) {
                        return new MidiSheetMusic.KeySignature.$ctor1(bestkey, 0);
                    } else {
                        return new MidiSheetMusic.KeySignature.$ctor1(0, bestkey);
                    }
                },
                KeyToString: function (notescale) {
                    switch (notescale) {
                        case MidiSheetMusic.NoteScale.A: 
                            return "A major, F# minor";
                        case MidiSheetMusic.NoteScale.Bflat: 
                            return "B-flat major, G minor";
                        case MidiSheetMusic.NoteScale.B: 
                            return "B major, A-flat minor";
                        case MidiSheetMusic.NoteScale.C: 
                            return "C major, A minor";
                        case MidiSheetMusic.NoteScale.Dflat: 
                            return "D-flat major, B-flat minor";
                        case MidiSheetMusic.NoteScale.D: 
                            return "D major, B minor";
                        case MidiSheetMusic.NoteScale.Eflat: 
                            return "E-flat major, C minor";
                        case MidiSheetMusic.NoteScale.E: 
                            return "E major, C# minor";
                        case MidiSheetMusic.NoteScale.F: 
                            return "F major, D minor";
                        case MidiSheetMusic.NoteScale.Gflat: 
                            return "G-flat major, E-flat minor";
                        case MidiSheetMusic.NoteScale.G: 
                            return "G major, E minor";
                        case MidiSheetMusic.NoteScale.Aflat: 
                            return "A-flat major, F minor";
                        default: 
                            return "";
                    }
                }
            }
        },
        fields: {
            num_flats: 0,
            num_sharps: 0,
            treble: null,
            bass: null,
            keymap: null,
            prevmeasure: 0
        },
        ctors: {
            $ctor1: function (num_sharps, num_flats) {
                this.$initialize();
                if (!(num_sharps === 0 || num_flats === 0)) {
                    throw new System.ArgumentException("Bad KeySigature args");
                }
                this.num_sharps = num_sharps;
                this.num_flats = num_flats;

                MidiSheetMusic.KeySignature.CreateAccidentalMaps();
                this.keymap = System.Array.init(160, 0, MidiSheetMusic.Accid);
                this.ResetKeyMap();
                this.CreateSymbols();
            },
            ctor: function (notescale) {
                this.$initialize();
                this.num_sharps = (this.num_flats = 0);
                switch (notescale) {
                    case MidiSheetMusic.NoteScale.A: 
                        this.num_sharps = 3;
                        break;
                    case MidiSheetMusic.NoteScale.Bflat: 
                        this.num_flats = 2;
                        break;
                    case MidiSheetMusic.NoteScale.B: 
                        this.num_sharps = 5;
                        break;
                    case MidiSheetMusic.NoteScale.C: 
                        break;
                    case MidiSheetMusic.NoteScale.Dflat: 
                        this.num_flats = 5;
                        break;
                    case MidiSheetMusic.NoteScale.D: 
                        this.num_sharps = 2;
                        break;
                    case MidiSheetMusic.NoteScale.Eflat: 
                        this.num_flats = 3;
                        break;
                    case MidiSheetMusic.NoteScale.E: 
                        this.num_sharps = 4;
                        break;
                    case MidiSheetMusic.NoteScale.F: 
                        this.num_flats = 1;
                        break;
                    case MidiSheetMusic.NoteScale.Gflat: 
                        this.num_flats = 6;
                        break;
                    case MidiSheetMusic.NoteScale.G: 
                        this.num_sharps = 1;
                        break;
                    case MidiSheetMusic.NoteScale.Aflat: 
                        this.num_flats = 4;
                        break;
                    default: 
                        break;
                }

                MidiSheetMusic.KeySignature.CreateAccidentalMaps();
                this.keymap = System.Array.init(160, 0, MidiSheetMusic.Accid);
                this.ResetKeyMap();
                this.CreateSymbols();
            }
        },
        methods: {
            ResetKeyMap: function () {
                var key;
                if (this.num_flats > 0) {
                    key = MidiSheetMusic.KeySignature.flatkeys[System.Array.index(this.num_flats, MidiSheetMusic.KeySignature.flatkeys)];
                } else {
                    key = MidiSheetMusic.KeySignature.sharpkeys[System.Array.index(this.num_sharps, MidiSheetMusic.KeySignature.sharpkeys)];
                }

                for (var notenumber = 0; notenumber < this.keymap.length; notenumber = (notenumber + 1) | 0) {
                    this.keymap[System.Array.index(notenumber, this.keymap)] = key[System.Array.index(MidiSheetMusic.NoteScale.FromNumber(notenumber), key)];
                }
            },
            CreateSymbols: function () {
                var count = Math.max(this.num_sharps, this.num_flats);
                this.treble = System.Array.init(count, null, MidiSheetMusic.AccidSymbol);
                this.bass = System.Array.init(count, null, MidiSheetMusic.AccidSymbol);

                if (count === 0) {
                    return;
                }

                var treblenotes = null;
                var bassnotes = null;

                if (this.num_sharps > 0) {
                    treblenotes = System.Array.init([new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.F, 5), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.C, 5), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.G, 5), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.D, 5), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.A, 6), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.E, 5)], MidiSheetMusic.WhiteNote);
                    bassnotes = System.Array.init([new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.F, 3), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.C, 3), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.G, 3), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.D, 3), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.A, 4), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.E, 3)], MidiSheetMusic.WhiteNote);
                } else if (this.num_flats > 0) {
                    treblenotes = System.Array.init([new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.B, 5), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.E, 5), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.A, 5), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.D, 5), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.G, 4), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.C, 5)], MidiSheetMusic.WhiteNote);
                    bassnotes = System.Array.init([new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.B, 3), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.E, 3), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.A, 3), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.D, 3), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.G, 2), new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.C, 3)], MidiSheetMusic.WhiteNote);
                }

                var a = MidiSheetMusic.Accid.None;
                if (this.num_sharps > 0) {
                    a = MidiSheetMusic.Accid.Sharp;
                } else {
                    a = MidiSheetMusic.Accid.Flat;
                }

                for (var i = 0; i < count; i = (i + 1) | 0) {
                    this.treble[System.Array.index(i, this.treble)] = new MidiSheetMusic.AccidSymbol(a, treblenotes[System.Array.index(i, treblenotes)], MidiSheetMusic.Clef.Treble);
                    this.bass[System.Array.index(i, this.bass)] = new MidiSheetMusic.AccidSymbol(a, bassnotes[System.Array.index(i, bassnotes)], MidiSheetMusic.Clef.Bass);
                }
            },
            GetSymbols: function (clef) {
                if (clef === MidiSheetMusic.Clef.Treble) {
                    return this.treble;
                } else {
                    return this.bass;
                }
            },
            GetAccidental: function (notenumber, measure) {
                if (measure !== this.prevmeasure) {
                    this.ResetKeyMap();
                    this.prevmeasure = measure;
                }

                var result = this.keymap[System.Array.index(notenumber, this.keymap)];
                if (result === MidiSheetMusic.Accid.Sharp) {
                    this.keymap[System.Array.index(notenumber, this.keymap)] = MidiSheetMusic.Accid.None;
                    this.keymap[System.Array.index(((notenumber - 1) | 0), this.keymap)] = MidiSheetMusic.Accid.Natural;
                } else if (result === MidiSheetMusic.Accid.Flat) {
                    this.keymap[System.Array.index(notenumber, this.keymap)] = MidiSheetMusic.Accid.None;
                    this.keymap[System.Array.index(((notenumber + 1) | 0), this.keymap)] = MidiSheetMusic.Accid.Natural;
                } else if (result === MidiSheetMusic.Accid.Natural) {
                    this.keymap[System.Array.index(notenumber, this.keymap)] = MidiSheetMusic.Accid.None;
                    var nextkey = MidiSheetMusic.NoteScale.FromNumber(((notenumber + 1) | 0));
                    var prevkey = MidiSheetMusic.NoteScale.FromNumber(((notenumber - 1) | 0));

                    /* If we insert a natural, then either:
                      - the next key must go back to sharp,
                      - the previous key must go back to flat.
                    */
                    if (this.keymap[System.Array.index(((notenumber - 1) | 0), this.keymap)] === MidiSheetMusic.Accid.None && this.keymap[System.Array.index(((notenumber + 1) | 0), this.keymap)] === MidiSheetMusic.Accid.None && MidiSheetMusic.NoteScale.IsBlackKey(nextkey) && MidiSheetMusic.NoteScale.IsBlackKey(prevkey)) {

                        if (this.num_flats === 0) {
                            this.keymap[System.Array.index(((notenumber + 1) | 0), this.keymap)] = MidiSheetMusic.Accid.Sharp;
                        } else {
                            this.keymap[System.Array.index(((notenumber - 1) | 0), this.keymap)] = MidiSheetMusic.Accid.Flat;
                        }
                    } else if (this.keymap[System.Array.index(((notenumber - 1) | 0), this.keymap)] === MidiSheetMusic.Accid.None && MidiSheetMusic.NoteScale.IsBlackKey(prevkey)) {
                        this.keymap[System.Array.index(((notenumber - 1) | 0), this.keymap)] = MidiSheetMusic.Accid.Flat;
                    } else if (this.keymap[System.Array.index(((notenumber + 1) | 0), this.keymap)] === MidiSheetMusic.Accid.None && MidiSheetMusic.NoteScale.IsBlackKey(nextkey)) {
                        this.keymap[System.Array.index(((notenumber + 1) | 0), this.keymap)] = MidiSheetMusic.Accid.Sharp;
                    } else {
                        /* Shouldn't get here */
                    }
                }
                return result;
            },
            GetWhiteNote: function (notenumber) {
                var notescale = MidiSheetMusic.NoteScale.FromNumber(notenumber);
                var octave = (((Bridge.Int.div((((notenumber + 3) | 0)), 12)) | 0) - 1) | 0;
                var letter = 0;

                var whole_sharps = System.Array.init([
                    MidiSheetMusic.WhiteNote.A, 
                    MidiSheetMusic.WhiteNote.A, 
                    MidiSheetMusic.WhiteNote.B, 
                    MidiSheetMusic.WhiteNote.C, 
                    MidiSheetMusic.WhiteNote.C, 
                    MidiSheetMusic.WhiteNote.D, 
                    MidiSheetMusic.WhiteNote.D, 
                    MidiSheetMusic.WhiteNote.E, 
                    MidiSheetMusic.WhiteNote.F, 
                    MidiSheetMusic.WhiteNote.F, 
                    MidiSheetMusic.WhiteNote.G, 
                    MidiSheetMusic.WhiteNote.G
                ], System.Int32);

                var whole_flats = System.Array.init([
                    MidiSheetMusic.WhiteNote.A, 
                    MidiSheetMusic.WhiteNote.B, 
                    MidiSheetMusic.WhiteNote.B, 
                    MidiSheetMusic.WhiteNote.C, 
                    MidiSheetMusic.WhiteNote.D, 
                    MidiSheetMusic.WhiteNote.D, 
                    MidiSheetMusic.WhiteNote.E, 
                    MidiSheetMusic.WhiteNote.E, 
                    MidiSheetMusic.WhiteNote.F, 
                    MidiSheetMusic.WhiteNote.G, 
                    MidiSheetMusic.WhiteNote.G, 
                    MidiSheetMusic.WhiteNote.A
                ], System.Int32);

                var accid = this.keymap[System.Array.index(notenumber, this.keymap)];
                if (accid === MidiSheetMusic.Accid.Flat) {
                    letter = whole_flats[System.Array.index(notescale, whole_flats)];
                } else if (accid === MidiSheetMusic.Accid.Sharp) {
                    letter = whole_sharps[System.Array.index(notescale, whole_sharps)];
                } else if (accid === MidiSheetMusic.Accid.Natural) {
                    letter = whole_sharps[System.Array.index(notescale, whole_sharps)];
                } else if (accid === MidiSheetMusic.Accid.None) {
                    letter = whole_sharps[System.Array.index(notescale, whole_sharps)];

                    /* If the note number is a sharp/flat, and there's no accidental,
                      determine the white note by seeing whether the previous or next note
                      is a natural.
                    */
                    if (MidiSheetMusic.NoteScale.IsBlackKey(notescale)) {
                        if (this.keymap[System.Array.index(((notenumber - 1) | 0), this.keymap)] === MidiSheetMusic.Accid.Natural && this.keymap[System.Array.index(((notenumber + 1) | 0), this.keymap)] === MidiSheetMusic.Accid.Natural) {

                            if (this.num_flats > 0) {
                                letter = whole_flats[System.Array.index(notescale, whole_flats)];
                            } else {
                                letter = whole_sharps[System.Array.index(notescale, whole_sharps)];
                            }
                        } else if (this.keymap[System.Array.index(((notenumber - 1) | 0), this.keymap)] === MidiSheetMusic.Accid.Natural) {
                            letter = whole_sharps[System.Array.index(notescale, whole_sharps)];
                        } else if (this.keymap[System.Array.index(((notenumber + 1) | 0), this.keymap)] === MidiSheetMusic.Accid.Natural) {
                            letter = whole_flats[System.Array.index(notescale, whole_flats)];
                        }
                    }
                }

                /* The above algorithm doesn't quite work for G-flat major.
                  Handle it here.
                */
                if (this.num_flats === MidiSheetMusic.KeySignature.Gflat && notescale === MidiSheetMusic.NoteScale.B) {
                    letter = MidiSheetMusic.WhiteNote.C;
                }
                if (this.num_flats === MidiSheetMusic.KeySignature.Gflat && notescale === MidiSheetMusic.NoteScale.Bflat) {
                    letter = MidiSheetMusic.WhiteNote.B;
                }

                if (this.num_flats > 0 && notescale === MidiSheetMusic.NoteScale.Aflat) {
                    octave = (octave + 1) | 0;
                }

                return new MidiSheetMusic.WhiteNote(letter, octave);
            },
            Equals: function (k) {
                if (k.num_sharps === this.num_sharps && k.num_flats === this.num_flats) {
                    return true;
                } else {
                    return false;
                }
            },
            Notescale: function () {
                var flatmajor = System.Array.init([
                    MidiSheetMusic.NoteScale.C, 
                    MidiSheetMusic.NoteScale.F, 
                    MidiSheetMusic.NoteScale.Bflat, 
                    MidiSheetMusic.NoteScale.Eflat, 
                    MidiSheetMusic.NoteScale.Aflat, 
                    MidiSheetMusic.NoteScale.Dflat, 
                    MidiSheetMusic.NoteScale.Gflat, 
                    MidiSheetMusic.NoteScale.B
                ], System.Int32);

                var sharpmajor = System.Array.init([
                    MidiSheetMusic.NoteScale.C, 
                    MidiSheetMusic.NoteScale.G, 
                    MidiSheetMusic.NoteScale.D, 
                    MidiSheetMusic.NoteScale.A, 
                    MidiSheetMusic.NoteScale.E, 
                    MidiSheetMusic.NoteScale.B, 
                    MidiSheetMusic.NoteScale.Fsharp, 
                    MidiSheetMusic.NoteScale.Csharp, 
                    MidiSheetMusic.NoteScale.Gsharp, 
                    MidiSheetMusic.NoteScale.Dsharp
                ], System.Int32);
                if (this.num_flats > 0) {
                    return flatmajor[System.Array.index(this.num_flats, flatmajor)];
                } else {
                    return sharpmajor[System.Array.index(this.num_sharps, sharpmajor)];
                }
            },
            toString: function () {
                return MidiSheetMusic.KeySignature.KeyToString(this.Notescale());
            }
        }
    });

    Bridge.define("MidiSheetMusic.LineCap", {
        $kind: "enum",
        statics: {
            fields: {
                Flat: 0
            }
        }
    });

    Bridge.define("MidiSheetMusic.LyricSymbol", {
        fields: {
            starttime: 0,
            text: null,
            x: 0
        },
        props: {
            StartTime: {
                get: function () {
                    return this.starttime;
                },
                set: function (value) {
                    this.starttime = value;
                }
            },
            Text: {
                get: function () {
                    return this.text;
                },
                set: function (value) {
                    this.text = value;
                }
            },
            X: {
                get: function () {
                    return this.x;
                },
                set: function (value) {
                    this.x = value;
                }
            },
            MinWidth: {
                get: function () {
                    return this.minWidth();
                }
            }
        },
        ctors: {
            ctor: function (starttime, text) {
                this.$initialize();
                this.starttime = starttime;
                this.text = text;
            }
        },
        methods: {
            minWidth: function () {
                var widthPerChar = MidiSheetMusic.SheetMusic.LetterFont.GetHeight() * 2.0 / 3.0;
                var width = this.text.length * widthPerChar;
                if (System.String.indexOf(this.text, "i") >= 0) {
                    width -= widthPerChar / 2.0;
                }
                if (System.String.indexOf(this.text, "j") >= 0) {
                    width -= widthPerChar / 2.0;
                }
                if (System.String.indexOf(this.text, "l") >= 0) {
                    width -= widthPerChar / 2.0;
                }
                return Bridge.Int.clip32(width);
            },
            toString: function () {
                return System.String.format("Lyric start={0} x={1} text={2}", Bridge.box(this.starttime, System.Int32), Bridge.box(this.x, System.Int32), this.text);
            }
        }
    });

    Bridge.define("MidiSheetMusic.MidiEvent", {
        inherits: function () { return [System.Collections.Generic.IComparer$1(MidiSheetMusic.MidiEvent)]; },
        fields: {
            DeltaTime: 0,
            StartTime: 0,
            HasEventflag: false,
            EventFlag: 0,
            Channel: 0,
            Notenumber: 0,
            Velocity: 0,
            Instrument: 0,
            KeyPressure: 0,
            ChanPressure: 0,
            ControlNum: 0,
            ControlValue: 0,
            PitchBend: 0,
            Numerator: 0,
            Denominator: 0,
            Tempo: 0,
            Metaevent: 0,
            Metalength: 0,
            Value: null
        },
        alias: ["compare", ["System$Collections$Generic$IComparer$1$MidiSheetMusic$MidiEvent$compare", "System$Collections$Generic$IComparer$1$compare"]],
        ctors: {
            ctor: function () {
                this.$initialize();
            }
        },
        methods: {
            Clone: function () {
                var mevent = new MidiSheetMusic.MidiEvent();
                mevent.DeltaTime = this.DeltaTime;
                mevent.StartTime = this.StartTime;
                mevent.HasEventflag = this.HasEventflag;
                mevent.EventFlag = this.EventFlag;
                mevent.Channel = this.Channel;
                mevent.Notenumber = this.Notenumber;
                mevent.Velocity = this.Velocity;
                mevent.Instrument = this.Instrument;
                mevent.KeyPressure = this.KeyPressure;
                mevent.ChanPressure = this.ChanPressure;
                mevent.ControlNum = this.ControlNum;
                mevent.ControlValue = this.ControlValue;
                mevent.PitchBend = this.PitchBend;
                mevent.Numerator = this.Numerator;
                mevent.Denominator = this.Denominator;
                mevent.Tempo = this.Tempo;
                mevent.Metaevent = this.Metaevent;
                mevent.Metalength = this.Metalength;
                mevent.Value = this.Value;
                return mevent;
            },
            compare: function (x, y) {
                if (x.StartTime === y.StartTime) {
                    if (x.EventFlag === y.EventFlag) {
                        return ((x.Notenumber - y.Notenumber) | 0);
                    } else {
                        return ((x.EventFlag - y.EventFlag) | 0);
                    }
                } else {
                    return ((x.StartTime - y.StartTime) | 0);
                }
            }
        }
    });

    Bridge.define("MidiSheetMusic.MidiFile", {
        statics: {
            fields: {
                EventNoteOff: 0,
                EventNoteOn: 0,
                EventKeyPressure: 0,
                EventControlChange: 0,
                EventProgramChange: 0,
                EventChannelPressure: 0,
                EventPitchBend: 0,
                SysexEvent1: 0,
                SysexEvent2: 0,
                MetaEvent: 0,
                MetaEventSequence: 0,
                MetaEventText: 0,
                MetaEventCopyright: 0,
                MetaEventSequenceName: 0,
                MetaEventInstrument: 0,
                MetaEventLyric: 0,
                MetaEventMarker: 0,
                MetaEventEndOfTrack: 0,
                MetaEventTempo: 0,
                MetaEventSMPTEOffset: 0,
                MetaEventTimeSignature: 0,
                MetaEventKeySignature: 0,
                Instruments: null
            },
            ctors: {
                init: function () {
                    this.EventNoteOff = 128;
                    this.EventNoteOn = 144;
                    this.EventKeyPressure = 160;
                    this.EventControlChange = 176;
                    this.EventProgramChange = 192;
                    this.EventChannelPressure = 208;
                    this.EventPitchBend = 224;
                    this.SysexEvent1 = 240;
                    this.SysexEvent2 = 247;
                    this.MetaEvent = 255;
                    this.MetaEventSequence = 0;
                    this.MetaEventText = 1;
                    this.MetaEventCopyright = 2;
                    this.MetaEventSequenceName = 3;
                    this.MetaEventInstrument = 4;
                    this.MetaEventLyric = 5;
                    this.MetaEventMarker = 6;
                    this.MetaEventEndOfTrack = 47;
                    this.MetaEventTempo = 81;
                    this.MetaEventSMPTEOffset = 84;
                    this.MetaEventTimeSignature = 88;
                    this.MetaEventKeySignature = 89;
                    this.Instruments = System.Array.init([
                        "Acoustic Grand Piano", 
                        "Bright Acoustic Piano", 
                        "Electric Grand Piano", 
                        "Honky-tonk Piano", 
                        "Electric Piano 1", 
                        "Electric Piano 2", 
                        "Harpsichord", 
                        "Clavi", 
                        "Celesta", 
                        "Glockenspiel", 
                        "Music Box", 
                        "Vibraphone", 
                        "Marimba", 
                        "Xylophone", 
                        "Tubular Bells", 
                        "Dulcimer", 
                        "Drawbar Organ", 
                        "Percussive Organ", 
                        "Rock Organ", 
                        "Church Organ", 
                        "Reed Organ", 
                        "Accordion", 
                        "Harmonica", 
                        "Tango Accordion", 
                        "Acoustic Guitar (nylon)", 
                        "Acoustic Guitar (steel)", 
                        "Electric Guitar (jazz)", 
                        "Electric Guitar (clean)", 
                        "Electric Guitar (muted)", 
                        "Overdriven Guitar", 
                        "Distortion Guitar", 
                        "Guitar harmonics", 
                        "Acoustic Bass", 
                        "Electric Bass (finger)", 
                        "Electric Bass (pick)", 
                        "Fretless Bass", 
                        "Slap Bass 1", 
                        "Slap Bass 2", 
                        "Synth Bass 1", 
                        "Synth Bass 2", 
                        "Violin", 
                        "Viola", 
                        "Cello", 
                        "Contrabass", 
                        "Tremolo Strings", 
                        "Pizzicato Strings", 
                        "Orchestral Harp", 
                        "Timpani", 
                        "String Ensemble 1", 
                        "String Ensemble 2", 
                        "SynthStrings 1", 
                        "SynthStrings 2", 
                        "Choir Aahs", 
                        "Voice Oohs", 
                        "Synth Voice", 
                        "Orchestra Hit", 
                        "Trumpet", 
                        "Trombone", 
                        "Tuba", 
                        "Muted Trumpet", 
                        "French Horn", 
                        "Brass Section", 
                        "SynthBrass 1", 
                        "SynthBrass 2", 
                        "Soprano Sax", 
                        "Alto Sax", 
                        "Tenor Sax", 
                        "Baritone Sax", 
                        "Oboe", 
                        "English Horn", 
                        "Bassoon", 
                        "Clarinet", 
                        "Piccolo", 
                        "Flute", 
                        "Recorder", 
                        "Pan Flute", 
                        "Blown Bottle", 
                        "Shakuhachi", 
                        "Whistle", 
                        "Ocarina", 
                        "Lead 1 (square)", 
                        "Lead 2 (sawtooth)", 
                        "Lead 3 (calliope)", 
                        "Lead 4 (chiff)", 
                        "Lead 5 (charang)", 
                        "Lead 6 (voice)", 
                        "Lead 7 (fifths)", 
                        "Lead 8 (bass + lead)", 
                        "Pad 1 (new age)", 
                        "Pad 2 (warm)", 
                        "Pad 3 (polysynth)", 
                        "Pad 4 (choir)", 
                        "Pad 5 (bowed)", 
                        "Pad 6 (metallic)", 
                        "Pad 7 (halo)", 
                        "Pad 8 (sweep)", 
                        "FX 1 (rain)", 
                        "FX 2 (soundtrack)", 
                        "FX 3 (crystal)", 
                        "FX 4 (atmosphere)", 
                        "FX 5 (brightness)", 
                        "FX 6 (goblins)", 
                        "FX 7 (echoes)", 
                        "FX 8 (sci-fi)", 
                        "Sitar", 
                        "Banjo", 
                        "Shamisen", 
                        "Koto", 
                        "Kalimba", 
                        "Bag pipe", 
                        "Fiddle", 
                        "Shanai", 
                        "Tinkle Bell", 
                        "Agogo", 
                        "Steel Drums", 
                        "Woodblock", 
                        "Taiko Drum", 
                        "Melodic Tom", 
                        "Synth Drum", 
                        "Reverse Cymbal", 
                        "Guitar Fret Noise", 
                        "Breath Noise", 
                        "Seashore", 
                        "Bird Tweet", 
                        "Telephone Ring", 
                        "Helicopter", 
                        "Applause", 
                        "Gunshot", 
                        "Percussion"
                    ], System.String);
                }
            },
            methods: {
                HasMultipleChannels: function (track) {
                    var $t;
                    var channel = track.Notes.getItem(0).Channel;
                    $t = Bridge.getEnumerator(track.Notes);
                    try {
                        while ($t.moveNext()) {
                            var note = $t.Current;
                            if (note.Channel !== channel) {
                                return true;
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }return false;
                },
                VarlenToBytes: function (num, buf, offset) {
                    var b1 = ((num >> 21) & 127) & 255;
                    var b2 = ((num >> 14) & 127) & 255;
                    var b3 = ((num >> 7) & 127) & 255;
                    var b4 = (num & 127) & 255;

                    if (b1 > 0) {
                        buf[System.Array.index(offset, buf)] = (b1 | 128) & 255;
                        buf[System.Array.index(((offset + 1) | 0), buf)] = (b2 | 128) & 255;
                        buf[System.Array.index(((offset + 2) | 0), buf)] = (b3 | 128) & 255;
                        buf[System.Array.index(((offset + 3) | 0), buf)] = b4;
                        return 4;
                    } else if (b2 > 0) {
                        buf[System.Array.index(offset, buf)] = (b2 | 128) & 255;
                        buf[System.Array.index(((offset + 1) | 0), buf)] = (b3 | 128) & 255;
                        buf[System.Array.index(((offset + 2) | 0), buf)] = b4;
                        return 3;
                    } else if (b3 > 0) {
                        buf[System.Array.index(offset, buf)] = (b3 | 128) & 255;
                        buf[System.Array.index(((offset + 1) | 0), buf)] = b4;
                        return 2;
                    } else {
                        buf[System.Array.index(offset, buf)] = b4;
                        return 1;
                    }
                },
                IntToBytes: function (value, data, offset) {
                    data[System.Array.index(offset, data)] = ((value >> 24) & 255) & 255;
                    data[System.Array.index(((offset + 1) | 0), data)] = ((value >> 16) & 255) & 255;
                    data[System.Array.index(((offset + 2) | 0), data)] = ((value >> 8) & 255) & 255;
                    data[System.Array.index(((offset + 3) | 0), data)] = (value & 255) & 255;
                },
                GetTrackLength: function (events) {
                    var $t;
                    var len = 0;
                    var buf = System.Array.init(1024, 0, System.Byte);
                    $t = Bridge.getEnumerator(events);
                    try {
                        while ($t.moveNext()) {
                            var mevent = $t.Current;
                            len = (len + (MidiSheetMusic.MidiFile.VarlenToBytes(mevent.DeltaTime, buf, 0))) | 0;
                            len = (len + 1) | 0; /* for eventflag */
                            switch (mevent.EventFlag) {
                                case MidiSheetMusic.MidiFile.EventNoteOn: 
                                    len = (len + 2) | 0;
                                    break;
                                case MidiSheetMusic.MidiFile.EventNoteOff: 
                                    len = (len + 2) | 0;
                                    break;
                                case MidiSheetMusic.MidiFile.EventKeyPressure: 
                                    len = (len + 2) | 0;
                                    break;
                                case MidiSheetMusic.MidiFile.EventControlChange: 
                                    len = (len + 2) | 0;
                                    break;
                                case MidiSheetMusic.MidiFile.EventProgramChange: 
                                    len = (len + 1) | 0;
                                    break;
                                case MidiSheetMusic.MidiFile.EventChannelPressure: 
                                    len = (len + 1) | 0;
                                    break;
                                case MidiSheetMusic.MidiFile.EventPitchBend: 
                                    len = (len + 2) | 0;
                                    break;
                                case MidiSheetMusic.MidiFile.SysexEvent1: 
                                case MidiSheetMusic.MidiFile.SysexEvent2: 
                                    len = (len + (MidiSheetMusic.MidiFile.VarlenToBytes(mevent.Metalength, buf, 0))) | 0;
                                    len = (len + mevent.Metalength) | 0;
                                    break;
                                case MidiSheetMusic.MidiFile.MetaEvent: 
                                    len = (len + 1) | 0;
                                    len = (len + (MidiSheetMusic.MidiFile.VarlenToBytes(mevent.Metalength, buf, 0))) | 0;
                                    len = (len + mevent.Metalength) | 0;
                                    break;
                                default: 
                                    break;
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }return len;
                },
                WriteEvents: function (file, events, trackmode, quarter) {
                    var $t, $t1;
                    try {
                        var buf = System.Array.init(65536, 0, System.Byte);

                        /* Write the MThd, len = 6, track mode, number tracks, quarter note */
                        file.Write(System.Text.Encoding.ASCII.GetBytes$2("MThd"), 0, 4);
                        MidiSheetMusic.MidiFile.IntToBytes(6, buf, 0);
                        file.Write(buf, 0, 4);
                        buf[System.Array.index(0, buf)] = (trackmode >> 8) & 255;
                        buf[System.Array.index(1, buf)] = (trackmode & 255) & 255;
                        file.Write(buf, 0, 2);
                        buf[System.Array.index(0, buf)] = 0;
                        buf[System.Array.index(1, buf)] = (events.length) & 255;
                        file.Write(buf, 0, 2);
                        buf[System.Array.index(0, buf)] = (quarter >> 8) & 255;
                        buf[System.Array.index(1, buf)] = (quarter & 255) & 255;
                        file.Write(buf, 0, 2);

                        $t = Bridge.getEnumerator(events);
                        try {
                            while ($t.moveNext()) {
                                var list = $t.Current;
                                /* Write the MTrk header and track length */
                                file.Write(System.Text.Encoding.ASCII.GetBytes$2("MTrk"), 0, 4);
                                var len = MidiSheetMusic.MidiFile.GetTrackLength(list);
                                MidiSheetMusic.MidiFile.IntToBytes(len, buf, 0);
                                file.Write(buf, 0, 4);

                                $t1 = Bridge.getEnumerator(list);
                                try {
                                    while ($t1.moveNext()) {
                                        var mevent = $t1.Current;
                                        var varlen = MidiSheetMusic.MidiFile.VarlenToBytes(mevent.DeltaTime, buf, 0);
                                        file.Write(buf, 0, varlen);

                                        if (mevent.EventFlag === MidiSheetMusic.MidiFile.SysexEvent1 || mevent.EventFlag === MidiSheetMusic.MidiFile.SysexEvent2 || mevent.EventFlag === MidiSheetMusic.MidiFile.MetaEvent) {
                                            buf[System.Array.index(0, buf)] = mevent.EventFlag;
                                        } else {
                                            buf[System.Array.index(0, buf)] = (((mevent.EventFlag + mevent.Channel) | 0)) & 255;
                                        }
                                        file.Write(buf, 0, 1);

                                        if (mevent.EventFlag === MidiSheetMusic.MidiFile.EventNoteOn) {
                                            buf[System.Array.index(0, buf)] = mevent.Notenumber;
                                            buf[System.Array.index(1, buf)] = mevent.Velocity;
                                            file.Write(buf, 0, 2);
                                        } else if (mevent.EventFlag === MidiSheetMusic.MidiFile.EventNoteOff) {
                                            buf[System.Array.index(0, buf)] = mevent.Notenumber;
                                            buf[System.Array.index(1, buf)] = mevent.Velocity;
                                            file.Write(buf, 0, 2);
                                        } else if (mevent.EventFlag === MidiSheetMusic.MidiFile.EventKeyPressure) {
                                            buf[System.Array.index(0, buf)] = mevent.Notenumber;
                                            buf[System.Array.index(1, buf)] = mevent.KeyPressure;
                                            file.Write(buf, 0, 2);
                                        } else if (mevent.EventFlag === MidiSheetMusic.MidiFile.EventControlChange) {
                                            buf[System.Array.index(0, buf)] = mevent.ControlNum;
                                            buf[System.Array.index(1, buf)] = mevent.ControlValue;
                                            file.Write(buf, 0, 2);
                                        } else if (mevent.EventFlag === MidiSheetMusic.MidiFile.EventProgramChange) {
                                            buf[System.Array.index(0, buf)] = mevent.Instrument;
                                            file.Write(buf, 0, 1);
                                        } else if (mevent.EventFlag === MidiSheetMusic.MidiFile.EventChannelPressure) {
                                            buf[System.Array.index(0, buf)] = mevent.ChanPressure;
                                            file.Write(buf, 0, 1);
                                        } else if (mevent.EventFlag === MidiSheetMusic.MidiFile.EventPitchBend) {
                                            buf[System.Array.index(0, buf)] = (mevent.PitchBend >> 8) & 255;
                                            buf[System.Array.index(1, buf)] = (mevent.PitchBend & 255) & 255;
                                            file.Write(buf, 0, 2);
                                        } else if (mevent.EventFlag === MidiSheetMusic.MidiFile.SysexEvent1) {
                                            var offset = MidiSheetMusic.MidiFile.VarlenToBytes(mevent.Metalength, buf, 0);
                                            System.Array.copy(mevent.Value, 0, buf, offset, mevent.Value.length);
                                            file.Write(buf, 0, ((offset + mevent.Value.length) | 0));
                                        } else if (mevent.EventFlag === MidiSheetMusic.MidiFile.SysexEvent2) {
                                            var offset1 = MidiSheetMusic.MidiFile.VarlenToBytes(mevent.Metalength, buf, 0);
                                            System.Array.copy(mevent.Value, 0, buf, offset1, mevent.Value.length);
                                            file.Write(buf, 0, ((offset1 + mevent.Value.length) | 0));
                                        } else if (mevent.EventFlag === MidiSheetMusic.MidiFile.MetaEvent && mevent.Metaevent === MidiSheetMusic.MidiFile.MetaEventTempo) {
                                            buf[System.Array.index(0, buf)] = mevent.Metaevent;
                                            buf[System.Array.index(1, buf)] = 3;
                                            buf[System.Array.index(2, buf)] = ((mevent.Tempo >> 16) & 255) & 255;
                                            buf[System.Array.index(3, buf)] = ((mevent.Tempo >> 8) & 255) & 255;
                                            buf[System.Array.index(4, buf)] = (mevent.Tempo & 255) & 255;
                                            file.Write(buf, 0, 5);
                                        } else if (mevent.EventFlag === MidiSheetMusic.MidiFile.MetaEvent) {
                                            buf[System.Array.index(0, buf)] = mevent.Metaevent;
                                            var offset2 = (MidiSheetMusic.MidiFile.VarlenToBytes(mevent.Metalength, buf, 1) + 1) | 0;
                                            System.Array.copy(mevent.Value, 0, buf, offset2, mevent.Value.length);
                                            file.Write(buf, 0, ((offset2 + mevent.Value.length) | 0));
                                        }
                                    }
                                } finally {
                                    if (Bridge.is($t1, System.IDisposable)) {
                                        $t1.System$IDisposable$dispose();
                                    }
                                }
                            }
                        } finally {
                            if (Bridge.is($t, System.IDisposable)) {
                                $t.System$IDisposable$dispose();
                            }
                        }file.Close();
                        return true;
                    }
                    catch ($e1) {
                        $e1 = System.Exception.create($e1);
                        if (Bridge.is($e1, MidiSheetMusic.IOException)) {
                            return false;
                        } else {
                            throw $e1;
                        }
                    }
                },
                CloneMidiEvents: function (origlist) {
                    var $t;
                    var newlist = System.Array.init(origlist.length, null, System.Collections.Generic.List$1(MidiSheetMusic.MidiEvent));
                    for (var tracknum = 0; tracknum < origlist.length; tracknum = (tracknum + 1) | 0) {
                        var origevents = origlist[System.Array.index(tracknum, origlist)];
                        var newevents = new (System.Collections.Generic.List$1(MidiSheetMusic.MidiEvent)).$ctor2(origevents.Count);
                        newlist[System.Array.index(tracknum, newlist)] = newevents;
                        $t = Bridge.getEnumerator(origevents);
                        try {
                            while ($t.moveNext()) {
                                var mevent = $t.Current;
                                newevents.add(mevent.Clone());
                            }
                        } finally {
                            if (Bridge.is($t, System.IDisposable)) {
                                $t.System$IDisposable$dispose();
                            }
                        }}
                    return newlist;
                },
                CreateTempoEvent: function (tempo) {
                    var mevent = new MidiSheetMusic.MidiEvent();
                    mevent.DeltaTime = 0;
                    mevent.StartTime = 0;
                    mevent.HasEventflag = true;
                    mevent.EventFlag = MidiSheetMusic.MidiFile.MetaEvent;
                    mevent.Metaevent = MidiSheetMusic.MidiFile.MetaEventTempo;
                    mevent.Metalength = 3;
                    mevent.Tempo = tempo;
                    return mevent;
                },
                UpdateControlChange: function (newevents, changeEvent) {
                    var $t;
                    $t = Bridge.getEnumerator(newevents);
                    try {
                        while ($t.moveNext()) {
                            var mevent = $t.Current;
                            if ((mevent.EventFlag === changeEvent.EventFlag) && (mevent.Channel === changeEvent.Channel) && (mevent.ControlNum === changeEvent.ControlNum)) {

                                mevent.ControlValue = changeEvent.ControlValue;
                                return;
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }newevents.add(changeEvent);
                },
                StartAtPauseTime: function (list, pauseTime) {
                    var $t;
                    var newlist = System.Array.init(list.length, null, System.Collections.Generic.List$1(MidiSheetMusic.MidiEvent));
                    for (var tracknum = 0; tracknum < list.length; tracknum = (tracknum + 1) | 0) {
                        var events = list[System.Array.index(tracknum, list)];
                        var newevents = new (System.Collections.Generic.List$1(MidiSheetMusic.MidiEvent)).$ctor2(events.Count);
                        newlist[System.Array.index(tracknum, newlist)] = newevents;

                        var foundEventAfterPause = false;
                        $t = Bridge.getEnumerator(events);
                        try {
                            while ($t.moveNext()) {
                                var mevent = $t.Current;

                                if (mevent.StartTime < pauseTime) {
                                    if (mevent.EventFlag === MidiSheetMusic.MidiFile.EventNoteOn || mevent.EventFlag === MidiSheetMusic.MidiFile.EventNoteOff) {

                                        /* Skip NoteOn/NoteOff event */
                                    } else if (mevent.EventFlag === MidiSheetMusic.MidiFile.EventControlChange) {
                                        mevent.DeltaTime = 0;
                                        MidiSheetMusic.MidiFile.UpdateControlChange(newevents, mevent);
                                    } else {
                                        mevent.DeltaTime = 0;
                                        newevents.add(mevent);
                                    }
                                } else if (!foundEventAfterPause) {
                                    mevent.DeltaTime = (((mevent.StartTime - pauseTime) | 0));
                                    newevents.add(mevent);
                                    foundEventAfterPause = true;
                                } else {
                                    newevents.add(mevent);
                                }
                            }
                        } finally {
                            if (Bridge.is($t, System.IDisposable)) {
                                $t.System$IDisposable$dispose();
                            }
                        }}
                    return newlist;
                },
                ShiftTime: function (tracks, amount) {
                    var $t, $t1;
                    $t = Bridge.getEnumerator(tracks);
                    try {
                        while ($t.moveNext()) {
                            var track = $t.Current;
                            $t1 = Bridge.getEnumerator(track.Notes);
                            try {
                                while ($t1.moveNext()) {
                                    var note = $t1.Current;
                                    note.StartTime = (note.StartTime + amount) | 0;
                                }
                            } finally {
                                if (Bridge.is($t1, System.IDisposable)) {
                                    $t1.System$IDisposable$dispose();
                                }
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }},
                Transpose: function (tracks, amount) {
                    var $t, $t1;
                    $t = Bridge.getEnumerator(tracks);
                    try {
                        while ($t.moveNext()) {
                            var track = $t.Current;
                            $t1 = Bridge.getEnumerator(track.Notes);
                            try {
                                while ($t1.moveNext()) {
                                    var note = $t1.Current;
                                    note.Number = (note.Number + amount) | 0;
                                    if (note.Number < 0) {
                                        note.Number = 0;
                                    }
                                }
                            } finally {
                                if (Bridge.is($t1, System.IDisposable)) {
                                    $t1.System$IDisposable$dispose();
                                }
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }},
                FindHighLowNotes: function (notes, measurelen, startindex, starttime, endtime, high, low) {

                    var i = startindex;
                    if (((starttime + measurelen) | 0) < endtime) {
                        endtime = (starttime + measurelen) | 0;
                    }

                    while (i < notes.Count && notes.getItem(i).StartTime < endtime) {
                        if (notes.getItem(i).EndTime < starttime) {
                            i = (i + 1) | 0;
                            continue;
                        }
                        if (((notes.getItem(i).StartTime + measurelen) | 0) < starttime) {
                            i = (i + 1) | 0;
                            continue;
                        }
                        if (high.v < notes.getItem(i).Number) {
                            high.v = notes.getItem(i).Number;
                        }
                        if (low.v > notes.getItem(i).Number) {
                            low.v = notes.getItem(i).Number;
                        }
                        i = (i + 1) | 0;
                    }
                },
                FindExactHighLowNotes: function (notes, startindex, starttime, high, low) {

                    var i = startindex;

                    while (notes.getItem(i).StartTime < starttime) {
                        i = (i + 1) | 0;
                    }

                    while (i < notes.Count && notes.getItem(i).StartTime === starttime) {
                        if (high.v < notes.getItem(i).Number) {
                            high.v = notes.getItem(i).Number;
                        }
                        if (low.v > notes.getItem(i).Number) {
                            low.v = notes.getItem(i).Number;
                        }
                        i = (i + 1) | 0;
                    }
                },
                SplitTrack: function (track, measurelen) {
                    var $t;
                    var notes = track.Notes;
                    var count = notes.Count;

                    var top = new MidiSheetMusic.MidiTrack.$ctor1(1);
                    var bottom = new MidiSheetMusic.MidiTrack.$ctor1(2);
                    var result = new (System.Collections.Generic.List$1(MidiSheetMusic.MidiTrack)).$ctor2(2);
                    result.add(top);
                    result.add(bottom);

                    if (count === 0) {
                        return result;
                    }

                    var prevhigh = 76; /* E5, top of treble staff */
                    var prevlow = 45; /* A3, bottom of bass staff */
                    var startindex = 0;

                    $t = Bridge.getEnumerator(notes);
                    try {
                        while ($t.moveNext()) {
                            var note = $t.Current;
                            var high = { }, low = { }, highExact = { }, lowExact = { };

                            var number = note.Number;
                            high.v = (low.v = (highExact.v = (lowExact.v = number)));

                            while (notes.getItem(startindex).EndTime < note.StartTime) {
                                startindex = (startindex + 1) | 0;
                            }

                            /* I've tried several algorithms for splitting a track in two,
                              and the one below seems to work the best:
                              - If this note is more than an octave from the high/low notes
                                (that start exactly at this start time), choose the closest one.
                              - If this note is more than an octave from the high/low notes
                                (in this note's time duration), choose the closest one.
                              - If the high and low notes (that start exactly at this starttime)
                                are more than an octave apart, choose the closest note.
                              - If the high and low notes (that overlap this starttime)
                                are more than an octave apart, choose the closest note.
                              - Else, look at the previous high/low notes that were more than an 
                                octave apart.  Choose the closeset note.
                            */
                            MidiSheetMusic.MidiFile.FindHighLowNotes(notes, measurelen, startindex, note.StartTime, note.EndTime, high, low);
                            MidiSheetMusic.MidiFile.FindExactHighLowNotes(notes, startindex, note.StartTime, highExact, lowExact);

                            if (((highExact.v - number) | 0) > 12 || ((number - lowExact.v) | 0) > 12) {
                                if (((highExact.v - number) | 0) <= ((number - lowExact.v) | 0)) {
                                    top.AddNote(note);
                                } else {
                                    bottom.AddNote(note);
                                }
                            } else if (((high.v - number) | 0) > 12 || ((number - low.v) | 0) > 12) {
                                if (((high.v - number) | 0) <= ((number - low.v) | 0)) {
                                    top.AddNote(note);
                                } else {
                                    bottom.AddNote(note);
                                }
                            } else if (((highExact.v - lowExact.v) | 0) > 12) {
                                if (((highExact.v - number) | 0) <= ((number - lowExact.v) | 0)) {
                                    top.AddNote(note);
                                } else {
                                    bottom.AddNote(note);
                                }
                            } else if (((high.v - low.v) | 0) > 12) {
                                if (((high.v - number) | 0) <= ((number - low.v) | 0)) {
                                    top.AddNote(note);
                                } else {
                                    bottom.AddNote(note);
                                }
                            } else {
                                if (((prevhigh - number) | 0) <= ((number - prevlow) | 0)) {
                                    top.AddNote(note);
                                } else {
                                    bottom.AddNote(note);
                                }
                            }

                            /* The prevhigh/prevlow are set to the last high/low
                              that are more than an octave apart.
                            */
                            if (((high.v - low.v) | 0) > 12) {
                                prevhigh = high.v;
                                prevlow = low.v;
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }
                    top.Notes.sort$1(track.Notes.getItem(0));
                    bottom.Notes.sort$1(track.Notes.getItem(0));

                    return result;
                },
                CombineToSingleTrack: function (tracks) {
                    var $t;
                    /* Add all notes into one track */
                    var result = new MidiSheetMusic.MidiTrack.$ctor1(1);

                    if (tracks.Count === 0) {
                        return result;
                    } else if (tracks.Count === 1) {
                        var track = tracks.getItem(0);
                        $t = Bridge.getEnumerator(track.Notes);
                        try {
                            while ($t.moveNext()) {
                                var note = $t.Current;
                                result.AddNote(note);
                            }
                        } finally {
                            if (Bridge.is($t, System.IDisposable)) {
                                $t.System$IDisposable$dispose();
                            }
                        }return result;
                    }

                    var noteindex = System.Array.init(64, 0, System.Int32);
                    var notecount = System.Array.init(64, 0, System.Int32);

                    for (var tracknum = 0; tracknum < tracks.Count; tracknum = (tracknum + 1) | 0) {
                        noteindex[System.Array.index(tracknum, noteindex)] = 0;
                        notecount[System.Array.index(tracknum, notecount)] = tracks.getItem(tracknum).Notes.Count;
                    }
                    var prevnote = null;
                    while (true) {
                        var lowestnote = null;
                        var lowestTrack = -1;
                        for (var tracknum1 = 0; tracknum1 < tracks.Count; tracknum1 = (tracknum1 + 1) | 0) {
                            var track1 = tracks.getItem(tracknum1);
                            if (noteindex[System.Array.index(tracknum1, noteindex)] >= notecount[System.Array.index(tracknum1, notecount)]) {
                                continue;
                            }
                            var note1 = track1.Notes.getItem(noteindex[System.Array.index(tracknum1, noteindex)]);
                            if (lowestnote == null) {
                                lowestnote = note1;
                                lowestTrack = tracknum1;
                            } else if (note1.StartTime < lowestnote.StartTime) {
                                lowestnote = note1;
                                lowestTrack = tracknum1;
                            } else if (note1.StartTime === lowestnote.StartTime && note1.Number < lowestnote.Number) {
                                lowestnote = note1;
                                lowestTrack = tracknum1;
                            }
                        }
                        if (lowestnote == null) {
                            /* We've finished the merge */
                            break;
                        }
                        noteindex[System.Array.index(lowestTrack, noteindex)] = (noteindex[System.Array.index(lowestTrack, noteindex)] + 1) | 0;
                        if ((prevnote != null) && (prevnote.StartTime === lowestnote.StartTime) && (prevnote.Number === lowestnote.Number)) {

                            /* Don't add duplicate notes, with the same start time and number */
                            if (lowestnote.Duration > prevnote.Duration) {
                                prevnote.Duration = lowestnote.Duration;
                            }
                        } else {
                            result.AddNote(lowestnote);
                            prevnote = lowestnote;
                        }
                    }

                    return result;
                },
                CombineToTwoTracks: function (tracks, measurelen) {
                    var $t;
                    var single = MidiSheetMusic.MidiFile.CombineToSingleTrack(tracks);
                    var result = MidiSheetMusic.MidiFile.SplitTrack(single, measurelen);

                    var lyrics = new (System.Collections.Generic.List$1(MidiSheetMusic.MidiEvent)).ctor();
                    $t = Bridge.getEnumerator(tracks);
                    try {
                        while ($t.moveNext()) {
                            var track = $t.Current;
                            if (track.Lyrics != null) {
                                lyrics.addRange(track.Lyrics);
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }if (lyrics.Count > 0) {
                        lyrics.sort$1(lyrics.getItem(0));
                        result.getItem(0).Lyrics = lyrics;
                    }

                    return result;
                },
                CheckStartTimes: function (tracks) {
                    var $t, $t1;
                    $t = Bridge.getEnumerator(tracks);
                    try {
                        while ($t.moveNext()) {
                            var track = $t.Current;
                            var prevtime = -1;
                            $t1 = Bridge.getEnumerator(track.Notes);
                            try {
                                while ($t1.moveNext()) {
                                    var note = $t1.Current;
                                    if (note.StartTime < prevtime) {
                                        throw new System.ArgumentException("start times not in increasing order");
                                    }
                                    prevtime = note.StartTime;
                                }
                            } finally {
                                if (Bridge.is($t1, System.IDisposable)) {
                                    $t1.System$IDisposable$dispose();
                                }
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }},
                RoundStartTimes: function (tracks, millisec, time) {
                    var $t, $t1, $t2, $t3;
                    /* Get all the starttimes in all tracks, in sorted order */
                    var starttimes = new (System.Collections.Generic.List$1(System.Int32)).ctor();
                    $t = Bridge.getEnumerator(tracks);
                    try {
                        while ($t.moveNext()) {
                            var track = $t.Current;
                            $t1 = Bridge.getEnumerator(track.Notes);
                            try {
                                while ($t1.moveNext()) {
                                    var note = $t1.Current;
                                    starttimes.add(note.StartTime);
                                }
                            } finally {
                                if (Bridge.is($t1, System.IDisposable)) {
                                    $t1.System$IDisposable$dispose();
                                }
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }starttimes.sort();

                    /* Notes within "millisec" milliseconds apart will be combined. */
                    var interval = (Bridge.Int.div(Bridge.Int.mul(Bridge.Int.mul(time.Quarter, millisec), 1000), time.Tempo)) | 0;

                    /* If two starttimes are within interval millisec, make them the same */
                    for (var i = 0; i < ((starttimes.Count - 1) | 0); i = (i + 1) | 0) {
                        if (((starttimes.getItem(((i + 1) | 0)) - starttimes.getItem(i)) | 0) <= interval) {
                            starttimes.setItem(((i + 1) | 0), starttimes.getItem(i));
                        }
                    }

                    MidiSheetMusic.MidiFile.CheckStartTimes(tracks);

                    /* Adjust the note starttimes, so that it matches one of the starttimes values */
                    $t2 = Bridge.getEnumerator(tracks);
                    try {
                        while ($t2.moveNext()) {
                            var track1 = $t2.Current;
                            var i1 = 0;

                            $t3 = Bridge.getEnumerator(track1.Notes);
                            try {
                                while ($t3.moveNext()) {
                                    var note1 = $t3.Current;
                                    while (i1 < starttimes.Count && ((note1.StartTime - interval) | 0) > starttimes.getItem(i1)) {
                                        i1 = (i1 + 1) | 0;
                                    }

                                    if (note1.StartTime > starttimes.getItem(i1) && ((note1.StartTime - starttimes.getItem(i1)) | 0) <= interval) {

                                        note1.StartTime = starttimes.getItem(i1);
                                    }
                                }
                            } finally {
                                if (Bridge.is($t3, System.IDisposable)) {
                                    $t3.System$IDisposable$dispose();
                                }
                            }track1.Notes.sort$1(track1.Notes.getItem(0));
                        }
                    } finally {
                        if (Bridge.is($t2, System.IDisposable)) {
                            $t2.System$IDisposable$dispose();
                        }
                    }},
                RoundDurations: function (tracks, quarternote) {
                    var $t;

                    $t = Bridge.getEnumerator(tracks);
                    try {
                        while ($t.moveNext()) {
                            var track = $t.Current;
                            var prevNote = null;
                            for (var i = 0; i < ((track.Notes.Count - 1) | 0); i = (i + 1) | 0) {
                                var note1 = track.Notes.getItem(i);
                                if (prevNote == null) {
                                    prevNote = note1;
                                }

                                /* Get the next note that has a different start time */
                                var note2 = note1;
                                for (var j = (i + 1) | 0; j < track.Notes.Count; j = (j + 1) | 0) {
                                    note2 = track.Notes.getItem(j);
                                    if (note1.StartTime < note2.StartTime) {
                                        break;
                                    }
                                }
                                var maxduration = (note2.StartTime - note1.StartTime) | 0;

                                var dur = 0;
                                if (quarternote <= maxduration) {
                                    dur = quarternote;
                                } else {
                                    if (((Bridge.Int.div(quarternote, 2)) | 0) <= maxduration) {
                                        dur = (Bridge.Int.div(quarternote, 2)) | 0;
                                    } else {
                                        if (((Bridge.Int.div(quarternote, 3)) | 0) <= maxduration) {
                                            dur = (Bridge.Int.div(quarternote, 3)) | 0;
                                        } else {
                                            if (((Bridge.Int.div(quarternote, 4)) | 0) <= maxduration) {
                                                dur = (Bridge.Int.div(quarternote, 4)) | 0;
                                            }
                                        }
                                    }
                                }


                                if (dur < note1.Duration) {
                                    dur = note1.Duration;
                                }

                                /* Special case: If the previous note's duration
                                  matches this note's duration, we can make a notepair.
                                  So don't expand the duration in that case.
                                */
                                if ((((prevNote.StartTime + prevNote.Duration) | 0) === note1.StartTime) && (prevNote.Duration === note1.Duration)) {

                                    dur = note1.Duration;
                                }
                                note1.Duration = dur;
                                if (track.Notes.getItem(((i + 1) | 0)).StartTime !== note1.StartTime) {
                                    prevNote = note1;
                                }
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }},
                SplitChannels: function (origtrack, events) {
                    var $t, $t1, $t2, $t3, $t4;

                    /* Find the instrument used for each channel */
                    var channelInstruments = System.Array.init(16, 0, System.Int32);
                    $t = Bridge.getEnumerator(events);
                    try {
                        while ($t.moveNext()) {
                            var mevent = $t.Current;
                            if (mevent.EventFlag === MidiSheetMusic.MidiFile.EventProgramChange) {
                                channelInstruments[System.Array.index(mevent.Channel, channelInstruments)] = mevent.Instrument;
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }channelInstruments[System.Array.index(9, channelInstruments)] = 128; /* Channel 9 = Percussion */

                    var result = new (System.Collections.Generic.List$1(MidiSheetMusic.MidiTrack)).ctor();
                    $t1 = Bridge.getEnumerator(origtrack.Notes);
                    try {
                        while ($t1.moveNext()) {
                            var note = $t1.Current;
                            var foundchannel = false;
                            $t2 = Bridge.getEnumerator(result);
                            try {
                                while ($t2.moveNext()) {
                                    var track = $t2.Current;
                                    if (note.Channel === track.Notes.getItem(0).Channel) {
                                        foundchannel = true;
                                        track.AddNote(note);
                                    }
                                }
                            } finally {
                                if (Bridge.is($t2, System.IDisposable)) {
                                    $t2.System$IDisposable$dispose();
                                }
                            }if (!foundchannel) {
                                var track1 = new MidiSheetMusic.MidiTrack.$ctor1(((result.Count + 1) | 0));
                                track1.AddNote(note);
                                track1.Instrument = channelInstruments[System.Array.index(note.Channel, channelInstruments)];
                                result.add(track1);
                            }
                        }
                    } finally {
                        if (Bridge.is($t1, System.IDisposable)) {
                            $t1.System$IDisposable$dispose();
                        }
                    }if (origtrack.Lyrics != null) {
                        $t3 = Bridge.getEnumerator(origtrack.Lyrics);
                        try {
                            while ($t3.moveNext()) {
                                var lyricEvent = $t3.Current;
                                $t4 = Bridge.getEnumerator(result);
                                try {
                                    while ($t4.moveNext()) {
                                        var track2 = $t4.Current;
                                        if (lyricEvent.Channel === track2.Notes.getItem(0).Channel) {
                                            track2.AddLyric(lyricEvent);
                                        }
                                    }
                                } finally {
                                    if (Bridge.is($t4, System.IDisposable)) {
                                        $t4.System$IDisposable$dispose();
                                    }
                                }
                            }
                        } finally {
                            if (Bridge.is($t3, System.IDisposable)) {
                                $t3.System$IDisposable$dispose();
                            }
                        }}
                    return result;
                }
            }
        },
        fields: {
            filename: null,
            events: null,
            tracks: null,
            trackmode: 0,
            timesig: null,
            quarternote: 0,
            totalpulses: 0,
            trackPerChannel: false
        },
        props: {
            Tracks: {
                get: function () {
                    return this.tracks;
                }
            },
            Time: {
                get: function () {
                    return this.timesig;
                }
            },
            FileName: {
                get: function () {
                    return this.filename;
                }
            },
            TotalPulses: {
                get: function () {
                    return this.totalpulses;
                }
            }
        },
        ctors: {
            ctor: function (data, title) {
                this.$initialize();
                var header = { };
                if (MidiSheetMusic.RiffParser.IsRiffFile(data, header)) {
                    data = this.ParseRiffData(data);
                }

                var file = new MidiSheetMusic.MidiFileReader(data);
                if (title == null) {
                    title = "";
                }
                this.parse(file, title);
            }
        },
        methods: {
            EventName: function (ev) {
                if (ev >= MidiSheetMusic.MidiFile.EventNoteOff && ev < 144) {
                    return "NoteOff";
                } else {
                    if (ev >= MidiSheetMusic.MidiFile.EventNoteOn && ev < 160) {
                        return "NoteOn";
                    } else {
                        if (ev >= MidiSheetMusic.MidiFile.EventKeyPressure && ev < 176) {
                            return "KeyPressure";
                        } else {
                            if (ev >= MidiSheetMusic.MidiFile.EventControlChange && ev < 192) {
                                return "ControlChange";
                            } else {
                                if (ev >= MidiSheetMusic.MidiFile.EventProgramChange && ev < 208) {
                                    return "ProgramChange";
                                } else {
                                    if (ev >= MidiSheetMusic.MidiFile.EventChannelPressure && ev < 224) {
                                        return "ChannelPressure";
                                    } else {
                                        if (ev >= MidiSheetMusic.MidiFile.EventPitchBend && ev < 240) {
                                            return "PitchBend";
                                        } else {
                                            if (ev === MidiSheetMusic.MidiFile.MetaEvent) {
                                                return "MetaEvent";
                                            } else {
                                                if (ev === MidiSheetMusic.MidiFile.SysexEvent1 || ev === MidiSheetMusic.MidiFile.SysexEvent2) {
                                                    return "SysexEvent";
                                                } else {
                                                    return "Unknown";
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            MetaName: function (ev) {
                if (ev === MidiSheetMusic.MidiFile.MetaEventSequence) {
                    return "MetaEventSequence";
                } else {
                    if (ev === MidiSheetMusic.MidiFile.MetaEventText) {
                        return "MetaEventText";
                    } else {
                        if (ev === MidiSheetMusic.MidiFile.MetaEventCopyright) {
                            return "MetaEventCopyright";
                        } else {
                            if (ev === MidiSheetMusic.MidiFile.MetaEventSequenceName) {
                                return "MetaEventSequenceName";
                            } else {
                                if (ev === MidiSheetMusic.MidiFile.MetaEventInstrument) {
                                    return "MetaEventInstrument";
                                } else {
                                    if (ev === MidiSheetMusic.MidiFile.MetaEventLyric) {
                                        return "MetaEventLyric";
                                    } else {
                                        if (ev === MidiSheetMusic.MidiFile.MetaEventMarker) {
                                            return "MetaEventMarker";
                                        } else {
                                            if (ev === MidiSheetMusic.MidiFile.MetaEventEndOfTrack) {
                                                return "MetaEventEndOfTrack";
                                            } else {
                                                if (ev === MidiSheetMusic.MidiFile.MetaEventTempo) {
                                                    return "MetaEventTempo";
                                                } else {
                                                    if (ev === MidiSheetMusic.MidiFile.MetaEventSMPTEOffset) {
                                                        return "MetaEventSMPTEOffset";
                                                    } else {
                                                        if (ev === MidiSheetMusic.MidiFile.MetaEventTimeSignature) {
                                                            return "MetaEventTimeSignature";
                                                        } else {
                                                            if (ev === MidiSheetMusic.MidiFile.MetaEventKeySignature) {
                                                                return "MetaEventKeySignature";
                                                            } else {
                                                                return "Unknown";
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            ParseRiffData: function (data) {
                var riffFile = MidiSheetMusic.RiffParser.ParseByteArray(data);
                if (!Bridge.referenceEquals(riffFile.FileInfo.FileType, "RMID")) {
                    return data;
                }
                while (riffFile.Read(function (type, isList, chunk) {
                    if (!isList && Bridge.referenceEquals(type.toLowerCase(), "data")) {
                        data = chunk.GetData();
                    }
                })) {
                    ;
                }
                return data;
            },
            parse: function (file, filename) {
                var $t, $t1, $t2;
                var id;
                var len;

                this.filename = filename;
                this.tracks = new (System.Collections.Generic.List$1(MidiSheetMusic.MidiTrack)).ctor();
                this.trackPerChannel = false;

                id = file.ReadAscii(4);
                if (!Bridge.referenceEquals(id, "MThd")) {
                    throw new MidiSheetMusic.MidiFileException("Doesn't start with MThd", 0);
                }
                len = file.ReadInt();
                if (len !== 6) {
                    throw new MidiSheetMusic.MidiFileException("Bad MThd header", 4);
                }
                this.trackmode = file.ReadShort();
                var num_tracks = file.ReadShort();
                this.quarternote = file.ReadShort();

                this.events = System.Array.init(num_tracks, null, System.Collections.Generic.List$1(MidiSheetMusic.MidiEvent));
                for (var tracknum = 0; tracknum < num_tracks; tracknum = (tracknum + 1) | 0) {
                    this.events[System.Array.index(tracknum, this.events)] = this.ReadTrack(file);
                    var track = new MidiSheetMusic.MidiTrack.ctor(this.events[System.Array.index(tracknum, this.events)], tracknum);
                    if (track.Notes.Count > 0 || track.Lyrics != null) {
                        this.tracks.add(track);
                    }
                }

                /* Get the length of the song in pulses */
                $t = Bridge.getEnumerator(this.tracks);
                try {
                    while ($t.moveNext()) {
                        var track1 = $t.Current;
                        var last = track1.Notes.getItem(((track1.Notes.Count - 1) | 0));
                        if (this.totalpulses < ((last.StartTime + last.Duration) | 0)) {
                            this.totalpulses = (last.StartTime + last.Duration) | 0;
                        }
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }
                /* If we only have one track with multiple channels, then treat
                  each channel as a separate track.
                */
                if (this.tracks.Count === 1 && MidiSheetMusic.MidiFile.HasMultipleChannels(this.tracks.getItem(0))) {
                    this.tracks = MidiSheetMusic.MidiFile.SplitChannels(this.tracks.getItem(0), this.events[System.Array.index(this.tracks.getItem(0).Number, this.events)]);
                    this.trackPerChannel = true;
                }

                MidiSheetMusic.MidiFile.CheckStartTimes(this.tracks);

                /* Determine the time signature */
                var tempo = 0;
                var numer = 0;
                var denom = 0;
                $t1 = Bridge.getEnumerator(this.events);
                try {
                    while ($t1.moveNext()) {
                        var list = $t1.Current;
                        $t2 = Bridge.getEnumerator(list);
                        try {
                            while ($t2.moveNext()) {
                                var mevent = $t2.Current;
                                if (mevent.Metaevent === MidiSheetMusic.MidiFile.MetaEventTempo && tempo === 0) {
                                    tempo = mevent.Tempo;
                                }
                                if (mevent.Metaevent === MidiSheetMusic.MidiFile.MetaEventTimeSignature && numer === 0) {
                                    numer = mevent.Numerator;
                                    denom = mevent.Denominator;
                                }
                            }
                        } finally {
                            if (Bridge.is($t2, System.IDisposable)) {
                                $t2.System$IDisposable$dispose();
                            }
                        }
                    }
                } finally {
                    if (Bridge.is($t1, System.IDisposable)) {
                        $t1.System$IDisposable$dispose();
                    }
                }if (tempo === 0) {
                    tempo = 500000; /* 500,000 microseconds = 0.05 sec */
                }
                if (numer === 0) {
                    numer = 4;
                    denom = 4;
                }
                this.timesig = new MidiSheetMusic.TimeSignature(numer, denom, this.quarternote, tempo);
            },
            ReadTrack: function (file) {
                var result = new (System.Collections.Generic.List$1(MidiSheetMusic.MidiEvent)).$ctor2(20);
                var starttime = 0;
                var id = file.ReadAscii(4);

                if (!Bridge.referenceEquals(id, "MTrk")) {
                    throw new MidiSheetMusic.MidiFileException("Bad MTrk header", ((file.GetOffset() - 4) | 0));
                }
                var tracklen = file.ReadInt();
                var trackend = (tracklen + file.GetOffset()) | 0;

                var eventflag = 0;

                while (file.GetOffset() < trackend) {

                    // If the midi file is truncated here, we can still recover.
                    // Just return what we've parsed so far.

                    var startoffset, deltatime;
                    var peekevent;
                    try {
                        startoffset = file.GetOffset();
                        deltatime = file.ReadVarlen();
                        starttime = (starttime + deltatime) | 0;
                        peekevent = file.Peek();
                    }
                    catch ($e1) {
                        $e1 = System.Exception.create($e1);
                        if (Bridge.is($e1, MidiSheetMusic.MidiFileException)) {
                            return result;
                        } else {
                            throw $e1;
                        }
                    }

                    var mevent = new MidiSheetMusic.MidiEvent();
                    result.add(mevent);
                    mevent.DeltaTime = deltatime;
                    mevent.StartTime = starttime;

                    if (peekevent >= MidiSheetMusic.MidiFile.EventNoteOff) {
                        mevent.HasEventflag = true;
                        eventflag = file.ReadByte();
                    }

                    // Console.WriteLine("offset {0}: event {1} {2} start {3} delta {4}", 
                    //                   startoffset, eventflag, EventName(eventflag), 
                    //                   starttime, mevent.DeltaTime);

                    if (eventflag >= MidiSheetMusic.MidiFile.EventNoteOn && eventflag < 160) {
                        mevent.EventFlag = MidiSheetMusic.MidiFile.EventNoteOn;
                        mevent.Channel = (((eventflag - MidiSheetMusic.MidiFile.EventNoteOn) | 0)) & 255;
                        mevent.Notenumber = file.ReadByte();
                        mevent.Velocity = file.ReadByte();
                    } else if (eventflag >= MidiSheetMusic.MidiFile.EventNoteOff && eventflag < 144) {
                        mevent.EventFlag = MidiSheetMusic.MidiFile.EventNoteOff;
                        mevent.Channel = (((eventflag - MidiSheetMusic.MidiFile.EventNoteOff) | 0)) & 255;
                        mevent.Notenumber = file.ReadByte();
                        mevent.Velocity = file.ReadByte();
                    } else if (eventflag >= MidiSheetMusic.MidiFile.EventKeyPressure && eventflag < 176) {
                        mevent.EventFlag = MidiSheetMusic.MidiFile.EventKeyPressure;
                        mevent.Channel = (((eventflag - MidiSheetMusic.MidiFile.EventKeyPressure) | 0)) & 255;
                        mevent.Notenumber = file.ReadByte();
                        mevent.KeyPressure = file.ReadByte();
                    } else if (eventflag >= MidiSheetMusic.MidiFile.EventControlChange && eventflag < 192) {
                        mevent.EventFlag = MidiSheetMusic.MidiFile.EventControlChange;
                        mevent.Channel = (((eventflag - MidiSheetMusic.MidiFile.EventControlChange) | 0)) & 255;
                        mevent.ControlNum = file.ReadByte();
                        mevent.ControlValue = file.ReadByte();
                    } else if (eventflag >= MidiSheetMusic.MidiFile.EventProgramChange && eventflag < 208) {
                        mevent.EventFlag = MidiSheetMusic.MidiFile.EventProgramChange;
                        mevent.Channel = (((eventflag - MidiSheetMusic.MidiFile.EventProgramChange) | 0)) & 255;
                        mevent.Instrument = file.ReadByte();
                    } else if (eventflag >= MidiSheetMusic.MidiFile.EventChannelPressure && eventflag < 224) {
                        mevent.EventFlag = MidiSheetMusic.MidiFile.EventChannelPressure;
                        mevent.Channel = (((eventflag - MidiSheetMusic.MidiFile.EventChannelPressure) | 0)) & 255;
                        mevent.ChanPressure = file.ReadByte();
                    } else if (eventflag >= MidiSheetMusic.MidiFile.EventPitchBend && eventflag < 240) {
                        mevent.EventFlag = MidiSheetMusic.MidiFile.EventPitchBend;
                        mevent.Channel = (((eventflag - MidiSheetMusic.MidiFile.EventPitchBend) | 0)) & 255;
                        mevent.PitchBend = file.ReadShort();
                    } else if (eventflag === MidiSheetMusic.MidiFile.SysexEvent1) {
                        mevent.EventFlag = MidiSheetMusic.MidiFile.SysexEvent1;
                        mevent.Metalength = file.ReadVarlen();
                        mevent.Value = file.ReadBytes(mevent.Metalength);
                    } else if (eventflag === MidiSheetMusic.MidiFile.SysexEvent2) {
                        mevent.EventFlag = MidiSheetMusic.MidiFile.SysexEvent2;
                        mevent.Metalength = file.ReadVarlen();
                        mevent.Value = file.ReadBytes(mevent.Metalength);
                    } else if (eventflag === MidiSheetMusic.MidiFile.MetaEvent) {
                        mevent.EventFlag = MidiSheetMusic.MidiFile.MetaEvent;
                        mevent.Metaevent = file.ReadByte();
                        mevent.Metalength = file.ReadVarlen();
                        mevent.Value = file.ReadBytes(mevent.Metalength);
                        if (mevent.Metaevent === MidiSheetMusic.MidiFile.MetaEventTimeSignature) {
                            if (mevent.Metalength < 2) {
                                // throw new MidiFileException(
                                //  "Meta Event Time Signature len == " + mevent.Metalength  + 
                                //  " != 4", file.GetOffset());
                                mevent.Numerator = 0;
                                mevent.Denominator = 4;
                            } else if (mevent.Metalength >= 2 && mevent.Metalength < 4) {
                                mevent.Numerator = mevent.Value[System.Array.index(0, mevent.Value)];
                                mevent.Denominator = Bridge.Int.clipu8(Math.pow(2, mevent.Value[System.Array.index(1, mevent.Value)]));
                            } else {
                                mevent.Numerator = mevent.Value[System.Array.index(0, mevent.Value)];
                                mevent.Denominator = Bridge.Int.clipu8(Math.pow(2, mevent.Value[System.Array.index(1, mevent.Value)]));
                            }
                        } else if (mevent.Metaevent === MidiSheetMusic.MidiFile.MetaEventTempo) {
                            if (mevent.Metalength !== 3) {
                                throw new MidiSheetMusic.MidiFileException("Meta Event Tempo len == " + mevent.Metalength + " != 3", file.GetOffset());
                            }
                            mevent.Tempo = ((mevent.Value[System.Array.index(0, mevent.Value)] << 16) | (mevent.Value[System.Array.index(1, mevent.Value)] << 8) | mevent.Value[System.Array.index(2, mevent.Value)]);
                        } else if (mevent.Metaevent === MidiSheetMusic.MidiFile.MetaEventEndOfTrack) {
                            /* break;  */
                        }
                    } else {
                        throw new MidiSheetMusic.MidiFileException("Unknown event " + mevent.EventFlag, ((file.GetOffset() - 1) | 0));
                    }
                }

                return result;
            },
            ChangeSound: function (destfile, options) {
                return this.Write$1(destfile, options);
            },
            Write$1: function (destfile, options) {
                try {
                    var stream;
                    stream = new MidiSheetMusic.FileStream(destfile, MidiSheetMusic.FileMode.Create);
                    var result = this.Write(stream, options);
                    stream.Close();
                    return result;
                }
                catch ($e1) {
                    $e1 = System.Exception.create($e1);
                    if (Bridge.is($e1, MidiSheetMusic.IOException)) {
                        return false;
                    } else {
                        throw $e1;
                    }
                }
            },
            Write: function (stream, options) {
                var newevents = this.events;
                if (options != null) {
                    newevents = this.ApplyOptionsToEvents(options);
                }
                return MidiSheetMusic.MidiFile.WriteEvents(stream, newevents, this.trackmode, this.quarternote);
            },
            ApplyOptionsToEvents: function (options) {
                var $t;
                var i;
                if (this.trackPerChannel) {
                    return this.ApplyOptionsPerChannel(options);
                }

                /* A midifile can contain tracks with notes and tracks without notes.
                  The options.tracks and options.instruments are for tracks with notes.
                  So the track numbers in 'options' may not match correctly if the
                  midi file has tracks without notes. Re-compute the instruments, and 
                  tracks to keep.
                */
                var num_tracks = this.events.length;
                var instruments = System.Array.init(num_tracks, 0, System.Int32);
                var keeptracks = System.Array.init(num_tracks, false, System.Boolean);
                for (i = 0; i < num_tracks; i = (i + 1) | 0) {
                    instruments[System.Array.index(i, instruments)] = 0;
                    keeptracks[System.Array.index(i, keeptracks)] = true;
                }
                for (var tracknum = 0; tracknum < this.tracks.Count; tracknum = (tracknum + 1) | 0) {
                    var track = this.tracks.getItem(tracknum);
                    var realtrack = track.Number;
                    instruments[System.Array.index(realtrack, instruments)] = options.instruments[System.Array.index(tracknum, options.instruments)];
                    if (options.mute[System.Array.index(tracknum, options.mute)] === true) {
                        keeptracks[System.Array.index(realtrack, keeptracks)] = false;
                    }
                }

                var newevents = MidiSheetMusic.MidiFile.CloneMidiEvents(this.events);

                /* Set the tempo at the beginning of each track */
                for (var tracknum1 = 0; tracknum1 < newevents.length; tracknum1 = (tracknum1 + 1) | 0) {
                    var mevent = MidiSheetMusic.MidiFile.CreateTempoEvent(options.tempo);
                    newevents[System.Array.index(tracknum1, newevents)].insert(0, mevent);
                }

                /* Change the note number (transpose), instrument, and tempo */
                for (var tracknum2 = 0; tracknum2 < newevents.length; tracknum2 = (tracknum2 + 1) | 0) {
                    $t = Bridge.getEnumerator(newevents[System.Array.index(tracknum2, newevents)]);
                    try {
                        while ($t.moveNext()) {
                            var mevent1 = $t.Current;
                            var num = (mevent1.Notenumber + options.transpose) | 0;
                            if (num < 0) {
                                num = 0;
                            }
                            if (num > 127) {
                                num = 127;
                            }
                            mevent1.Notenumber = num & 255;
                            if (!options.useDefaultInstruments) {
                                mevent1.Instrument = (instruments[System.Array.index(tracknum2, instruments)]) & 255;
                            }
                            mevent1.Tempo = options.tempo;
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }}

                if (options.pauseTime !== 0) {
                    newevents = MidiSheetMusic.MidiFile.StartAtPauseTime(newevents, options.pauseTime);
                }

                /* Change the tracks to include */
                var count = 0;
                for (var tracknum3 = 0; tracknum3 < keeptracks.length; tracknum3 = (tracknum3 + 1) | 0) {
                    if (keeptracks[System.Array.index(tracknum3, keeptracks)]) {
                        count = (count + 1) | 0;
                    }
                }
                var result = System.Array.init(count, null, System.Collections.Generic.List$1(MidiSheetMusic.MidiEvent));
                i = 0;
                for (var tracknum4 = 0; tracknum4 < keeptracks.length; tracknum4 = (tracknum4 + 1) | 0) {
                    if (keeptracks[System.Array.index(tracknum4, keeptracks)]) {
                        result[System.Array.index(i, result)] = newevents[System.Array.index(tracknum4, newevents)];
                        i = (i + 1) | 0;
                    }
                }
                return result;
            },
            ApplyOptionsPerChannel: function (options) {
                var $t;
                /* Determine which channels to include/exclude.
                  Also, determine the instruments for each channel.
                */
                var instruments = System.Array.init(16, 0, System.Int32);
                var keepchannel = System.Array.init(16, false, System.Boolean);
                for (var i = 0; i < 16; i = (i + 1) | 0) {
                    instruments[System.Array.index(i, instruments)] = 0;
                    keepchannel[System.Array.index(i, keepchannel)] = true;
                }
                for (var tracknum = 0; tracknum < this.tracks.Count; tracknum = (tracknum + 1) | 0) {
                    var track = this.tracks.getItem(tracknum);
                    var channel = track.Notes.getItem(0).Channel;
                    instruments[System.Array.index(channel, instruments)] = options.instruments[System.Array.index(tracknum, options.instruments)];
                    if (options.mute[System.Array.index(tracknum, options.mute)] === true) {
                        keepchannel[System.Array.index(channel, keepchannel)] = false;
                    }
                }

                var newevents = MidiSheetMusic.MidiFile.CloneMidiEvents(this.events);

                /* Set the tempo at the beginning of each track */
                for (var tracknum1 = 0; tracknum1 < newevents.length; tracknum1 = (tracknum1 + 1) | 0) {
                    var mevent = MidiSheetMusic.MidiFile.CreateTempoEvent(options.tempo);
                    newevents[System.Array.index(tracknum1, newevents)].insert(0, mevent);
                }

                /* Change the note number (transpose), instrument, and tempo */
                for (var tracknum2 = 0; tracknum2 < newevents.length; tracknum2 = (tracknum2 + 1) | 0) {
                    $t = Bridge.getEnumerator(newevents[System.Array.index(tracknum2, newevents)]);
                    try {
                        while ($t.moveNext()) {
                            var mevent1 = $t.Current;
                            var num = (mevent1.Notenumber + options.transpose) | 0;
                            if (num < 0) {
                                num = 0;
                            }
                            if (num > 127) {
                                num = 127;
                            }
                            mevent1.Notenumber = num & 255;
                            if (!keepchannel[System.Array.index(mevent1.Channel, keepchannel)]) {
                                mevent1.Velocity = 0;
                            }
                            if (!options.useDefaultInstruments) {
                                mevent1.Instrument = (instruments[System.Array.index(mevent1.Channel, instruments)]) & 255;
                            }
                            mevent1.Tempo = options.tempo;
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }}
                if (options.pauseTime !== 0) {
                    newevents = MidiSheetMusic.MidiFile.StartAtPauseTime(newevents, options.pauseTime);
                }
                return newevents;
            },
            ChangeMidiNotes: function (options) {
                var newtracks = new (System.Collections.Generic.List$1(MidiSheetMusic.MidiTrack)).ctor();

                for (var track = 0; track < this.tracks.Count; track = (track + 1) | 0) {
                    if (options.tracks[System.Array.index(track, options.tracks)]) {
                        newtracks.add(this.tracks.getItem(track).Clone());
                    }
                }

                /* To make the sheet music look nicer, we round the start times
                  so that notes close together appear as a single chord.  We
                  also extend the note durations, so that we have longer notes
                  and fewer rest symbols.
                */
                var time = this.timesig;
                if (options.time != null) {
                    time = options.time;
                }
                MidiSheetMusic.MidiFile.RoundStartTimes(newtracks, options.combineInterval, this.timesig);
                MidiSheetMusic.MidiFile.RoundDurations(newtracks, time.Quarter);

                if (options.twoStaffs) {
                    newtracks = MidiSheetMusic.MidiFile.CombineToTwoTracks(newtracks, this.timesig.Measure);
                }
                if (options.shifttime !== 0) {
                    MidiSheetMusic.MidiFile.ShiftTime(newtracks, options.shifttime);
                }
                if (options.transpose !== 0) {
                    MidiSheetMusic.MidiFile.Transpose(newtracks, options.transpose);
                }

                return newtracks;
            },
            GuessMeasureLength: function () {
                var $t, $t1, $t2;
                var result = new (System.Collections.Generic.List$1(System.Int32)).ctor();

                var pulses_per_second = Bridge.Int.clip32(1000000.0 / this.timesig.Tempo * this.timesig.Quarter);
                var minmeasure = (Bridge.Int.div(pulses_per_second, 2)) | 0; /* The minimum measure length in pulses */
                var maxmeasure = Bridge.Int.mul(pulses_per_second, 4); /* The maximum measure length in pulses */

                /* Get the start time of the first note in the midi file. */
                var firstnote = Bridge.Int.mul(this.timesig.Measure, 5);
                $t = Bridge.getEnumerator(this.tracks);
                try {
                    while ($t.moveNext()) {
                        var track = $t.Current;
                        if (firstnote > track.Notes.getItem(0).StartTime) {
                            firstnote = track.Notes.getItem(0).StartTime;
                        }
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }
                /* interval = 0.06 seconds, converted into pulses */
                var interval = (Bridge.Int.div(Bridge.Int.mul(this.timesig.Quarter, 60000), this.timesig.Tempo)) | 0;

                $t1 = Bridge.getEnumerator(this.tracks);
                try {
                    while ($t1.moveNext()) {
                        var track1 = $t1.Current;
                        var prevtime = 0;
                        $t2 = Bridge.getEnumerator(track1.Notes);
                        try {
                            while ($t2.moveNext()) {
                                var note = $t2.Current;
                                if (((note.StartTime - prevtime) | 0) <= interval) {
                                    continue;
                                }

                                prevtime = note.StartTime;

                                var time_from_firstnote = (note.StartTime - firstnote) | 0;

                                /* Round the time down to a multiple of 4 */
                                time_from_firstnote = Bridge.Int.mul(((Bridge.Int.div(time_from_firstnote, 4)) | 0), 4);
                                if (time_from_firstnote < minmeasure) {
                                    continue;
                                }
                                if (time_from_firstnote > maxmeasure) {
                                    break;
                                }

                                if (!result.contains(time_from_firstnote)) {
                                    result.add(time_from_firstnote);
                                }
                            }
                        } finally {
                            if (Bridge.is($t2, System.IDisposable)) {
                                $t2.System$IDisposable$dispose();
                            }
                        }
                    }
                } finally {
                    if (Bridge.is($t1, System.IDisposable)) {
                        $t1.System$IDisposable$dispose();
                    }
                }result.sort();
                return result;
            },
            EndTime: function () {
                var $t;
                var lastStart = 0;
                $t = Bridge.getEnumerator(this.tracks);
                try {
                    while ($t.moveNext()) {
                        var track = $t.Current;
                        if (track.Notes.Count === 0) {
                            continue;
                        }
                        var last = track.Notes.getItem(((track.Notes.Count - 1) | 0)).StartTime;
                        lastStart = Math.max(last, lastStart);
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }return lastStart;
            },
            HasLyrics: function () {
                var $t;
                $t = Bridge.getEnumerator(this.tracks);
                try {
                    while ($t.moveNext()) {
                        var track = $t.Current;
                        if (track.Lyrics != null) {
                            return true;
                        }
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }return false;
            },
            toString: function () {
                var $t;
                var result = "Midi File tracks=" + this.tracks.Count + " quarter=" + this.quarternote + "\n";
                result = (result || "") + (((this.Time.toString() || "") + "\n") || "");
                $t = Bridge.getEnumerator(this.tracks);
                try {
                    while ($t.moveNext()) {
                        var track = $t.Current;
                        result = (result || "") + ((track.toString()) || "");
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }return result;
            }
        }
    });

    Bridge.define("MidiSheetMusic.MidiFileException", {
        inherits: [System.Exception],
        ctors: {
            ctor: function (s, offset) {
                this.$initialize();
                System.Exception.ctor.call(this, (s || "") + " at offset " + offset);
            }
        }
    });

    Bridge.define("MidiSheetMusic.MidiFileReader", {
        fields: {
            data: null,
            parse_offset: 0
        },
        ctors: {
            ctor: function (bytes) {
                this.$initialize();
                this.data = bytes;
                this.parse_offset = 0;
            }
        },
        methods: {
            checkRead: function (amount) {
                if (((this.parse_offset + amount) | 0) > this.data.length) {
                    throw new MidiSheetMusic.MidiFileException("File is truncated", this.parse_offset);
                }
            },
            Peek: function () {
                this.checkRead(1);
                return this.data[System.Array.index(this.parse_offset, this.data)];
            },
            ReadByte: function () {
                this.checkRead(1);
                var x = this.data[System.Array.index(this.parse_offset, this.data)];
                this.parse_offset = (this.parse_offset + 1) | 0;
                return x;
            },
            ReadBytes: function (amount) {
                this.checkRead(amount);
                var result = System.Array.init(amount, 0, System.Byte);
                for (var i = 0; i < amount; i = (i + 1) | 0) {
                    result[System.Array.index(i, result)] = this.data[System.Array.index(((i + this.parse_offset) | 0), this.data)];
                }
                this.parse_offset = (this.parse_offset + amount) | 0;
                return result;
            },
            ReadShort: function () {
                this.checkRead(2);
                var x = ((this.data[System.Array.index(this.parse_offset, this.data)] << 8) | this.data[System.Array.index(((this.parse_offset + 1) | 0), this.data)]) & 65535;
                this.parse_offset = (this.parse_offset + 2) | 0;
                return x;
            },
            ReadInt: function () {
                this.checkRead(4);
                var x = (this.data[System.Array.index(this.parse_offset, this.data)] << 24) | (this.data[System.Array.index(((this.parse_offset + 1) | 0), this.data)] << 16) | (this.data[System.Array.index(((this.parse_offset + 2) | 0), this.data)] << 8) | this.data[System.Array.index(((this.parse_offset + 3) | 0), this.data)];
                this.parse_offset = (this.parse_offset + 4) | 0;
                return x;
            },
            ReadAscii: function (len) {
                this.checkRead(len);
                var s = System.Text.Encoding.ASCII.GetString$1(this.data, this.parse_offset, len);
                this.parse_offset = (this.parse_offset + len) | 0;
                return s;
            },
            ReadVarlen: function () {
                var result = 0;
                var b;

                b = this.ReadByte();
                result = (b & 127) >>> 0;

                for (var i = 0; i < 3; i = (i + 1) | 0) {
                    if ((b & 128) !== 0) {
                        b = this.ReadByte();
                        result = System.Int64.clipu32(System.Int64((((result << 7) >>> 0))).add(System.Int64((b & 127))));
                    } else {
                        break;
                    }
                }
                return (result | 0);
            },
            Skip: function (amount) {
                this.checkRead(amount);
                this.parse_offset = (this.parse_offset + amount) | 0;
            },
            GetOffset: function () {
                return this.parse_offset;
            },
            GetData: function () {
                return this.data;
            }
        }
    });

    Bridge.define("MidiSheetMusic.MidiNote", {
        inherits: function () { return [System.Collections.Generic.IComparer$1(MidiSheetMusic.MidiNote)]; },
        fields: {
            id: 0,
            starttime: 0,
            channel: 0,
            notenumber: 0,
            duration: 0,
            velocity: 0
        },
        props: {
            Id: {
                get: function () {
                    return this.id;
                }
            },
            StartTime: {
                get: function () {
                    return this.starttime;
                },
                set: function (value) {
                    this.starttime = value;
                }
            },
            EndTime: {
                get: function () {
                    return ((this.starttime + this.duration) | 0);
                }
            },
            Channel: {
                get: function () {
                    return this.channel;
                },
                set: function (value) {
                    this.channel = value;
                }
            },
            Number: {
                get: function () {
                    return this.notenumber;
                },
                set: function (value) {
                    this.notenumber = value;
                }
            },
            Duration: {
                get: function () {
                    return this.duration;
                },
                set: function (value) {
                    this.duration = value;
                }
            },
            Velocity: {
                get: function () {
                    return this.velocity;
                },
                set: function (value) {
                    this.velocity = value;
                }
            }
        },
        alias: ["compare", ["System$Collections$Generic$IComparer$1$MidiSheetMusic$MidiNote$compare", "System$Collections$Generic$IComparer$1$compare"]],
        ctors: {
            ctor: function (id, starttime, channel, notenumber, duration, velocity) {
                this.$initialize();
                this.id = id;
                this.starttime = starttime;
                this.channel = channel;
                this.notenumber = notenumber;
                this.duration = duration;
                this.velocity = velocity;
            }
        },
        methods: {
            NoteOff: function (endtime) {
                this.duration = (endtime - this.starttime) | 0;
            },
            compare: function (x, y) {
                if (x.StartTime === y.StartTime) {
                    return ((x.Number - y.Number) | 0);
                } else {
                    return ((x.StartTime - y.StartTime) | 0);
                }
            },
            Clone: function () {
                return new MidiSheetMusic.MidiNote(this.id, this.starttime, this.channel, this.notenumber, this.duration, this.velocity);
            },
            toString: function () {
                var scale = System.Array.init([
                    "A", 
                    "A#", 
                    "B", 
                    "C", 
                    "C#", 
                    "D", 
                    "D#", 
                    "E", 
                    "F", 
                    "F#", 
                    "G", 
                    "G#"
                ], System.String);
                return System.String.format("MidiNote channel={0} number={1} {2} start={3} duration={4}", Bridge.box(this.channel, System.Int32), Bridge.box(this.notenumber, System.Int32), scale[System.Array.index((((this.notenumber + 3) | 0)) % 12, scale)], Bridge.box(this.starttime, System.Int32), Bridge.box(this.duration, System.Int32));

            }
        }
    });

    Bridge.define("MidiSheetMusic.MidiOptions", {
        statics: {
            fields: {
                NoteNameNone: 0,
                NoteNameLetter: 0,
                NoteNameFixedDoReMi: 0,
                NoteNameMovableDoReMi: 0,
                NoteNameFixedNumber: 0,
                NoteNameMovableNumber: 0
            },
            ctors: {
                init: function () {
                    this.NoteNameNone = 0;
                    this.NoteNameLetter = 1;
                    this.NoteNameFixedDoReMi = 2;
                    this.NoteNameMovableDoReMi = 3;
                    this.NoteNameFixedNumber = 4;
                    this.NoteNameMovableNumber = 5;
                }
            },
            methods: {
                Join$1: function (values) {
                    var result = new System.Text.StringBuilder();
                    for (var i = 0; i < values.length; i = (i + 1) | 0) {
                        if (i > 0) {
                            result.append(",");
                        }
                        result.append(System.Boolean.toString(values[System.Array.index(i, values)]));
                    }
                    return result.toString();
                },
                Join$2: function (values) {
                    var result = new System.Text.StringBuilder();
                    for (var i = 0; i < values.length; i = (i + 1) | 0) {
                        if (i > 0) {
                            result.append(",");
                        }
                        result.append(values[System.Array.index(i, values)].toString());
                    }
                    return result.toString();
                },
                Join: function (values) {
                    var result = new System.Text.StringBuilder();
                    for (var i = 0; i < values.length; i = (i + 1) | 0) {
                        if (i > 0) {
                            result.append(",");
                        }
                        result.append(MidiSheetMusic.MidiOptions.ColorToString(values[System.Array.index(i, values)]));
                    }
                    return result.toString();
                },
                ColorToString: function (c) {
                    return "" + c.R + " " + c.G + " " + c.B;
                }
            }
        },
        fields: {
            filename: null,
            title: null,
            tracks: null,
            scrollVert: false,
            largeNoteSize: false,
            twoStaffs: false,
            showNoteLetters: 0,
            showLyrics: false,
            showMeasures: false,
            shifttime: 0,
            transpose: 0,
            key: 0,
            time: null,
            combineInterval: 0,
            colors: null,
            shadeColor: null,
            shade2Color: null,
            mute: null,
            tempo: 0,
            pauseTime: 0,
            instruments: null,
            useDefaultInstruments: false,
            playMeasuresInLoop: false,
            playMeasuresInLoopStart: 0,
            playMeasuresInLoopEnd: 0
        },
        ctors: {
            ctor: function () {
                this.$initialize();
            },
            $ctor1: function (midifile) {
                this.$initialize();
                this.filename = midifile.FileName;
                this.title = MidiSheetMusic.Path.GetFileName(midifile.FileName);
                var numtracks = midifile.Tracks.Count;
                this.tracks = System.Array.init(numtracks, false, System.Boolean);
                this.mute = System.Array.init(numtracks, false, System.Boolean);
                this.instruments = System.Array.init(numtracks, 0, System.Int32);
                for (var i = 0; i < this.tracks.length; i = (i + 1) | 0) {
                    this.tracks[System.Array.index(i, this.tracks)] = true;
                    this.mute[System.Array.index(i, this.mute)] = false;
                    this.instruments[System.Array.index(i, this.instruments)] = midifile.Tracks.getItem(i).Instrument;
                    if (Bridge.referenceEquals(midifile.Tracks.getItem(i).InstrumentName, "Percussion")) {
                        this.tracks[System.Array.index(i, this.tracks)] = false;
                        this.mute[System.Array.index(i, this.mute)] = true;
                    }
                }
                this.useDefaultInstruments = true;
                this.scrollVert = true;
                this.largeNoteSize = false;
                if (this.tracks.length === 1) {
                    this.twoStaffs = true;
                } else {
                    this.twoStaffs = false;
                }
                this.showNoteLetters = MidiSheetMusic.MidiOptions.NoteNameNone;
                this.showLyrics = true;
                this.showMeasures = false;
                this.shifttime = 0;
                this.transpose = 0;
                this.key = -1;
                this.time = midifile.Time;
                this.colors = null;
                this.shadeColor = MidiSheetMusic.Color.FromArgb(100, 53, 123, 255);
                this.shade2Color = MidiSheetMusic.Color.FromRgb(80, 100, 250);
                this.combineInterval = 40;
                this.tempo = midifile.Time.Tempo;
                this.pauseTime = 0;
                this.playMeasuresInLoop = false;
                this.playMeasuresInLoopStart = 0;
                this.playMeasuresInLoopEnd = (Bridge.Int.div(midifile.EndTime(), midifile.Time.Measure)) | 0;
            }
        },
        methods: {
            Merge: function (saved) {
                if (saved.tracks != null && saved.tracks.length === this.tracks.length) {
                    for (var i = 0; i < this.tracks.length; i = (i + 1) | 0) {
                        this.tracks[System.Array.index(i, this.tracks)] = saved.tracks[System.Array.index(i, saved.tracks)];
                    }
                }
                if (saved.mute != null && saved.mute.length === this.mute.length) {
                    for (var i1 = 0; i1 < this.mute.length; i1 = (i1 + 1) | 0) {
                        this.mute[System.Array.index(i1, this.mute)] = saved.mute[System.Array.index(i1, saved.mute)];
                    }
                }
                if (saved.instruments != null && saved.instruments.length === this.instruments.length) {
                    for (var i2 = 0; i2 < this.instruments.length; i2 = (i2 + 1) | 0) {
                        this.instruments[System.Array.index(i2, this.instruments)] = saved.instruments[System.Array.index(i2, saved.instruments)];
                    }
                }
                if (saved.time != null) {
                    this.time = new MidiSheetMusic.TimeSignature(saved.time.Numerator, saved.time.Denominator, saved.time.Quarter, saved.time.Tempo);
                }
                this.useDefaultInstruments = saved.useDefaultInstruments;
                this.scrollVert = saved.scrollVert;
                this.largeNoteSize = saved.largeNoteSize;
                this.showLyrics = saved.showLyrics;
                this.twoStaffs = saved.twoStaffs;
                this.showNoteLetters = saved.showNoteLetters;
                this.transpose = saved.transpose;
                this.key = saved.key;
                this.combineInterval = saved.combineInterval;
                if (!Bridge.referenceEquals(saved.shadeColor, MidiSheetMusic.Color.White)) {
                    this.shadeColor = saved.shadeColor;
                }
                if (!Bridge.referenceEquals(saved.shade2Color, MidiSheetMusic.Color.White)) {
                    this.shade2Color = saved.shade2Color;
                }
                if (saved.colors != null) {
                    this.colors = saved.colors;
                }
                this.showMeasures = saved.showMeasures;
                this.playMeasuresInLoop = saved.playMeasuresInLoop;
                this.playMeasuresInLoopStart = saved.playMeasuresInLoopStart;
                this.playMeasuresInLoopEnd = saved.playMeasuresInLoopEnd;
            }
        }
    });

    Bridge.define("MidiSheetMusic.MidiTrack", {
        statics: {
            fields: {
                noteIdCounter: 0
            },
            ctors: {
                init: function () {
                    this.noteIdCounter = 0;
                }
            }
        },
        fields: {
            tracknum: 0,
            notes: null,
            instrument: 0,
            lyrics: null
        },
        props: {
            Number: {
                get: function () {
                    return this.tracknum;
                }
            },
            Notes: {
                get: function () {
                    return this.notes;
                }
            },
            Instrument: {
                get: function () {
                    return this.instrument;
                },
                set: function (value) {
                    this.instrument = value;
                }
            },
            InstrumentName: {
                get: function () {
                    if (this.instrument >= 0 && this.instrument <= 128) {
                        return MidiSheetMusic.MidiFile.Instruments[System.Array.index(this.instrument, MidiSheetMusic.MidiFile.Instruments)];
                    } else {
                        return "";
                    }
                }
            },
            Lyrics: {
                get: function () {
                    return this.lyrics;
                },
                set: function (value) {
                    this.lyrics = value;
                }
            }
        },
        ctors: {
            $ctor1: function (tracknum) {
                this.$initialize();
                this.tracknum = tracknum;
                this.notes = new (System.Collections.Generic.List$1(MidiSheetMusic.MidiNote)).$ctor2(20);
                this.instrument = 0;
            },
            ctor: function (events, tracknum) {
                var $t, $t1;
                this.$initialize();
                this.tracknum = tracknum;
                this.notes = new (System.Collections.Generic.List$1(MidiSheetMusic.MidiNote)).$ctor2(events.Count);
                this.instrument = 0;

                $t = Bridge.getEnumerator(events);
                try {
                    while ($t.moveNext()) {
                        var mevent = $t.Current;
                        if (mevent.EventFlag === MidiSheetMusic.MidiFile.EventNoteOn && mevent.Velocity > 0) {
                            var note = new MidiSheetMusic.MidiNote(Bridge.identity(MidiSheetMusic.MidiTrack.noteIdCounter, ($t1 = (MidiSheetMusic.MidiTrack.noteIdCounter + 1) | 0, MidiSheetMusic.MidiTrack.noteIdCounter = $t1, $t1)), mevent.StartTime, mevent.Channel, mevent.Notenumber, 0, mevent.Velocity);
                            this.AddNote(note);
                        } else if (mevent.EventFlag === MidiSheetMusic.MidiFile.EventNoteOn && mevent.Velocity === 0) {
                            this.NoteOff(mevent.Channel, mevent.Notenumber, mevent.StartTime);
                        } else if (mevent.EventFlag === MidiSheetMusic.MidiFile.EventNoteOff) {
                            this.NoteOff(mevent.Channel, mevent.Notenumber, mevent.StartTime);
                        } else if (mevent.EventFlag === MidiSheetMusic.MidiFile.EventProgramChange) {
                            this.instrument = mevent.Instrument;
                        } else if (mevent.Metaevent === MidiSheetMusic.MidiFile.MetaEventLyric) {
                            this.AddLyric(mevent);
                        }
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }if (this.notes.Count > 0 && this.notes.getItem(0).Channel === 9) {
                    this.instrument = 128; /* Percussion */
                }
                var lyriccount = 0;
                if (this.lyrics != null) {
                    lyriccount = this.lyrics.Count;
                }
            }
        },
        methods: {
            AddNote: function (m) {
                this.notes.add(m);
            },
            NoteOff: function (channel, notenumber, endtime) {
                for (var i = (this.notes.Count - 1) | 0; i >= 0; i = (i - 1) | 0) {
                    var note = this.notes.getItem(i);
                    if (note.Channel === channel && note.Number === notenumber && note.Duration === 0) {
                        note.NoteOff(endtime);
                        return;
                    }
                }
            },
            AddLyric: function (mevent) {
                if (this.lyrics == null) {
                    this.lyrics = new (System.Collections.Generic.List$1(MidiSheetMusic.MidiEvent)).ctor();
                }
                this.lyrics.add(mevent);
            },
            Clone: function () {
                var $t, $t1;
                var track = new MidiSheetMusic.MidiTrack.$ctor1(this.Number);
                track.instrument = this.instrument;
                $t = Bridge.getEnumerator(this.notes);
                try {
                    while ($t.moveNext()) {
                        var note = $t.Current;
                        track.notes.add(note.Clone());
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }if (this.lyrics != null) {
                    track.lyrics = new (System.Collections.Generic.List$1(MidiSheetMusic.MidiEvent)).ctor();
                    $t1 = Bridge.getEnumerator(this.lyrics);
                    try {
                        while ($t1.moveNext()) {
                            var ev = $t1.Current;
                            track.lyrics.add(ev);
                        }
                    } finally {
                        if (Bridge.is($t1, System.IDisposable)) {
                            $t1.System$IDisposable$dispose();
                        }
                    }}
                return track;
            },
            toString: function () {
                var $t;
                var result = "Track number=" + this.tracknum + " instrument=" + this.instrument + "\n";
                $t = Bridge.getEnumerator(this.notes);
                try {
                    while ($t.moveNext()) {
                        var n = $t.Current;
                        result = System.String.concat(result, n) + "\n";
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }result = (result || "") + "End Track\n";
                return result;
            }
        }
    });

    Bridge.define("MidiSheetMusic.NoteData", {
        fields: {
            number: 0,
            whitenote: null,
            duration: 0,
            leftside: false,
            accid: 0
        }
    });

    Bridge.define("MidiSheetMusic.NoteDuration", {
        $kind: "enum",
        statics: {
            fields: {
                ThirtySecond: 0,
                Sixteenth: 1,
                Triplet: 2,
                Eighth: 3,
                DottedEighth: 4,
                Quarter: 5,
                DottedQuarter: 6,
                Half: 7,
                DottedHalf: 8,
                Whole: 9
            }
        }
    });

    Bridge.define("MidiSheetMusic.NoteScale", {
        statics: {
            fields: {
                A: 0,
                Asharp: 0,
                Bflat: 0,
                B: 0,
                C: 0,
                Csharp: 0,
                Dflat: 0,
                D: 0,
                Dsharp: 0,
                Eflat: 0,
                E: 0,
                F: 0,
                Fsharp: 0,
                Gflat: 0,
                G: 0,
                Gsharp: 0,
                Aflat: 0
            },
            ctors: {
                init: function () {
                    this.A = 0;
                    this.Asharp = 1;
                    this.Bflat = 1;
                    this.B = 2;
                    this.C = 3;
                    this.Csharp = 4;
                    this.Dflat = 4;
                    this.D = 5;
                    this.Dsharp = 6;
                    this.Eflat = 6;
                    this.E = 7;
                    this.F = 8;
                    this.Fsharp = 9;
                    this.Gflat = 9;
                    this.G = 10;
                    this.Gsharp = 11;
                    this.Aflat = 11;
                }
            },
            methods: {
                ToNumber: function (notescale, octave) {
                    return ((((9 + notescale) | 0) + Bridge.Int.mul(octave, 12)) | 0);
                },
                FromNumber: function (number) {
                    return (((number + 3) | 0)) % 12;
                },
                IsBlackKey: function (notescale) {
                    if (notescale === MidiSheetMusic.NoteScale.Asharp || notescale === MidiSheetMusic.NoteScale.Csharp || notescale === MidiSheetMusic.NoteScale.Dsharp || notescale === MidiSheetMusic.NoteScale.Fsharp || notescale === MidiSheetMusic.NoteScale.Gsharp) {

                        return true;
                    } else {
                        return false;
                    }
                }
            }
        }
    });

    Bridge.define("MidiSheetMusic.PaintEventArgs", {
        fields: {
            ClipRectangle: null
        },
        methods: {
            Graphics: function () {
                return new MidiSheetMusic.Graphics("main");
            }
        }
    });

    Bridge.define("MidiSheetMusic.Panel", {
        fields: {
            autoScrollPosition: null,
            Width: 0,
            Height: 0
        },
        props: {
            AutoScrollPosition: {
                get: function () {
                    return this.autoScrollPosition;
                },
                set: function (value) {
                    this.autoScrollPosition = value;
                }
            }
        },
        ctors: {
            init: function () {
                this.autoScrollPosition = new MidiSheetMusic.Point(0, 0);
            }
        }
    });

    Bridge.define("MidiSheetMusic.Path", {
        statics: {
            methods: {
                GetFileName: function (filename) {
                    return null;
                }
            }
        }
    });

    Bridge.define("MidiSheetMusic.Pen", {
        fields: {
            Color: null,
            Width: 0,
            EndCap: 0
        },
        ctors: {
            ctor: function (color, width) {
                this.$initialize();
                this.Color = color;
                this.Width = width;
            }
        }
    });

    Bridge.define("MidiSheetMusic.Point", {
        fields: {
            X: 0,
            Y: 0
        },
        ctors: {
            ctor: function (x, y) {
                this.$initialize();
                this.X = x;
                this.Y = y;
            }
        }
    });

    Bridge.define("MidiSheetMusic.Rectangle", {
        fields: {
            X: 0,
            Y: 0,
            Width: 0,
            Height: 0
        },
        ctors: {
            ctor: function (x, y, width, height) {
                this.$initialize();
                this.X = x;
                this.Y = y;
                this.Width = width;
                this.Height = height;
            }
        }
    });

    Bridge.define("MidiSheetMusic.RiffFileInfo", {
        fields: {
            Header: null,
            FileType: null,
            FileSize: 0
        }
    });

    Bridge.define("MidiSheetMusic.RiffParser", {
        statics: {
            fields: {
                WordSize: 0,
                Riff4CC: null,
                RifX4CC: null,
                List4CC: null
            },
            ctors: {
                init: function () {
                    this.WordSize = 4;
                    this.Riff4CC = "RIFF";
                    this.RifX4CC = "RIFX";
                    this.List4CC = "LIST";
                }
            },
            methods: {
                ReadHeader: function (data) {
                    var $t;
                    if (data.length < 12) {
                        throw new MidiSheetMusic.RiffParserException("Read failed. File too small?");
                    }

                    var header = { };
                    if (!MidiSheetMusic.RiffParser.IsRiffFile(data, header)) {
                        throw new MidiSheetMusic.RiffParserException("Read failed. No RIFF header");
                    }
                    return ($t = new MidiSheetMusic.RiffFileInfo(), $t.Header = header.v, $t.FileSize = System.BitConverter.toInt32(data, MidiSheetMusic.RiffParser.WordSize), $t.FileType = System.Text.Encoding.ASCII.GetString$1(data, 8, MidiSheetMusic.RiffParser.WordSize), $t);
                },
                ParseByteArray: function (data) {
                    var riffParser = new MidiSheetMusic.RiffParser();
                    riffParser.Init(data);
                    return riffParser;
                },
                IsRiffFile: function (data, header) {
                    var test = System.Text.Encoding.ASCII.GetString$1(data, 0, MidiSheetMusic.RiffParser.WordSize);
                    if (Bridge.referenceEquals(test, MidiSheetMusic.RiffParser.Riff4CC) || Bridge.referenceEquals(test, MidiSheetMusic.RiffParser.RifX4CC)) {
                        header.v = test;
                        return true;
                    }
                    header.v = null;
                    return false;
                }
            }
        },
        fields: {
            data: null,
            position: 0,
            FileInfo: null
        },
        ctors: {
            ctor: function () {
                this.$initialize();
            }
        },
        methods: {
            Init: function (data) {
                this.data = data;
                this.FileInfo = MidiSheetMusic.RiffParser.ReadHeader(data);
                this.position = 12;
            },
            Read: function (processElement) {
                if (((this.data.length - this.position) | 0) < 8) {
                    return false;
                }

                var type = System.Text.Encoding.ASCII.GetString$1(this.data, this.position, MidiSheetMusic.RiffParser.WordSize);
                this.position = (this.position + MidiSheetMusic.RiffParser.WordSize) | 0;
                var size = System.BitConverter.toInt32(this.data, this.position);
                this.position = (this.position + MidiSheetMusic.RiffParser.WordSize) | 0;

                if (((this.data.length - this.position) | 0) < size) {
                    throw new MidiSheetMusic.RiffParserException((System.String.format("Element size mismatch for element {0} ", [type]) || "") + (System.String.format("need {0} but have only {1}", Bridge.box(size, System.Int32), Bridge.box(((this.FileInfo.FileSize - this.position) | 0), System.Int32)) || ""));
                }

                if (Bridge.referenceEquals(type, MidiSheetMusic.RiffParser.List4CC)) {
                    var listType = System.Text.Encoding.ASCII.GetString$1(this.data, this.position, MidiSheetMusic.RiffParser.WordSize);
                    processElement(listType, true, new MidiSheetMusic.BoundedByteArray(((this.position + MidiSheetMusic.RiffParser.WordSize) | 0), size, this.data));
                    this.position = (this.position + size) | 0;
                } else {
                    var paddedSize = size;
                    if ((size & 1) !== 0) {
                        paddedSize = (paddedSize + 1) | 0;
                    }
                    processElement(type, false, new MidiSheetMusic.BoundedByteArray(this.position, size, this.data));
                    this.position = (this.position + paddedSize) | 0;
                }
                return true;
            }
        }
    });

    Bridge.define("MidiSheetMusic.RiffParserException", {
        inherits: [System.Exception],
        ctors: {
            ctor: function (message) {
                this.$initialize();
                System.Exception.ctor.call(this, message);

            }
        }
    });

    Bridge.define("MidiSheetMusic.SmoothingMode", {
        $kind: "enum",
        statics: {
            fields: {
                None: 0,
                AntiAlias: 1
            }
        }
    });

    Bridge.define("MidiSheetMusic.Staff", {
        statics: {
            methods: {
                InsideClipping: function (clip, xpos, s) {
                    return (xpos <= ((((clip.X + clip.Width) | 0) + 50) | 0)) && (((((xpos + s.Width) | 0) + 50) | 0) >= clip.X);
                }
            }
        },
        fields: {
            symbols: null,
            lyrics: null,
            ytop: 0,
            clefsym: null,
            keys: null,
            showMeasures: false,
            keysigWidth: 0,
            width: 0,
            height: 0,
            tracknum: 0,
            totaltracks: 0,
            starttime: 0,
            endtime: 0,
            measureLength: 0
        },
        props: {
            Width: {
                get: function () {
                    return this.width;
                }
            },
            Height: {
                get: function () {
                    return this.height;
                }
            },
            Track: {
                get: function () {
                    return this.tracknum;
                }
            },
            StartTime: {
                get: function () {
                    return this.starttime;
                }
            },
            EndTime: {
                get: function () {
                    return this.endtime;
                },
                set: function (value) {
                    this.endtime = value;
                }
            }
        },
        ctors: {
            ctor: function (symbols, key, options, tracknum, totaltracks) {
                this.$initialize();

                this.keysigWidth = MidiSheetMusic.SheetMusic.KeySignatureWidth(key);
                this.tracknum = tracknum;
                this.totaltracks = totaltracks;
                this.showMeasures = (options.showMeasures && tracknum === 0);
                this.measureLength = options.time.Measure;
                var clef = this.FindClef(symbols);

                this.clefsym = new MidiSheetMusic.ClefSymbol(clef, 0, false);
                this.keys = key.GetSymbols(clef);
                this.symbols = symbols;
                this.CalculateWidth(options.scrollVert);
                this.CalculateHeight();
                this.CalculateStartEndTime();
                this.FullJustify();
            }
        },
        methods: {
            FindClef: function (list) {
                var $t;
                $t = Bridge.getEnumerator(list);
                try {
                    while ($t.moveNext()) {
                        var m = $t.Current;
                        if (Bridge.is(m, MidiSheetMusic.ChordSymbol)) {
                            var c = Bridge.cast(m, MidiSheetMusic.ChordSymbol);
                            return c.Clef;
                        }
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }return MidiSheetMusic.Clef.Treble;
            },
            CalculateHeight: function () {
                var $t;
                var above = 0;
                var below = 0;

                $t = Bridge.getEnumerator(this.symbols);
                try {
                    while ($t.moveNext()) {
                        var s = $t.Current;
                        above = Math.max(above, s.AboveStaff);
                        below = Math.max(below, s.BelowStaff);
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }above = Math.max(above, this.clefsym.AboveStaff);
                below = Math.max(below, this.clefsym.BelowStaff);
                if (this.showMeasures) {
                    above = Math.max(above, Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 3));
                }
                this.ytop = (above + MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                this.height = (((Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 5) + this.ytop) | 0) + below) | 0;
                if (this.lyrics != null) {
                    this.height = (this.height + 12) | 0;
                }

                /* Add some extra vertical space between the last track
                  and first track.
                */
                if (this.tracknum === ((this.totaltracks - 1) | 0)) {
                    this.height = (this.height + (Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 3))) | 0;
                }
            },
            CalculateWidth: function (scrollVert) {
                var $t;
                if (scrollVert) {
                    this.width = MidiSheetMusic.SheetMusic.PageWidth;
                    return;
                }
                this.width = this.keysigWidth;
                $t = Bridge.getEnumerator(this.symbols);
                try {
                    while ($t.moveNext()) {
                        var s = $t.Current;
                        this.width = (this.width + s.Width) | 0;
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }},
            CalculateStartEndTime: function () {
                var $t;
                this.starttime = (this.endtime = 0);
                if (this.symbols.Count === 0) {
                    return;
                }
                this.starttime = this.symbols.getItem(0).StartTime;
                $t = Bridge.getEnumerator(this.symbols);
                try {
                    while ($t.moveNext()) {
                        var m = $t.Current;
                        if (this.endtime < m.StartTime) {
                            this.endtime = m.StartTime;
                        }
                        if (Bridge.is(m, MidiSheetMusic.ChordSymbol)) {
                            var c = Bridge.cast(m, MidiSheetMusic.ChordSymbol);
                            if (this.endtime < c.EndTime) {
                                this.endtime = c.EndTime;
                            }
                        }
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }},
            FullJustify: function () {
                if (this.width !== MidiSheetMusic.SheetMusic.PageWidth) {
                    return;
                }

                var totalwidth = this.keysigWidth;
                var totalsymbols = 0;
                var i = 0;

                while (i < this.symbols.Count) {
                    var start = this.symbols.getItem(i).StartTime;
                    totalsymbols = (totalsymbols + 1) | 0;
                    totalwidth = (totalwidth + this.symbols.getItem(i).Width) | 0;
                    i = (i + 1) | 0;
                    while (i < this.symbols.Count && this.symbols.getItem(i).StartTime === start) {
                        totalwidth = (totalwidth + this.symbols.getItem(i).Width) | 0;
                        i = (i + 1) | 0;
                    }
                }

                var extrawidth = (Bridge.Int.div((((((MidiSheetMusic.SheetMusic.PageWidth - totalwidth) | 0) - 1) | 0)), totalsymbols)) | 0;
                if (extrawidth > Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2)) {
                    extrawidth = Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2);
                }
                i = 0;
                while (i < this.symbols.Count) {
                    var start1 = this.symbols.getItem(i).StartTime;
                    this.symbols.getItem(i).Width = (this.symbols.getItem(i).Width + extrawidth) | 0;
                    i = (i + 1) | 0;
                    while (i < this.symbols.Count && this.symbols.getItem(i).StartTime === start1) {
                        i = (i + 1) | 0;
                    }
                }
            },
            AddLyrics: function (tracklyrics) {
                var $t;
                if (tracklyrics == null) {
                    return;
                }
                this.lyrics = new (System.Collections.Generic.List$1(MidiSheetMusic.LyricSymbol)).ctor();
                var xpos = 0;
                var symbolindex = 0;
                $t = Bridge.getEnumerator(tracklyrics);
                try {
                    while ($t.moveNext()) {
                        var lyric = $t.Current;
                        if (lyric.StartTime < this.starttime) {
                            continue;
                        }
                        if (lyric.StartTime > this.endtime) {
                            break;
                        }
                        /* Get the x-position of this lyric */
                        while (symbolindex < this.symbols.Count && this.symbols.getItem(symbolindex).StartTime < lyric.StartTime) {
                            xpos = (xpos + this.symbols.getItem(symbolindex).Width) | 0;
                            symbolindex = (symbolindex + 1) | 0;
                        }
                        lyric.X = xpos;
                        if (symbolindex < this.symbols.Count && (Bridge.is(this.symbols.getItem(symbolindex), MidiSheetMusic.BarSymbol))) {
                            lyric.X = (lyric.X + MidiSheetMusic.SheetMusic.NoteWidth) | 0;
                        }
                        this.lyrics.add(lyric);
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }if (this.lyrics.Count === 0) {
                    this.lyrics = null;
                }
            },
            DrawLyrics: function (g, pen) {
                var $t;
                /* Skip the left side Clef symbol and key signature */
                var xpos = this.keysigWidth;
                var ypos = (this.height - 12) | 0;

                $t = Bridge.getEnumerator(this.lyrics);
                try {
                    while ($t.moveNext()) {
                        var lyric = $t.Current;
                        g.DrawString(lyric.Text, MidiSheetMusic.SheetMusic.LetterFont, MidiSheetMusic.Brushes.Black, ((xpos + lyric.X) | 0), ypos);
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }},
            DrawMeasureNumbers: function (g, pen) {
                var $t;

                /* Skip the left side Clef symbol and key signature */
                var xpos = this.keysigWidth;
                var ypos = (this.ytop - Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 3)) | 0;

                $t = Bridge.getEnumerator(this.symbols);
                try {
                    while ($t.moveNext()) {
                        var s = $t.Current;
                        if (Bridge.is(s, MidiSheetMusic.BarSymbol)) {
                            var measure = (1 + ((Bridge.Int.div(s.StartTime, this.measureLength)) | 0)) | 0;
                            g.DrawString("" + measure, MidiSheetMusic.SheetMusic.LetterFont, MidiSheetMusic.Brushes.Black, ((xpos + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteWidth, 2)) | 0)) | 0), ypos);
                        }
                        xpos = (xpos + s.Width) | 0;
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }},
            DrawHorizLines: function (g, pen) {
                var line = 1;
                var y = (this.ytop - MidiSheetMusic.SheetMusic.LineWidth) | 0;
                pen.Width = 1;
                for (line = 1; line <= 5; line = (line + 1) | 0) {
                    g.DrawLine(pen, MidiSheetMusic.SheetMusic.LeftMargin, y, ((this.width - 1) | 0), y);
                    y = (y + (((MidiSheetMusic.SheetMusic.LineWidth + MidiSheetMusic.SheetMusic.LineSpace) | 0))) | 0;
                }
                pen.Color = MidiSheetMusic.Color.Black;

            },
            DrawEndLines: function (g, pen) {
                pen.Width = 1;

                /* Draw the vertical lines from 0 to the height of this staff,
                  including the space above and below the staff, with two exceptions:
                  - If this is the first track, don't start above the staff.
                    Start exactly at the top of the staff (ytop - LineWidth)
                  - If this is the last track, don't end below the staff.
                    End exactly at the bottom of the staff.
                */
                var ystart, yend;
                if (this.tracknum === 0) {
                    ystart = (this.ytop - MidiSheetMusic.SheetMusic.LineWidth) | 0;
                } else {
                    ystart = 0;
                }

                if (this.tracknum === (((this.totaltracks - 1) | 0))) {
                    yend = (this.ytop + Bridge.Int.mul(4, MidiSheetMusic.SheetMusic.NoteHeight)) | 0;
                } else {
                    yend = this.height;
                }

                g.DrawLine(pen, MidiSheetMusic.SheetMusic.LeftMargin, ystart, MidiSheetMusic.SheetMusic.LeftMargin, yend);

                g.DrawLine(pen, ((this.width - 1) | 0), ystart, ((this.width - 1) | 0), yend);

            },
            Draw: function (g, clip, pen, selectionStartPulse, selectionEndPulse, deselectedBrush) {
                var $t, $t1;
                /* Shade any deselected areas */
                this.ShadeSelectionBackground(g, clip, selectionStartPulse, selectionEndPulse, deselectedBrush);

                var xpos = 9;

                /* Draw the left side Clef symbol */
                g.TranslateTransform(xpos, 0);
                this.clefsym.Draw(g, pen, this.ytop);
                g.TranslateTransform(((-xpos) | 0), 0);
                xpos = (xpos + this.clefsym.Width) | 0;

                /* Draw the key signature */
                $t = Bridge.getEnumerator(this.keys);
                try {
                    while ($t.moveNext()) {
                        var a = $t.Current;
                        g.TranslateTransform(xpos, 0);
                        a.Draw(g, pen, this.ytop);
                        g.TranslateTransform(((-xpos) | 0), 0);
                        xpos = (xpos + a.Width) | 0;
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }
                /* Draw the actual notes, rests, bars.  Draw the symbols one 
                  after another, using the symbol width to determine the
                  x position of the next symbol.

                  For fast performance, only draw symbols that are in the clip area.
                */
                $t1 = Bridge.getEnumerator(this.symbols);
                try {
                    while ($t1.moveNext()) {
                        var s = $t1.Current;
                        if (MidiSheetMusic.Staff.InsideClipping(clip, xpos, s)) {
                            g.TranslateTransform(xpos, 0);
                            s.Draw(g, pen, this.ytop);
                            g.TranslateTransform(((-xpos) | 0), 0);
                        }
                        xpos = (xpos + s.Width) | 0;
                    }
                } finally {
                    if (Bridge.is($t1, System.IDisposable)) {
                        $t1.System$IDisposable$dispose();
                    }
                }this.DrawHorizLines(g, pen);
                this.DrawEndLines(g, pen);

                if (this.showMeasures) {
                    this.DrawMeasureNumbers(g, pen);
                }
                if (this.lyrics != null) {
                    this.DrawLyrics(g, pen);
                }

            },
            ShadeSelectionBackground: function (g, clip, selectionStartPulse, selectionEndPulse, deselectedBrush) {
                var $t;
                if (selectionEndPulse === 0) {
                    return;
                }

                var xpos = this.keysigWidth;
                var lastStateFill = false;
                $t = Bridge.getEnumerator(this.symbols);
                try {
                    while ($t.moveNext()) {
                        var s = $t.Current;
                        if (MidiSheetMusic.Staff.InsideClipping(clip, xpos, s) && (s.StartTime < selectionStartPulse || s.StartTime > selectionEndPulse)) {
                            g.TranslateTransform(((xpos - 2) | 0), -2);
                            g.FillRectangle(deselectedBrush, 0, 0, ((s.Width + 4) | 0), ((this.Height + 4) | 0));
                            g.TranslateTransform(((-(((xpos - 2) | 0))) | 0), 2);
                            lastStateFill = true;
                        } else {
                            lastStateFill = false;
                        }
                        xpos = (xpos + s.Width) | 0;
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }if (lastStateFill) {
                    //shade the rest of the staff if the previous symbol was shaded
                    g.TranslateTransform(((xpos - 2) | 0), -2);
                    g.FillRectangle(deselectedBrush, 0, 0, ((this.width - xpos) | 0), ((this.Height + 4) | 0));
                    g.TranslateTransform(((-(((xpos - 2) | 0))) | 0), 2);
                }
            },
            ShadeNotes: function (g, shadeBrush, pen, currentPulseTime, prevPulseTime, x_shade) {

                /* If there's nothing to unshade, or shade, return */
                if ((this.starttime > prevPulseTime || this.endtime < prevPulseTime) && (this.starttime > currentPulseTime || this.endtime < currentPulseTime)) {
                    return 0;
                }

                /* Skip the left side Clef symbol and key signature */
                var xpos = this.keysigWidth;

                var curr = null;

                /* Loop through the symbols. 
                  Unshade symbols where start <= prevPulseTime < end
                  Shade symbols where start <= currentPulseTime < end
                */
                var width = 0;
                for (var i = 0; i < this.symbols.Count; i = (i + 1) | 0) {
                    curr = this.symbols.getItem(i);
                    if (Bridge.is(curr, MidiSheetMusic.BarSymbol)) {
                        xpos = (xpos + curr.Width) | 0;
                        continue;
                    }

                    var start = curr.StartTime;
                    var end = 0;
                    if (((i + 2) | 0) < this.symbols.Count && Bridge.is(this.symbols.getItem(((i + 1) | 0)), MidiSheetMusic.BarSymbol)) {
                        end = this.symbols.getItem(((i + 2) | 0)).StartTime;
                    } else if (((i + 1) | 0) < this.symbols.Count) {
                        end = this.symbols.getItem(((i + 1) | 0)).StartTime;
                    } else {
                        end = this.endtime;
                    }


                    /* If we've past the previous and current times, we're done. */
                    if ((start > prevPulseTime) && (start > currentPulseTime)) {
                        if (x_shade.v === 0) {
                            x_shade.v = xpos;
                        }

                        return width;
                    }
                    /* If shaded notes are the same, we're done */
                    if ((start <= currentPulseTime) && (currentPulseTime < end) && (start <= prevPulseTime) && (prevPulseTime < end)) {

                        x_shade.v = xpos;
                        return width;
                    }

                    /* If symbol is in the previous time, draw a white background */
                    if ((start <= prevPulseTime) && (prevPulseTime < end)) {
                        g.TranslateTransform(((xpos - 2) | 0), -2);
                        g.ClearRectangle(0, 0, ((curr.Width + 4) | 0), ((this.Height + 4) | 0));
                        g.TranslateTransform(((-(((xpos - 2) | 0))) | 0), 2);
                    }

                    /* If symbol is in the current time, draw a shaded background */
                    if ((start <= currentPulseTime) && (currentPulseTime < end)) {
                        width = (width + curr.Width) | 0;
                        x_shade.v = xpos;
                        g.TranslateTransform(xpos, 0);
                        g.FillRectangle(shadeBrush, 0, 0, curr.Width, this.Height);
                        g.TranslateTransform(((-xpos) | 0), 0);
                    }

                    xpos = (xpos + curr.Width) | 0;
                }
                return width;
            },
            PulseTimeForPoint: function (point) {
                var $t;

                var xpos = this.keysigWidth;
                var pulseTime = this.starttime;
                $t = Bridge.getEnumerator(this.symbols);
                try {
                    while ($t.moveNext()) {
                        var sym = $t.Current;
                        pulseTime = sym.StartTime;
                        if (point.X <= ((xpos + sym.Width) | 0)) {
                            return pulseTime;
                        }
                        xpos = (xpos + sym.Width) | 0;
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }return pulseTime;
            },
            toString: function () {
                var $t, $t1, $t2;
                var result = "Staff clef=" + (this.clefsym.toString() || "") + "\n";
                result = (result || "") + "  Keys:\n";
                $t = Bridge.getEnumerator(this.keys);
                try {
                    while ($t.moveNext()) {
                        var a = $t.Current;
                        result = (result || "") + (("    " + (a.toString() || "") + "\n") || "");
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }result = (result || "") + "  Symbols:\n";
                $t1 = Bridge.getEnumerator(this.keys);
                try {
                    while ($t1.moveNext()) {
                        var s = Bridge.cast($t1.Current, MidiSheetMusic.MusicSymbol);
                        result = (result || "") + (("    " + (s.toString() || "") + "\n") || "");
                    }
                } finally {
                    if (Bridge.is($t1, System.IDisposable)) {
                        $t1.System$IDisposable$dispose();
                    }
                }$t2 = Bridge.getEnumerator(this.symbols);
                try {
                    while ($t2.moveNext()) {
                        var m = $t2.Current;
                        result = (result || "") + (("    " + (m.toString() || "") + "\n") || "");
                    }
                } finally {
                    if (Bridge.is($t2, System.IDisposable)) {
                        $t2.System$IDisposable$dispose();
                    }
                }result = (result || "") + "End Staff\n";
                return result;
            }
        }
    });

    Bridge.define("MidiSheetMusic.Stem", {
        statics: {
            fields: {
                Up: 0,
                Down: 0,
                LeftSide: 0,
                RightSide: 0
            },
            ctors: {
                init: function () {
                    this.Up = 1;
                    this.Down = 2;
                    this.LeftSide = 1;
                    this.RightSide = 2;
                }
            }
        },
        fields: {
            duration: 0,
            direction: 0,
            top: null,
            bottom: null,
            end: null,
            notesoverlap: false,
            side: 0,
            pair: null,
            width_to_pair: 0,
            receiver_in_pair: false
        },
        props: {
            Direction: {
                get: function () {
                    return this.direction;
                },
                set: function (value) {
                    this.ChangeDirection(value);
                }
            },
            Duration: {
                get: function () {
                    return this.duration;
                }
            },
            Top: {
                get: function () {
                    return this.top;
                }
            },
            Bottom: {
                get: function () {
                    return this.bottom;
                }
            },
            End: {
                get: function () {
                    return this.end;
                },
                set: function (value) {
                    this.end = value;
                }
            },
            Receiver: {
                get: function () {
                    return this.receiver_in_pair;
                },
                set: function (value) {
                    this.receiver_in_pair = value;
                }
            },
            isBeam: {
                get: function () {
                    return this.receiver_in_pair || (this.pair != null);
                }
            }
        },
        ctors: {
            ctor: function (bottom, top, duration, direction, overlap) {
                this.$initialize();

                this.top = top;
                this.bottom = bottom;
                this.duration = duration;
                this.direction = direction;
                this.notesoverlap = overlap;
                if (direction === MidiSheetMusic.Stem.Up || this.notesoverlap) {
                    this.side = MidiSheetMusic.Stem.RightSide;
                } else {
                    this.side = MidiSheetMusic.Stem.LeftSide;
                }
                this.end = this.CalculateEnd();
                this.pair = null;
                this.width_to_pair = 0;
                this.receiver_in_pair = false;
            }
        },
        methods: {
            CalculateEnd: function () {
                if (this.direction === MidiSheetMusic.Stem.Up) {
                    var w = this.top;
                    w = w.Add(6);
                    if (this.duration === MidiSheetMusic.NoteDuration.Sixteenth) {
                        w = w.Add(2);
                    } else if (this.duration === MidiSheetMusic.NoteDuration.ThirtySecond) {
                        w = w.Add(4);
                    }
                    return w;
                } else if (this.direction === MidiSheetMusic.Stem.Down) {
                    var w1 = this.bottom;
                    w1 = w1.Add(-6);
                    if (this.duration === MidiSheetMusic.NoteDuration.Sixteenth) {
                        w1 = w1.Add(-2);
                    } else if (this.duration === MidiSheetMusic.NoteDuration.ThirtySecond) {
                        w1 = w1.Add(-4);
                    }
                    return w1;
                } else {
                    return null; /* Shouldn't happen */
                }
            },
            ChangeDirection: function (newdirection) {
                this.direction = newdirection;
                if (this.direction === MidiSheetMusic.Stem.Up || this.notesoverlap) {
                    this.side = MidiSheetMusic.Stem.RightSide;
                } else {
                    this.side = MidiSheetMusic.Stem.LeftSide;
                }
                this.end = this.CalculateEnd();
            },
            SetPair: function (pair, width_to_pair) {
                this.pair = pair;
                this.width_to_pair = width_to_pair;
            },
            Draw: function (g, pen, ytop, topstaff) {
                if (this.duration === MidiSheetMusic.NoteDuration.Whole) {
                    return;
                }

                this.DrawVerticalLine(g, pen, ytop, topstaff);
                if (this.duration === MidiSheetMusic.NoteDuration.Quarter || this.duration === MidiSheetMusic.NoteDuration.DottedQuarter || this.duration === MidiSheetMusic.NoteDuration.Half || this.duration === MidiSheetMusic.NoteDuration.DottedHalf || this.receiver_in_pair) {

                    return;
                }

                if (this.pair != null) {
                    this.DrawHorizBarStem(g, pen, ytop, topstaff);
                } else {
                    this.DrawCurvyStem(g, pen, ytop, topstaff);
                }
            },
            DrawVerticalLine: function (g, pen, ytop, topstaff) {
                var xstart;
                if (this.side === MidiSheetMusic.Stem.LeftSide) {
                    xstart = (((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0) + 1) | 0;
                } else {
                    xstart = (((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0) + MidiSheetMusic.SheetMusic.NoteWidth) | 0;
                }

                if (this.direction === MidiSheetMusic.Stem.Up) {
                    var y1 = (((ytop + ((Bridge.Int.div(Bridge.Int.mul(topstaff.Dist(this.bottom), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0) + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 4)) | 0)) | 0;

                    var ystem = (ytop + ((Bridge.Int.div(Bridge.Int.mul(topstaff.Dist(this.end), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0;

                    g.DrawLine(pen, xstart, y1, xstart, ystem);
                } else if (this.direction === MidiSheetMusic.Stem.Down) {
                    var y11 = (((ytop + ((Bridge.Int.div(Bridge.Int.mul(topstaff.Dist(this.top), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0) + MidiSheetMusic.SheetMusic.NoteHeight) | 0;

                    if (this.side === MidiSheetMusic.Stem.LeftSide) {
                        y11 = (y11 - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 4)) | 0)) | 0;
                    } else {
                        y11 = (y11 - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0)) | 0;
                    }

                    var ystem1 = (((ytop + ((Bridge.Int.div(Bridge.Int.mul(topstaff.Dist(this.end), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0) + MidiSheetMusic.SheetMusic.NoteHeight) | 0;

                    g.DrawLine(pen, xstart, y11, xstart, ystem1);
                }
            },
            DrawCurvyStem: function (g, pen, ytop, topstaff) {

                pen.Width = 2;

                var xstart = 0;
                if (this.side === MidiSheetMusic.Stem.LeftSide) {
                    xstart = (((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0) + 1) | 0;
                } else {
                    xstart = (((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0) + MidiSheetMusic.SheetMusic.NoteWidth) | 0;
                }

                if (this.direction === MidiSheetMusic.Stem.Up) {
                    var ystem = (ytop + ((Bridge.Int.div(Bridge.Int.mul(topstaff.Dist(this.end), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0;


                    if (this.duration === MidiSheetMusic.NoteDuration.Eighth || this.duration === MidiSheetMusic.NoteDuration.DottedEighth || this.duration === MidiSheetMusic.NoteDuration.Triplet || this.duration === MidiSheetMusic.NoteDuration.Sixteenth || this.duration === MidiSheetMusic.NoteDuration.ThirtySecond) {

                        g.DrawBezier(pen, xstart, ystem, xstart, ((ystem + ((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.LineSpace), 2)) | 0)) | 0), ((xstart + Bridge.Int.mul(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0), ((ystem + Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0), ((xstart + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0), ((ystem + Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 3)) | 0));
                    }
                    ystem = (ystem + MidiSheetMusic.SheetMusic.NoteHeight) | 0;

                    if (this.duration === MidiSheetMusic.NoteDuration.Sixteenth || this.duration === MidiSheetMusic.NoteDuration.ThirtySecond) {

                        g.DrawBezier(pen, xstart, ystem, xstart, ((ystem + ((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.LineSpace), 2)) | 0)) | 0), ((xstart + Bridge.Int.mul(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0), ((ystem + Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0), ((xstart + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0), ((ystem + Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 3)) | 0));
                    }

                    ystem = (ystem + MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                    if (this.duration === MidiSheetMusic.NoteDuration.ThirtySecond) {
                        g.DrawBezier(pen, xstart, ystem, xstart, ((ystem + ((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.LineSpace), 2)) | 0)) | 0), ((xstart + Bridge.Int.mul(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0), ((ystem + Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0), ((xstart + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0), ((ystem + Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 3)) | 0));
                    }

                } else if (this.direction === MidiSheetMusic.Stem.Down) {
                    var ystem1 = (((ytop + ((Bridge.Int.div(Bridge.Int.mul(topstaff.Dist(this.end), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0) + MidiSheetMusic.SheetMusic.NoteHeight) | 0;

                    if (this.duration === MidiSheetMusic.NoteDuration.Eighth || this.duration === MidiSheetMusic.NoteDuration.DottedEighth || this.duration === MidiSheetMusic.NoteDuration.Triplet || this.duration === MidiSheetMusic.NoteDuration.Sixteenth || this.duration === MidiSheetMusic.NoteDuration.ThirtySecond) {

                        g.DrawBezier(pen, xstart, ystem1, xstart, ((ystem1 - MidiSheetMusic.SheetMusic.LineSpace) | 0), ((xstart + Bridge.Int.mul(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0), ((ystem1 - Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0), ((xstart + MidiSheetMusic.SheetMusic.LineSpace) | 0), ((((ystem1 - Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0) - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0));
                    }
                    ystem1 = (ystem1 - MidiSheetMusic.SheetMusic.NoteHeight) | 0;

                    if (this.duration === MidiSheetMusic.NoteDuration.Sixteenth || this.duration === MidiSheetMusic.NoteDuration.ThirtySecond) {

                        g.DrawBezier(pen, xstart, ystem1, xstart, ((ystem1 - MidiSheetMusic.SheetMusic.LineSpace) | 0), ((xstart + Bridge.Int.mul(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0), ((ystem1 - Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0), ((xstart + MidiSheetMusic.SheetMusic.LineSpace) | 0), ((((ystem1 - Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0) - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0));
                    }

                    ystem1 = (ystem1 - MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                    if (this.duration === MidiSheetMusic.NoteDuration.ThirtySecond) {
                        g.DrawBezier(pen, xstart, ystem1, xstart, ((ystem1 - MidiSheetMusic.SheetMusic.LineSpace) | 0), ((xstart + Bridge.Int.mul(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0), ((ystem1 - Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0), ((xstart + MidiSheetMusic.SheetMusic.LineSpace) | 0), ((((ystem1 - Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0) - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0));
                    }

                }
                pen.Width = 1;

            },
            DrawHorizBarStem: function (g, pen, ytop, topstaff) {
                pen.Width = (Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0;

                var xstart = 0;
                var xstart2 = 0;

                if (this.side === MidiSheetMusic.Stem.LeftSide) {
                    xstart = (((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0) + 1) | 0;
                } else {
                    if (this.side === MidiSheetMusic.Stem.RightSide) {
                        xstart = (((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0) + MidiSheetMusic.SheetMusic.NoteWidth) | 0;
                    }
                }

                if (this.pair.side === MidiSheetMusic.Stem.LeftSide) {
                    xstart2 = (((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0) + 1) | 0;
                } else {
                    if (this.pair.side === MidiSheetMusic.Stem.RightSide) {
                        xstart2 = (((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0) + MidiSheetMusic.SheetMusic.NoteWidth) | 0;
                    }
                }


                if (this.direction === MidiSheetMusic.Stem.Up) {
                    var xend = (this.width_to_pair + xstart2) | 0;
                    var ystart = (ytop + ((Bridge.Int.div(Bridge.Int.mul(topstaff.Dist(this.end), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0;
                    var yend = (ytop + ((Bridge.Int.div(Bridge.Int.mul(topstaff.Dist(this.pair.end), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0;

                    if (this.duration === MidiSheetMusic.NoteDuration.Eighth || this.duration === MidiSheetMusic.NoteDuration.DottedEighth || this.duration === MidiSheetMusic.NoteDuration.Triplet || this.duration === MidiSheetMusic.NoteDuration.Sixteenth || this.duration === MidiSheetMusic.NoteDuration.ThirtySecond) {

                        g.DrawLine(pen, xstart, ystart, xend, yend);
                    }
                    ystart = (ystart + MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                    yend = (yend + MidiSheetMusic.SheetMusic.NoteHeight) | 0;

                    /* A dotted eighth will connect to a 16th note. */
                    if (this.duration === MidiSheetMusic.NoteDuration.DottedEighth) {
                        var x = (xend - MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                        var slope = (((yend - ystart) | 0)) * 1.0 / (((xend - xstart) | 0));
                        var y = Bridge.Int.clip32(slope * (((x - xend) | 0)) + yend);

                        g.DrawLine(pen, x, y, xend, yend);
                    }

                    if (this.duration === MidiSheetMusic.NoteDuration.Sixteenth || this.duration === MidiSheetMusic.NoteDuration.ThirtySecond) {

                        g.DrawLine(pen, xstart, ystart, xend, yend);
                    }
                    ystart = (ystart + MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                    yend = (yend + MidiSheetMusic.SheetMusic.NoteHeight) | 0;

                    if (this.duration === MidiSheetMusic.NoteDuration.ThirtySecond) {
                        g.DrawLine(pen, xstart, ystart, xend, yend);
                    }
                } else {
                    var xend1 = (this.width_to_pair + xstart2) | 0;
                    var ystart1 = (((ytop + ((Bridge.Int.div(Bridge.Int.mul(topstaff.Dist(this.end), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0) + MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                    var yend1 = (((ytop + ((Bridge.Int.div(Bridge.Int.mul(topstaff.Dist(this.pair.end), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0) + MidiSheetMusic.SheetMusic.NoteHeight) | 0;

                    if (this.duration === MidiSheetMusic.NoteDuration.Eighth || this.duration === MidiSheetMusic.NoteDuration.DottedEighth || this.duration === MidiSheetMusic.NoteDuration.Triplet || this.duration === MidiSheetMusic.NoteDuration.Sixteenth || this.duration === MidiSheetMusic.NoteDuration.ThirtySecond) {

                        g.DrawLine(pen, xstart, ystart1, xend1, yend1);
                    }
                    ystart1 = (ystart1 - MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                    yend1 = (yend1 - MidiSheetMusic.SheetMusic.NoteHeight) | 0;

                    /* A dotted eighth will connect to a 16th note. */
                    if (this.duration === MidiSheetMusic.NoteDuration.DottedEighth) {
                        var x1 = (xend1 - MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                        var slope1 = (((yend1 - ystart1) | 0)) * 1.0 / (((xend1 - xstart) | 0));
                        var y1 = Bridge.Int.clip32(slope1 * (((x1 - xend1) | 0)) + yend1);

                        g.DrawLine(pen, x1, y1, xend1, yend1);
                    }

                    if (this.duration === MidiSheetMusic.NoteDuration.Sixteenth || this.duration === MidiSheetMusic.NoteDuration.ThirtySecond) {

                        g.DrawLine(pen, xstart, ystart1, xend1, yend1);
                    }
                    ystart1 = (ystart1 - MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                    yend1 = (yend1 - MidiSheetMusic.SheetMusic.NoteHeight) | 0;

                    if (this.duration === MidiSheetMusic.NoteDuration.ThirtySecond) {
                        g.DrawLine(pen, xstart, ystart1, xend1, yend1);
                    }
                }
                pen.Width = 1;
            },
            toString: function () {
                return System.String.format("Stem duration={0} direction={1} top={2} bottom={3} end={4} overlap={5} side={6} width_to_pair={7} receiver_in_pair={8}", Bridge.box(this.duration, MidiSheetMusic.NoteDuration, System.Enum.toStringFn(MidiSheetMusic.NoteDuration)), Bridge.box(this.direction, System.Int32), this.top.toString(), this.bottom.toString(), this.end.toString(), Bridge.box(this.notesoverlap, System.Boolean, System.Boolean.toString), Bridge.box(this.side, System.Int32), Bridge.box(this.width_to_pair, System.Int32), Bridge.box(this.receiver_in_pair, System.Boolean, System.Boolean.toString));
            }
        }
    });

    Bridge.define("MidiSheetMusic.StemDir", {
        $kind: "enum",
        statics: {
            fields: {
                Up: 0,
                Down: 1
            }
        }
    });

    Bridge.define("MidiSheetMusic.SymbolWidths", {
        statics: {
            methods: {
                GetTrackWidths: function (symbols) {
                    var $t;
                    var widths = new (System.Collections.Generic.Dictionary$2(System.Int32,System.Int32))();

                    $t = Bridge.getEnumerator(symbols);
                    try {
                        while ($t.moveNext()) {
                            var m = $t.Current;
                            var start = m.StartTime;
                            var w = m.MinWidth;

                            if (Bridge.is(m, MidiSheetMusic.BarSymbol)) {
                                continue;
                            } else if (widths.containsKey(start)) {
                                widths.set(start, (widths.get(start) + w) | 0);
                            } else {
                                widths.set(start, w);
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }return widths;
                }
            }
        },
        fields: {
            widths: null,
            maxwidths: null,
            starttimes: null
        },
        props: {
            StartTimes: {
                get: function () {
                    return this.starttimes;
                }
            }
        },
        ctors: {
            ctor: function (tracks, tracklyrics) {
                var $t, $t1, $t2, $t3;
                this.$initialize();

                /* Get the symbol widths for all the tracks */
                this.widths = System.Array.init(tracks.length, null, System.Collections.Generic.Dictionary$2(System.Int32,System.Int32));
                for (var track = 0; track < tracks.length; track = (track + 1) | 0) {
                    this.widths[System.Array.index(track, this.widths)] = MidiSheetMusic.SymbolWidths.GetTrackWidths(tracks[System.Array.index(track, tracks)]);
                }
                this.maxwidths = new (System.Collections.Generic.Dictionary$2(System.Int32,System.Int32))();

                /* Calculate the maximum symbol widths */
                $t = Bridge.getEnumerator(this.widths);
                try {
                    while ($t.moveNext()) {
                        var dict = $t.Current;
                        $t1 = Bridge.getEnumerator(dict.getKeys(), System.Int32);
                        try {
                            while ($t1.moveNext()) {
                                var time = $t1.Current;
                                if (!this.maxwidths.containsKey(time) || (this.maxwidths.get(time) < dict.get(time))) {

                                    this.maxwidths.set(time, dict.get(time));
                                }
                            }
                        } finally {
                            if (Bridge.is($t1, System.IDisposable)) {
                                $t1.System$IDisposable$dispose();
                            }
                        }
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }
                if (tracklyrics != null) {
                    $t2 = Bridge.getEnumerator(tracklyrics);
                    try {
                        while ($t2.moveNext()) {
                            var lyrics = $t2.Current;
                            if (lyrics == null) {
                                continue;
                            }
                            $t3 = Bridge.getEnumerator(lyrics);
                            try {
                                while ($t3.moveNext()) {
                                    var lyric = $t3.Current;
                                    var width = lyric.MinWidth;
                                    var time1 = lyric.StartTime;
                                    if (!this.maxwidths.containsKey(time1) || (this.maxwidths.get(time1) < width)) {

                                        this.maxwidths.set(time1, width);
                                    }
                                }
                            } finally {
                                if (Bridge.is($t3, System.IDisposable)) {
                                    $t3.System$IDisposable$dispose();
                                }
                            }
                        }
                    } finally {
                        if (Bridge.is($t2, System.IDisposable)) {
                            $t2.System$IDisposable$dispose();
                        }
                    }}

                /* Store all the start times to the starttime array */
                this.starttimes = System.Array.init(System.Array.getCount(this.maxwidths.getKeys(), System.Int32), 0, System.Int32);
                System.Array.copyTo(this.maxwidths.getKeys(), this.starttimes, 0, System.Int32);
                System.Array.sort(this.starttimes);
            }
        },
        methods: {
            GetExtraWidth: function (track, start) {
                if (!this.widths[System.Array.index(track, this.widths)].containsKey(start)) {
                    return this.maxwidths.get(start);
                } else {
                    return ((this.maxwidths.get(start) - this.widths[System.Array.index(track, this.widths)].get(start)) | 0);
                }
            }
        }
    });

    Bridge.define("MidiSheetMusic.TimeSignature", {
        statics: {
            methods: {
                GetStemDuration: function (dur) {
                    if (dur === MidiSheetMusic.NoteDuration.DottedHalf) {
                        return MidiSheetMusic.NoteDuration.Half;
                    } else {
                        if (dur === MidiSheetMusic.NoteDuration.DottedQuarter) {
                            return MidiSheetMusic.NoteDuration.Quarter;
                        } else {
                            if (dur === MidiSheetMusic.NoteDuration.DottedEighth) {
                                return MidiSheetMusic.NoteDuration.Eighth;
                            } else {
                                return dur;
                            }
                        }
                    }
                }
            }
        },
        fields: {
            numerator: 0,
            denominator: 0,
            quarternote: 0,
            measure: 0,
            tempo: 0
        },
        props: {
            Numerator: {
                get: function () {
                    return this.numerator;
                }
            },
            Denominator: {
                get: function () {
                    return this.denominator;
                }
            },
            Quarter: {
                get: function () {
                    return this.quarternote;
                }
            },
            Measure: {
                get: function () {
                    return this.measure;
                }
            },
            Tempo: {
                get: function () {
                    return this.tempo;
                }
            }
        },
        ctors: {
            ctor: function (numerator, denominator, quarternote, tempo) {
                this.$initialize();
                if (numerator <= 0 || denominator <= 0 || quarternote <= 0) {
                    throw new MidiSheetMusic.MidiFileException("Invalid time signature", 0);
                }

                /* Midi File gives wrong time signature sometimes */
                if (numerator === 5) {
                    numerator = 4;
                }

                this.numerator = numerator;
                this.denominator = denominator;
                this.quarternote = quarternote;
                this.tempo = tempo;

                var beat;
                if (denominator < 4) {
                    beat = Bridge.Int.mul(quarternote, 2);
                } else {
                    beat = (Bridge.Int.div(quarternote, (((Bridge.Int.div(denominator, 4)) | 0)))) | 0;
                }

                this.measure = Bridge.Int.mul(numerator, beat);
            }
        },
        methods: {
            GetMeasure: function (time) {
                return ((Bridge.Int.div(time, this.measure)) | 0);
            },
            GetNoteDuration: function (duration) {
                var whole = Bridge.Int.mul(this.quarternote, 4);


                if (duration >= ((Bridge.Int.div(Bridge.Int.mul(28, whole), 32)) | 0)) {
                    return MidiSheetMusic.NoteDuration.Whole;
                } else {
                    if (duration >= ((Bridge.Int.div(Bridge.Int.mul(20, whole), 32)) | 0)) {
                        return MidiSheetMusic.NoteDuration.DottedHalf;
                    } else {
                        if (duration >= ((Bridge.Int.div(Bridge.Int.mul(14, whole), 32)) | 0)) {
                            return MidiSheetMusic.NoteDuration.Half;
                        } else {
                            if (duration >= ((Bridge.Int.div(Bridge.Int.mul(10, whole), 32)) | 0)) {
                                return MidiSheetMusic.NoteDuration.DottedQuarter;
                            } else {
                                if (duration >= ((Bridge.Int.div(Bridge.Int.mul(7, whole), 32)) | 0)) {
                                    return MidiSheetMusic.NoteDuration.Quarter;
                                } else {
                                    if (duration >= ((Bridge.Int.div(Bridge.Int.mul(5, whole), 32)) | 0)) {
                                        return MidiSheetMusic.NoteDuration.DottedEighth;
                                    } else {
                                        if (duration >= ((Bridge.Int.div(Bridge.Int.mul(6, whole), 64)) | 0)) {
                                            return MidiSheetMusic.NoteDuration.Eighth;
                                        } else {
                                            if (duration >= ((Bridge.Int.div(Bridge.Int.mul(5, whole), 64)) | 0)) {
                                                return MidiSheetMusic.NoteDuration.Triplet;
                                            } else {
                                                if (duration >= ((Bridge.Int.div(Bridge.Int.mul(3, whole), 64)) | 0)) {
                                                    return MidiSheetMusic.NoteDuration.Sixteenth;
                                                } else {
                                                    return MidiSheetMusic.NoteDuration.ThirtySecond;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            DurationToTime: function (dur) {
                var eighth = (Bridge.Int.div(this.quarternote, 2)) | 0;
                var sixteenth = (Bridge.Int.div(eighth, 2)) | 0;

                switch (dur) {
                    case MidiSheetMusic.NoteDuration.Whole: 
                        return Bridge.Int.mul(this.quarternote, 4);
                    case MidiSheetMusic.NoteDuration.DottedHalf: 
                        return Bridge.Int.mul(this.quarternote, 3);
                    case MidiSheetMusic.NoteDuration.Half: 
                        return Bridge.Int.mul(this.quarternote, 2);
                    case MidiSheetMusic.NoteDuration.DottedQuarter: 
                        return Bridge.Int.mul(3, eighth);
                    case MidiSheetMusic.NoteDuration.Quarter: 
                        return this.quarternote;
                    case MidiSheetMusic.NoteDuration.DottedEighth: 
                        return Bridge.Int.mul(3, sixteenth);
                    case MidiSheetMusic.NoteDuration.Eighth: 
                        return eighth;
                    case MidiSheetMusic.NoteDuration.Triplet: 
                        return ((Bridge.Int.div(this.quarternote, 3)) | 0);
                    case MidiSheetMusic.NoteDuration.Sixteenth: 
                        return sixteenth;
                    case MidiSheetMusic.NoteDuration.ThirtySecond: 
                        return ((Bridge.Int.div(sixteenth, 2)) | 0);
                    default: 
                        return 0;
                }
            },
            toString: function () {
                return System.String.format("TimeSignature={0}/{1} quarter={2} tempo={3}", Bridge.box(this.numerator, System.Int32), Bridge.box(this.denominator, System.Int32), Bridge.box(this.quarternote, System.Int32), Bridge.box(this.tempo, System.Int32));
            }
        }
    });

    Bridge.define("MidiSheetMusic.WhiteNote", {
        inherits: function () { return [System.Collections.Generic.IComparer$1(MidiSheetMusic.WhiteNote)]; },
        statics: {
            fields: {
                A: 0,
                B: 0,
                C: 0,
                D: 0,
                E: 0,
                F: 0,
                G: 0,
                TopTreble: null,
                BottomTreble: null,
                TopBass: null,
                BottomBass: null,
                MiddleC: null
            },
            ctors: {
                init: function () {
                    this.A = 0;
                    this.B = 1;
                    this.C = 2;
                    this.D = 3;
                    this.E = 4;
                    this.F = 5;
                    this.G = 6;
                    this.TopTreble = new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.E, 5);
                    this.BottomTreble = new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.F, 4);
                    this.TopBass = new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.G, 3);
                    this.BottomBass = new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.A, 3);
                    this.MiddleC = new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.C, 4);
                }
            },
            methods: {
                Max: function (x, y) {
                    if (x.Dist(y) > 0) {
                        return x;
                    } else {
                        return y;
                    }
                },
                Min: function (x, y) {
                    if (x.Dist(y) < 0) {
                        return x;
                    } else {
                        return y;
                    }
                },
                Top: function (clef) {
                    if (clef === MidiSheetMusic.Clef.Treble) {
                        return MidiSheetMusic.WhiteNote.TopTreble;
                    } else {
                        return MidiSheetMusic.WhiteNote.TopBass;
                    }
                },
                Bottom: function (clef) {
                    if (clef === MidiSheetMusic.Clef.Treble) {
                        return MidiSheetMusic.WhiteNote.BottomTreble;
                    } else {
                        return MidiSheetMusic.WhiteNote.BottomBass;
                    }
                }
            }
        },
        fields: {
            letter: 0,
            octave: 0
        },
        props: {
            Letter: {
                get: function () {
                    return this.letter;
                }
            },
            Octave: {
                get: function () {
                    return this.octave;
                }
            }
        },
        alias: ["compare", ["System$Collections$Generic$IComparer$1$MidiSheetMusic$WhiteNote$compare", "System$Collections$Generic$IComparer$1$compare"]],
        ctors: {
            ctor: function (letter, octave) {
                this.$initialize();
                if (!(letter >= 0 && letter <= 6)) {
                    throw new System.ArgumentException("Letter " + letter + " is incorrect");
                }

                this.letter = letter;
                this.octave = octave;
            }
        },
        methods: {
            Dist: function (w) {
                return ((Bridge.Int.mul((((this.octave - w.octave) | 0)), 7) + (((this.letter - w.letter) | 0))) | 0);
            },
            Add: function (amount) {
                var num = (Bridge.Int.mul(this.octave, 7) + this.letter) | 0;
                num = (num + amount) | 0;
                if (num < 0) {
                    num = 0;
                }
                return new MidiSheetMusic.WhiteNote(num % 7, ((Bridge.Int.div(num, 7)) | 0));
            },
            Number: function () {
                var offset = 0;
                switch (this.letter) {
                    case MidiSheetMusic.WhiteNote.A: 
                        offset = MidiSheetMusic.NoteScale.A;
                        break;
                    case MidiSheetMusic.WhiteNote.B: 
                        offset = MidiSheetMusic.NoteScale.B;
                        break;
                    case MidiSheetMusic.WhiteNote.C: 
                        offset = MidiSheetMusic.NoteScale.C;
                        break;
                    case MidiSheetMusic.WhiteNote.D: 
                        offset = MidiSheetMusic.NoteScale.D;
                        break;
                    case MidiSheetMusic.WhiteNote.E: 
                        offset = MidiSheetMusic.NoteScale.E;
                        break;
                    case MidiSheetMusic.WhiteNote.F: 
                        offset = MidiSheetMusic.NoteScale.F;
                        break;
                    case MidiSheetMusic.WhiteNote.G: 
                        offset = MidiSheetMusic.NoteScale.G;
                        break;
                    default: 
                        offset = 0;
                        break;
                }
                return MidiSheetMusic.NoteScale.ToNumber(offset, this.octave);
            },
            compare: function (x, y) {
                return x.Dist(y);
            },
            toString: function () {
                var s = System.Array.init([
                    "A", 
                    "B", 
                    "C", 
                    "D", 
                    "E", 
                    "F", 
                    "G"
                ], System.String);
                return (s[System.Array.index(this.letter, s)] || "") + this.octave;
            }
        }
    });

    Bridge.define("MidiSheetMusicBridge.Text.ASCII", {
        methods: {
            GetString: function (data, startIndex, len) {
                var toReturn = "";
                for (var i = 0; i < len && i < data.length; i = (i + 1) | 0) {
                    toReturn = (toReturn || "") + String.fromCharCode(data[System.Array.index(((i + startIndex) | 0), data)]);
                }
                return toReturn;
            }
        }
    });

    Bridge.define("MidiSheetMusicBridge.Text.Encoding", {
        statics: {
            fields: {
                ASCII: null
            },
            ctors: {
                init: function () {
                    this.ASCII = new MidiSheetMusicBridge.Text.ASCII();
                }
            }
        }
    });

    Bridge.define("MidiSheetMusic.AccidSymbol", {
        inherits: [MidiSheetMusic.MusicSymbol],
        fields: {
            accid: 0,
            whitenote: null,
            clef: 0,
            width: 0
        },
        props: {
            Note: {
                get: function () {
                    return this.whitenote;
                }
            },
            StartTime: {
                get: function () {
                    return -1;
                }
            },
            MinWidth: {
                get: function () {
                    return ((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0);
                }
            },
            Width: {
                get: function () {
                    return this.width;
                },
                set: function (value) {
                    this.width = value;
                }
            },
            AboveStaff: {
                get: function () {
                    return this.GetAboveStaff();
                }
            },
            BelowStaff: {
                get: function () {
                    return this.GetBelowStaff();
                }
            }
        },
        ctors: {
            ctor: function (accid, note, clef) {
                this.$initialize();
                MidiSheetMusic.MusicSymbol.ctor.call(this);
                this.accid = accid;
                this.whitenote = note;
                this.clef = clef;
                this.width = this.MinWidth;
            }
        },
        methods: {
            GetAboveStaff: function () {
                var dist = (Bridge.Int.div(Bridge.Int.mul(MidiSheetMusic.WhiteNote.Top(this.clef).Dist(this.whitenote), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0;
                if (this.accid === MidiSheetMusic.Accid.Sharp || this.accid === MidiSheetMusic.Accid.Natural) {
                    dist = (dist - MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                } else {
                    if (this.accid === MidiSheetMusic.Accid.Flat) {
                        dist = (dist - (((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0))) | 0;
                    }
                }

                if (dist < 0) {
                    return ((-dist) | 0);
                } else {
                    return 0;
                }
            },
            GetBelowStaff: function () {
                var dist = (((Bridge.Int.div(Bridge.Int.mul(MidiSheetMusic.WhiteNote.Bottom(this.clef).Dist(this.whitenote), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0) + MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                if (this.accid === MidiSheetMusic.Accid.Sharp || this.accid === MidiSheetMusic.Accid.Natural) {
                    dist = (dist + MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                }

                if (dist > 0) {
                    return dist;
                } else {
                    return 0;
                }
            },
            Draw: function (g, pen, ytop) {
                /* Align the symbol to the right */
                g.TranslateTransform(((this.Width - this.MinWidth) | 0), 0);

                /* Store the y-pixel value of the top of the whitenote in ynote. */
                var ynote = (ytop + ((Bridge.Int.div(Bridge.Int.mul(MidiSheetMusic.WhiteNote.Top(this.clef).Dist(this.whitenote), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0;

                if (this.accid === MidiSheetMusic.Accid.Sharp) {
                    this.DrawSharp(g, pen, ynote);
                } else {
                    if (this.accid === MidiSheetMusic.Accid.Flat) {
                        this.DrawFlat(g, pen, ynote);
                    } else {
                        if (this.accid === MidiSheetMusic.Accid.Natural) {
                            this.DrawNatural(g, pen, ynote);
                        }
                    }
                }

                g.TranslateTransform(((-(((this.Width - this.MinWidth) | 0))) | 0), 0);
            },
            DrawSharp: function (g, pen, ynote) {

                /* Draw the two vertical lines */
                var ystart = (ynote - MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                var yend = (ynote + Bridge.Int.mul(2, MidiSheetMusic.SheetMusic.NoteHeight)) | 0;
                var x = (Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0;
                pen.Width = 1;
                g.DrawLine(pen, x, ((ystart + 2) | 0), x, yend);
                x = (x + (((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0))) | 0;
                g.DrawLine(pen, x, ystart, x, ((yend - 2) | 0));

                /* Draw the slightly upwards horizontal lines */
                var xstart = (((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0) - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 4)) | 0)) | 0;
                var xend = (MidiSheetMusic.SheetMusic.NoteHeight + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 4)) | 0)) | 0;
                ystart = (ynote + MidiSheetMusic.SheetMusic.LineWidth) | 0;
                yend = (((ystart - MidiSheetMusic.SheetMusic.LineWidth) | 0) - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0;
                pen.Width = (Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0;
                g.DrawLine(pen, xstart, ystart, xend, yend);
                ystart = (ystart + MidiSheetMusic.SheetMusic.LineSpace) | 0;
                yend = (yend + MidiSheetMusic.SheetMusic.LineSpace) | 0;
                g.DrawLine(pen, xstart, ystart, xend, yend);
                pen.Width = 1;
            },
            DrawFlat: function (g, pen, ynote) {
                var x = (Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0;

                /* Draw the vertical line */
                pen.Width = 1;
                g.DrawLine(pen, x, ((((ynote - MidiSheetMusic.SheetMusic.NoteHeight) | 0) - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0)) | 0), x, ((ynote + MidiSheetMusic.SheetMusic.NoteHeight) | 0));

                /* Draw 3 bezier curves.
                  All 3 curves start and stop at the same points.
                  Each subsequent curve bulges more and more towards 
                  the topright corner, making the curve look thicker
                  towards the top-right.
                */
                g.DrawBezier(pen, x, ((ynote + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0), ((x + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0), ((ynote - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0), ((x + MidiSheetMusic.SheetMusic.LineSpace) | 0), ((ynote + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 3)) | 0)) | 0), x, ((((((ynote + MidiSheetMusic.SheetMusic.LineSpace) | 0) + MidiSheetMusic.SheetMusic.LineWidth) | 0) + 1) | 0));

                g.DrawBezier(pen, x, ((ynote + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0), ((x + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0), ((ynote - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0), ((((x + MidiSheetMusic.SheetMusic.LineSpace) | 0) + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0), ((((ynote + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 3)) | 0)) | 0) - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0), x, ((((((ynote + MidiSheetMusic.SheetMusic.LineSpace) | 0) + MidiSheetMusic.SheetMusic.LineWidth) | 0) + 1) | 0));


                g.DrawBezier(pen, x, ((ynote + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0), ((x + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0), ((ynote - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0), ((((x + MidiSheetMusic.SheetMusic.LineSpace) | 0) + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0), ((((ynote + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 3)) | 0)) | 0) - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0), x, ((((((ynote + MidiSheetMusic.SheetMusic.LineSpace) | 0) + MidiSheetMusic.SheetMusic.LineWidth) | 0) + 1) | 0));


            },
            DrawNatural: function (g, pen, ynote) {

                /* Draw the two vertical lines */
                var ystart = (((ynote - MidiSheetMusic.SheetMusic.LineSpace) | 0) - MidiSheetMusic.SheetMusic.LineWidth) | 0;
                var yend = (((ynote + MidiSheetMusic.SheetMusic.LineSpace) | 0) + MidiSheetMusic.SheetMusic.LineWidth) | 0;
                var x = (Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0;
                pen.Width = 1;
                g.DrawLine(pen, x, ystart, x, yend);
                x = (x + (((MidiSheetMusic.SheetMusic.LineSpace - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0))) | 0;
                ystart = (ynote - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0;
                yend = (((((ynote + Bridge.Int.mul(2, MidiSheetMusic.SheetMusic.LineSpace)) | 0) + MidiSheetMusic.SheetMusic.LineWidth) | 0) - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0;
                g.DrawLine(pen, x, ystart, x, yend);

                /* Draw the slightly upwards horizontal lines */
                var xstart = (Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0;
                var xend = (((xstart + MidiSheetMusic.SheetMusic.LineSpace) | 0) - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0;
                ystart = (ynote + MidiSheetMusic.SheetMusic.LineWidth) | 0;
                yend = (((ystart - MidiSheetMusic.SheetMusic.LineWidth) | 0) - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0;
                pen.Width = (Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0;
                g.DrawLine(pen, xstart, ystart, xend, yend);
                ystart = (ystart + MidiSheetMusic.SheetMusic.LineSpace) | 0;
                yend = (yend + MidiSheetMusic.SheetMusic.LineSpace) | 0;
                g.DrawLine(pen, xstart, ystart, xend, yend);
                pen.Width = 1;
            },
            toString: function () {
                return System.String.format("AccidSymbol accid={0} whitenote={1} clef={2} width={3}", Bridge.box(this.accid, MidiSheetMusic.Accid, System.Enum.toStringFn(MidiSheetMusic.Accid)), this.whitenote, Bridge.box(this.clef, MidiSheetMusic.Clef, System.Enum.toStringFn(MidiSheetMusic.Clef)), Bridge.box(this.width, System.Int32));
            }
        }
    });

    Bridge.define("MidiSheetMusic.BarSymbol", {
        inherits: [MidiSheetMusic.MusicSymbol],
        fields: {
            starttime: 0,
            width: 0
        },
        props: {
            StartTime: {
                get: function () {
                    return this.starttime;
                }
            },
            MinWidth: {
                get: function () {
                    return Bridge.Int.mul(2, MidiSheetMusic.SheetMusic.LineSpace);
                }
            },
            Width: {
                get: function () {
                    return this.width;
                },
                set: function (value) {
                    this.width = value;
                }
            },
            AboveStaff: {
                get: function () {
                    return 0;
                }
            },
            BelowStaff: {
                get: function () {
                    return 0;
                }
            }
        },
        ctors: {
            ctor: function (starttime) {
                this.$initialize();
                MidiSheetMusic.MusicSymbol.ctor.call(this);
                this.starttime = starttime;
                this.width = this.MinWidth;
            }
        },
        methods: {
            Draw: function (g, pen, ytop) {
                var y = ytop;
                var yend = (((y + Bridge.Int.mul(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0) + 4) | 0;
                pen.Width = 1;
                g.DrawLine(pen, ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteWidth, 2)) | 0), y, ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteWidth, 2)) | 0), yend);

            },
            toString: function () {
                return System.String.format("BarSymbol starttime={0} width={1}", Bridge.box(this.starttime, System.Int32), Bridge.box(this.width, System.Int32));
            }
        }
    });

    Bridge.define("MidiSheetMusic.Bitmap", {
        inherits: [MidiSheetMusic.Image],
        ctors: {
            ctor: function (type, filename) {
                this.$initialize();
                MidiSheetMusic.Image.ctor.call(this, type, filename);

            }
        }
    });

    Bridge.define("MidiSheetMusic.BlankSymbol", {
        inherits: [MidiSheetMusic.MusicSymbol],
        fields: {
            starttime: 0,
            width: 0
        },
        props: {
            StartTime: {
                get: function () {
                    return this.starttime;
                }
            },
            MinWidth: {
                get: function () {
                    return 0;
                }
            },
            Width: {
                get: function () {
                    return this.width;
                },
                set: function (value) {
                    this.width = value;
                }
            },
            AboveStaff: {
                get: function () {
                    return 0;
                }
            },
            BelowStaff: {
                get: function () {
                    return 0;
                }
            }
        },
        ctors: {
            ctor: function (starttime, width) {
                this.$initialize();
                MidiSheetMusic.MusicSymbol.ctor.call(this);
                this.starttime = starttime;
                this.width = width;
            }
        },
        methods: {
            Draw: function (g, pen, ytop) { },
            toString: function () {
                return System.String.format("BlankSymbol starttime={0} width={1}", Bridge.box(this.starttime, System.Int32), Bridge.box(this.width, System.Int32));
            }
        }
    });

    Bridge.define("MidiSheetMusic.ChordSymbol", {
        inherits: [MidiSheetMusic.MusicSymbol],
        statics: {
            methods: {
                CreateNoteData: function (midinotes, key, time) {

                    var len = midinotes.Count;
                    var notedata = System.Array.init(len, null, MidiSheetMusic.NoteData);

                    for (var i = 0; i < len; i = (i + 1) | 0) {
                        var midi = midinotes.getItem(i);
                        notedata[System.Array.index(i, notedata)] = new MidiSheetMusic.NoteData();
                        notedata[System.Array.index(i, notedata)].number = midi.Number;
                        notedata[System.Array.index(i, notedata)].leftside = true;
                        notedata[System.Array.index(i, notedata)].whitenote = key.GetWhiteNote(midi.Number);
                        notedata[System.Array.index(i, notedata)].duration = time.GetNoteDuration(((midi.EndTime - midi.StartTime) | 0));
                        notedata[System.Array.index(i, notedata)].accid = key.GetAccidental(midi.Number, ((Bridge.Int.div(midi.StartTime, time.Measure)) | 0));

                        if (i > 0 && (notedata[System.Array.index(i, notedata)].whitenote.Dist(notedata[System.Array.index(((i - 1) | 0), notedata)].whitenote) === 1)) {
                            /* This note (notedata[i]) overlaps with the previous note.
                              Change the side of this note.
                            */

                            if (notedata[System.Array.index(((i - 1) | 0), notedata)].leftside) {
                                notedata[System.Array.index(i, notedata)].leftside = false;
                            } else {
                                notedata[System.Array.index(i, notedata)].leftside = true;
                            }
                        } else {
                            notedata[System.Array.index(i, notedata)].leftside = true;
                        }
                    }
                    return notedata;
                },
                CreateAccidSymbols: function (notedata, clef) {
                    var $t, $t1;
                    var count = 0;
                    $t = Bridge.getEnumerator(notedata);
                    try {
                        while ($t.moveNext()) {
                            var n = $t.Current;
                            if (n.accid !== MidiSheetMusic.Accid.None) {
                                count = (count + 1) | 0;
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }var symbols = System.Array.init(count, null, MidiSheetMusic.AccidSymbol);
                    var i = 0;
                    $t1 = Bridge.getEnumerator(notedata);
                    try {
                        while ($t1.moveNext()) {
                            var n1 = $t1.Current;
                            if (n1.accid !== MidiSheetMusic.Accid.None) {
                                symbols[System.Array.index(i, symbols)] = new MidiSheetMusic.AccidSymbol(n1.accid, n1.whitenote, clef);
                                i = (i + 1) | 0;
                            }
                        }
                    } finally {
                        if (Bridge.is($t1, System.IDisposable)) {
                            $t1.System$IDisposable$dispose();
                        }
                    }return symbols;
                },
                StemDirection: function (bottom, top, clef) {
                    var middle;
                    if (clef === MidiSheetMusic.Clef.Treble) {
                        middle = new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.B, 5);
                    } else {
                        middle = new MidiSheetMusic.WhiteNote(MidiSheetMusic.WhiteNote.D, 3);
                    }

                    var dist = (middle.Dist(bottom) + middle.Dist(top)) | 0;
                    if (dist >= 0) {
                        return MidiSheetMusic.Stem.Up;
                    } else {
                        return MidiSheetMusic.Stem.Down;
                    }
                },
                NotesOverlap: function (notedata, start, end) {
                    for (var i = start; i < end; i = (i + 1) | 0) {
                        if (!notedata[System.Array.index(i, notedata)].leftside) {
                            return true;
                        }
                    }
                    return false;
                },
                CanCreateBeam: function (chords, time, startQuarter) {
                    var $t, $t1;
                    var numChords = chords.length;
                    var firstStem = chords[System.Array.index(0, chords)].Stem;
                    var lastStem = chords[System.Array.index(((chords.length - 1) | 0), chords)].Stem;
                    if (firstStem == null || lastStem == null) {
                        return false;
                    }
                    var measure = (Bridge.Int.div(chords[System.Array.index(0, chords)].StartTime, time.Measure)) | 0;
                    var dur = firstStem.Duration;
                    var dur2 = lastStem.Duration;

                    var dotted8_to_16 = false;
                    if (chords.length === 2 && dur === MidiSheetMusic.NoteDuration.DottedEighth && dur2 === MidiSheetMusic.NoteDuration.Sixteenth) {
                        dotted8_to_16 = true;
                    }

                    if (dur === MidiSheetMusic.NoteDuration.Whole || dur === MidiSheetMusic.NoteDuration.Half || dur === MidiSheetMusic.NoteDuration.DottedHalf || dur === MidiSheetMusic.NoteDuration.Quarter || dur === MidiSheetMusic.NoteDuration.DottedQuarter || (dur === MidiSheetMusic.NoteDuration.DottedEighth && !dotted8_to_16)) {

                        return false;
                    }

                    if (numChords === 6) {
                        if (dur !== MidiSheetMusic.NoteDuration.Eighth) {
                            return false;
                        }
                        var correctTime = ((time.Numerator === 3 && time.Denominator === 4) || (time.Numerator === 6 && time.Denominator === 8) || (time.Numerator === 6 && time.Denominator === 4));

                        if (!correctTime) {
                            return false;
                        }

                        if (time.Numerator === 6 && time.Denominator === 4) {
                            /* first chord must start at 1st or 4th quarter note */
                            var beat = Bridge.Int.mul(time.Quarter, 3);
                            if ((chords[System.Array.index(0, chords)].StartTime % beat) > ((Bridge.Int.div(time.Quarter, 6)) | 0)) {
                                return false;
                            }
                        }
                    } else if (numChords === 4) {
                        if (time.Numerator === 3 && time.Denominator === 8) {
                            return false;
                        }
                        var correctTime1 = (time.Numerator === 2 || time.Numerator === 4 || time.Numerator === 8);
                        if (!correctTime1 && dur !== MidiSheetMusic.NoteDuration.Sixteenth) {
                            return false;
                        }

                        /* chord must start on quarter note */
                        var beat1 = time.Quarter;
                        if (dur === MidiSheetMusic.NoteDuration.Eighth) {
                            /* 8th note chord must start on 1st or 3rd quarter note */
                            beat1 = Bridge.Int.mul(time.Quarter, 2);
                        } else if (dur === MidiSheetMusic.NoteDuration.ThirtySecond) {
                            /* 32nd note must start on an 8th beat */
                            beat1 = (Bridge.Int.div(time.Quarter, 2)) | 0;
                        }

                        if ((chords[System.Array.index(0, chords)].StartTime % beat1) > ((Bridge.Int.div(time.Quarter, 6)) | 0)) {
                            return false;
                        }
                    } else if (numChords === 3) {
                        var valid = (dur === MidiSheetMusic.NoteDuration.Triplet) || (dur === MidiSheetMusic.NoteDuration.Eighth && time.Numerator === 12 && time.Denominator === 8);
                        if (!valid) {
                            return false;
                        }

                        /* chord must start on quarter note */
                        var beat2 = time.Quarter;
                        if (time.Numerator === 12 && time.Denominator === 8) {
                            /* In 12/8 time, chord must start on 3*8th beat */
                            beat2 = Bridge.Int.mul(((Bridge.Int.div(time.Quarter, 2)) | 0), 3);
                        }
                        if ((chords[System.Array.index(0, chords)].StartTime % beat2) > ((Bridge.Int.div(time.Quarter, 6)) | 0)) {
                            return false;
                        }
                    } else if (numChords === 2) {
                        if (startQuarter) {
                            var beat3 = time.Quarter;
                            if ((chords[System.Array.index(0, chords)].StartTime % beat3) > ((Bridge.Int.div(time.Quarter, 6)) | 0)) {
                                return false;
                            }
                        }
                    }

                    $t = Bridge.getEnumerator(chords);
                    try {
                        while ($t.moveNext()) {
                            var chord = $t.Current;
                            if ((((Bridge.Int.div(chord.StartTime, time.Measure)) | 0)) !== measure) {
                                return false;
                            }
                            if (chord.Stem == null) {
                                return false;
                            }
                            if (chord.Stem.Duration !== dur && !dotted8_to_16) {
                                return false;
                            }
                            if (chord.Stem.isBeam) {
                                return false;
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }
                    /* Check that all stems can point in same direction */
                    var hasTwoStems = false;
                    var direction = MidiSheetMusic.Stem.Up;
                    $t1 = Bridge.getEnumerator(chords);
                    try {
                        while ($t1.moveNext()) {
                            var chord1 = $t1.Current;
                            if (chord1.HasTwoStems) {
                                if (hasTwoStems && chord1.Stem.Direction !== direction) {
                                    return false;
                                }
                                hasTwoStems = true;
                                direction = chord1.Stem.Direction;
                            }
                        }
                    } finally {
                        if (Bridge.is($t1, System.IDisposable)) {
                            $t1.System$IDisposable$dispose();
                        }
                    }
                    /* Get the final stem direction */
                    if (!hasTwoStems) {
                        var note1;
                        var note2;
                        note1 = (firstStem.Direction === MidiSheetMusic.Stem.Up ? firstStem.Top : firstStem.Bottom);
                        note2 = (lastStem.Direction === MidiSheetMusic.Stem.Up ? lastStem.Top : lastStem.Bottom);
                        direction = MidiSheetMusic.ChordSymbol.StemDirection(note1, note2, chords[System.Array.index(0, chords)].Clef);
                    }

                    /* If the notes are too far apart, don't use a beam */
                    if (direction === MidiSheetMusic.Stem.Up) {
                        if (Math.abs(firstStem.Top.Dist(lastStem.Top)) >= 11) {
                            return false;
                        }
                    } else {
                        if (Math.abs(firstStem.Bottom.Dist(lastStem.Bottom)) >= 11) {
                            return false;
                        }
                    }
                    return true;
                },
                CreateBeam: function (chords, spacing) {
                    var $t, $t1;
                    var firstStem = chords[System.Array.index(0, chords)].Stem;
                    var lastStem = chords[System.Array.index(((chords.length - 1) | 0), chords)].Stem;

                    /* Calculate the new stem direction */
                    var newdirection = -1;
                    $t = Bridge.getEnumerator(chords);
                    try {
                        while ($t.moveNext()) {
                            var chord = $t.Current;
                            if (chord.HasTwoStems) {
                                newdirection = chord.Stem.Direction;
                                break;
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }
                    if (newdirection === -1) {
                        var note1;
                        var note2;
                        note1 = (firstStem.Direction === MidiSheetMusic.Stem.Up ? firstStem.Top : firstStem.Bottom);
                        note2 = (lastStem.Direction === MidiSheetMusic.Stem.Up ? lastStem.Top : lastStem.Bottom);
                        newdirection = MidiSheetMusic.ChordSymbol.StemDirection(note1, note2, chords[System.Array.index(0, chords)].Clef);
                    }
                    $t1 = Bridge.getEnumerator(chords);
                    try {
                        while ($t1.moveNext()) {
                            var chord1 = $t1.Current;
                            chord1.Stem.Direction = newdirection;
                        }
                    } finally {
                        if (Bridge.is($t1, System.IDisposable)) {
                            $t1.System$IDisposable$dispose();
                        }
                    }
                    if (chords.length === 2) {
                        MidiSheetMusic.ChordSymbol.BringStemsCloser(chords);
                    } else {
                        MidiSheetMusic.ChordSymbol.LineUpStemEnds(chords);
                    }

                    firstStem.SetPair(lastStem, spacing);
                    for (var i = 1; i < chords.length; i = (i + 1) | 0) {
                        chords[System.Array.index(i, chords)].Stem.Receiver = true;
                    }
                },
                BringStemsCloser: function (chords) {
                    var firstStem = chords[System.Array.index(0, chords)].Stem;
                    var lastStem = chords[System.Array.index(1, chords)].Stem;

                    /* If we're connecting a dotted 8th to a 16th, increase
                      the stem end of the dotted eighth.
                    */
                    if (firstStem.Duration === MidiSheetMusic.NoteDuration.DottedEighth && lastStem.Duration === MidiSheetMusic.NoteDuration.Sixteenth) {
                        if (firstStem.Direction === MidiSheetMusic.Stem.Up) {
                            firstStem.End = firstStem.End.Add(2);
                        } else {
                            firstStem.End = firstStem.End.Add(-2);
                        }
                    }

                    /* Bring the stem ends closer together */
                    var distance = Math.abs(firstStem.End.Dist(lastStem.End));
                    if (firstStem.Direction === MidiSheetMusic.Stem.Up) {
                        if (Bridge.referenceEquals(MidiSheetMusic.WhiteNote.Max(firstStem.End, lastStem.End), firstStem.End)) {
                            lastStem.End = lastStem.End.Add(((Bridge.Int.div(distance, 2)) | 0));
                        } else {
                            firstStem.End = firstStem.End.Add(((Bridge.Int.div(distance, 2)) | 0));
                        }
                    } else {
                        if (Bridge.referenceEquals(MidiSheetMusic.WhiteNote.Min(firstStem.End, lastStem.End), firstStem.End)) {
                            lastStem.End = lastStem.End.Add(((Bridge.Int.div(((-distance) | 0), 2)) | 0));
                        } else {
                            firstStem.End = firstStem.End.Add(((Bridge.Int.div(((-distance) | 0), 2)) | 0));
                        }
                    }
                },
                LineUpStemEnds: function (chords) {
                    var $t, $t1;
                    var firstStem = chords[System.Array.index(0, chords)].Stem;
                    var lastStem = chords[System.Array.index(((chords.length - 1) | 0), chords)].Stem;
                    var middleStem = chords[System.Array.index(1, chords)].Stem;

                    if (firstStem.Direction === MidiSheetMusic.Stem.Up) {
                        /* Find the highest stem. The beam will either:
                          - Slant downwards (first stem is highest)
                          - Slant upwards (last stem is highest)
                          - Be straight (middle stem is highest)
                        */
                        var top = firstStem.End;
                        $t = Bridge.getEnumerator(chords);
                        try {
                            while ($t.moveNext()) {
                                var chord = $t.Current;
                                top = MidiSheetMusic.WhiteNote.Max(top, chord.Stem.End);
                            }
                        } finally {
                            if (Bridge.is($t, System.IDisposable)) {
                                $t.System$IDisposable$dispose();
                            }
                        }if (Bridge.referenceEquals(top, firstStem.End) && top.Dist(lastStem.End) >= 2) {
                            firstStem.End = top;
                            middleStem.End = top.Add(-1);
                            lastStem.End = top.Add(-2);
                        } else if (Bridge.referenceEquals(top, lastStem.End) && top.Dist(firstStem.End) >= 2) {
                            firstStem.End = top.Add(-2);
                            middleStem.End = top.Add(-1);
                            lastStem.End = top;
                        } else {
                            firstStem.End = top;
                            middleStem.End = top;
                            lastStem.End = top;
                        }
                    } else {
                        /* Find the bottommost stem. The beam will either:
                          - Slant upwards (first stem is lowest)
                          - Slant downwards (last stem is lowest)
                          - Be straight (middle stem is highest)
                        */
                        var bottom = firstStem.End;
                        $t1 = Bridge.getEnumerator(chords);
                        try {
                            while ($t1.moveNext()) {
                                var chord1 = $t1.Current;
                                bottom = MidiSheetMusic.WhiteNote.Min(bottom, chord1.Stem.End);
                            }
                        } finally {
                            if (Bridge.is($t1, System.IDisposable)) {
                                $t1.System$IDisposable$dispose();
                            }
                        }
                        if (Bridge.referenceEquals(bottom, firstStem.End) && lastStem.End.Dist(bottom) >= 2) {
                            middleStem.End = bottom.Add(1);
                            lastStem.End = bottom.Add(2);
                        } else if (Bridge.referenceEquals(bottom, lastStem.End) && firstStem.End.Dist(bottom) >= 2) {
                            middleStem.End = bottom.Add(1);
                            firstStem.End = bottom.Add(2);
                        } else {
                            firstStem.End = bottom;
                            middleStem.End = bottom;
                            lastStem.End = bottom;
                        }
                    }

                    /* All middle stems have the same end */
                    for (var i = 1; i < ((chords.length - 1) | 0); i = (i + 1) | 0) {
                        var stem = chords[System.Array.index(i, chords)].Stem;
                        stem.End = middleStem.End;
                    }
                }
            }
        },
        fields: {
            clef: 0,
            starttime: 0,
            endtime: 0,
            notedata: null,
            accidsymbols: null,
            width: 0,
            stem1: null,
            stem2: null,
            hastwostems: false,
            sheetmusic: null
        },
        props: {
            StartTime: {
                get: function () {
                    return this.starttime;
                }
            },
            EndTime: {
                get: function () {
                    return this.endtime;
                }
            },
            Clef: {
                get: function () {
                    return this.clef;
                }
            },
            HasTwoStems: {
                get: function () {
                    return this.hastwostems;
                }
            },
            Stem: {
                get: function () {
                    if (this.stem1 == null) {
                        return this.stem2;
                    } else if (this.stem2 == null) {
                        return this.stem1;
                    } else if (this.stem1.Duration < this.stem2.Duration) {
                        return this.stem1;
                    } else {
                        return this.stem2;
                    }
                }
            },
            Width: {
                get: function () {
                    return this.width;
                },
                set: function (value) {
                    this.width = value;
                }
            },
            MinWidth: {
                get: function () {
                    return this.GetMinWidth();
                }
            },
            AboveStaff: {
                get: function () {
                    return this.GetAboveStaff();
                }
            },
            BelowStaff: {
                get: function () {
                    return this.GetBelowStaff();
                }
            }
        },
        ctors: {
            ctor: function (midinotes, key, time, c, sheet) {
                this.$initialize();
                MidiSheetMusic.MusicSymbol.ctor.call(this);

                var len = midinotes.Count;
                var i;

                this.hastwostems = false;
                this.clef = c;
                this.sheetmusic = sheet;

                this.starttime = midinotes.getItem(0).StartTime;
                this.endtime = midinotes.getItem(0).EndTime;

                for (i = 0; i < midinotes.Count; i = (i + 1) | 0) {
                    if (i > 1) {
                        if (midinotes.getItem(i).Number < midinotes.getItem(((i - 1) | 0)).Number) {
                            throw new System.ArgumentException("Chord notes not in increasing order by number");
                        }
                    }
                    this.endtime = Math.max(this.endtime, midinotes.getItem(i).EndTime);
                }

                this.notedata = MidiSheetMusic.ChordSymbol.CreateNoteData(midinotes, key, time);
                this.accidsymbols = MidiSheetMusic.ChordSymbol.CreateAccidSymbols(this.notedata, this.clef);


                /* Find out how many stems we need (1 or 2) */
                var dur1 = this.notedata[System.Array.index(0, this.notedata)].duration;
                var dur2 = dur1;
                var change = -1;
                for (i = 0; i < this.notedata.length; i = (i + 1) | 0) {
                    dur2 = this.notedata[System.Array.index(i, this.notedata)].duration;
                    if (dur1 !== dur2) {
                        change = i;
                        break;
                    }
                }

                if (dur1 !== dur2) {
                    /* We have notes with different durations.  So we will need
                      two stems.  The first stem points down, and contains the
                      bottom note up to the note with the different duration.

                      The second stem points up, and contains the note with the
                      different duration up to the top note.
                    */
                    this.hastwostems = true;
                    this.stem1 = new MidiSheetMusic.Stem(this.notedata[System.Array.index(0, this.notedata)].whitenote, this.notedata[System.Array.index(((change - 1) | 0), this.notedata)].whitenote, dur1, MidiSheetMusic.Stem.Down, MidiSheetMusic.ChordSymbol.NotesOverlap(this.notedata, 0, change));

                    this.stem2 = new MidiSheetMusic.Stem(this.notedata[System.Array.index(change, this.notedata)].whitenote, this.notedata[System.Array.index(((this.notedata.length - 1) | 0), this.notedata)].whitenote, dur2, MidiSheetMusic.Stem.Up, MidiSheetMusic.ChordSymbol.NotesOverlap(this.notedata, change, this.notedata.length));
                } else {
                    /* All notes have the same duration, so we only need one stem. */
                    var direction = MidiSheetMusic.ChordSymbol.StemDirection(this.notedata[System.Array.index(0, this.notedata)].whitenote, this.notedata[System.Array.index(((this.notedata.length - 1) | 0), this.notedata)].whitenote, this.clef);

                    this.stem1 = new MidiSheetMusic.Stem(this.notedata[System.Array.index(0, this.notedata)].whitenote, this.notedata[System.Array.index(((this.notedata.length - 1) | 0), this.notedata)].whitenote, dur1, direction, MidiSheetMusic.ChordSymbol.NotesOverlap(this.notedata, 0, this.notedata.length));
                    this.stem2 = null;
                }

                /* For whole notes, no stem is drawn. */
                if (dur1 === MidiSheetMusic.NoteDuration.Whole) {
                    this.stem1 = null;
                }
                if (dur2 === MidiSheetMusic.NoteDuration.Whole) {
                    this.stem2 = null;
                }

                this.width = this.MinWidth;
            }
        },
        methods: {
            GetMinWidth: function () {
                /* The width needed for the note circles */
                var result = (Bridge.Int.mul(2, MidiSheetMusic.SheetMusic.NoteHeight) + ((Bridge.Int.div(Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 3), 4)) | 0)) | 0;

                if (this.accidsymbols.length > 0) {
                    result = (result + this.accidsymbols[System.Array.index(0, this.accidsymbols)].MinWidth) | 0;
                    for (var i = 1; i < this.accidsymbols.length; i = (i + 1) | 0) {
                        var accid = this.accidsymbols[System.Array.index(i, this.accidsymbols)];
                        var prev = this.accidsymbols[System.Array.index(((i - 1) | 0), this.accidsymbols)];
                        if (accid.Note.Dist(prev.Note) < 6) {
                            result = (result + accid.MinWidth) | 0;
                        }
                    }
                }
                if (this.sheetmusic != null && this.sheetmusic.ShowNoteLetters !== MidiSheetMusic.MidiOptions.NoteNameNone) {
                    result = (result + 8) | 0;
                }
                return result;
            },
            GetAboveStaff: function () {
                var $t;
                /* Find the topmost note in the chord */
                var topnote = this.notedata[System.Array.index(((this.notedata.length - 1) | 0), this.notedata)].whitenote;

                /* The stem.End is the note position where the stem ends.
                  Check if the stem end is higher than the top note.
                */
                if (this.stem1 != null) {
                    topnote = MidiSheetMusic.WhiteNote.Max(topnote, this.stem1.End);
                }
                if (this.stem2 != null) {
                    topnote = MidiSheetMusic.WhiteNote.Max(topnote, this.stem2.End);
                }

                var dist = (Bridge.Int.div(Bridge.Int.mul(topnote.Dist(MidiSheetMusic.WhiteNote.Top(this.clef)), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0;
                var result = 0;
                if (dist > 0) {
                    result = dist;
                }

                /* Check if any accidental symbols extend above the staff */
                $t = Bridge.getEnumerator(this.accidsymbols);
                try {
                    while ($t.moveNext()) {
                        var symbol = $t.Current;
                        if (symbol.AboveStaff > result) {
                            result = symbol.AboveStaff;
                        }
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }return result;
            },
            GetBelowStaff: function () {
                var $t;
                /* Find the bottom note in the chord */
                var bottomnote = this.notedata[System.Array.index(0, this.notedata)].whitenote;

                /* The stem.End is the note position where the stem ends.
                  Check if the stem end is lower than the bottom note.
                */
                if (this.stem1 != null) {
                    bottomnote = MidiSheetMusic.WhiteNote.Min(bottomnote, this.stem1.End);
                }
                if (this.stem2 != null) {
                    bottomnote = MidiSheetMusic.WhiteNote.Min(bottomnote, this.stem2.End);
                }

                var dist = (Bridge.Int.div(Bridge.Int.mul(MidiSheetMusic.WhiteNote.Bottom(this.clef).Dist(bottomnote), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0;

                var result = 0;
                if (dist > 0) {
                    result = dist;
                }

                /* Check if any accidental symbols extend below the staff */
                $t = Bridge.getEnumerator(this.accidsymbols);
                try {
                    while ($t.moveNext()) {
                        var symbol = $t.Current;
                        if (symbol.BelowStaff > result) {
                            result = symbol.BelowStaff;
                        }
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }return result;
            },
            NoteName: function (notenumber, whitenote) {
                if (this.sheetmusic.ShowNoteLetters === MidiSheetMusic.MidiOptions.NoteNameLetter) {
                    return this.Letter(notenumber, whitenote);
                } else if (this.sheetmusic.ShowNoteLetters === MidiSheetMusic.MidiOptions.NoteNameFixedDoReMi) {
                    var fixedDoReMi = System.Array.init([
                        "La", 
                        "Li", 
                        "Ti", 
                        "Do", 
                        "Di", 
                        "Re", 
                        "Ri", 
                        "Mi", 
                        "Fa", 
                        "Fi", 
                        "So", 
                        "Si"
                    ], System.String);
                    var notescale = MidiSheetMusic.NoteScale.FromNumber(notenumber);
                    return fixedDoReMi[System.Array.index(notescale, fixedDoReMi)];
                } else if (this.sheetmusic.ShowNoteLetters === MidiSheetMusic.MidiOptions.NoteNameMovableDoReMi) {
                    var fixedDoReMi1 = System.Array.init([
                        "La", 
                        "Li", 
                        "Ti", 
                        "Do", 
                        "Di", 
                        "Re", 
                        "Ri", 
                        "Mi", 
                        "Fa", 
                        "Fi", 
                        "So", 
                        "Si"
                    ], System.String);
                    var mainscale = this.sheetmusic.MainKey.Notescale();
                    var diff = (MidiSheetMusic.NoteScale.C - mainscale) | 0;
                    notenumber = (notenumber + diff) | 0;
                    if (notenumber < 0) {
                        notenumber = (notenumber + 12) | 0;
                    }
                    var notescale1 = MidiSheetMusic.NoteScale.FromNumber(notenumber);
                    return fixedDoReMi1[System.Array.index(notescale1, fixedDoReMi1)];
                } else if (this.sheetmusic.ShowNoteLetters === MidiSheetMusic.MidiOptions.NoteNameFixedNumber) {
                    var num = System.Array.init([
                        "10", 
                        "11", 
                        "12", 
                        "1", 
                        "2", 
                        "3", 
                        "4", 
                        "5", 
                        "6", 
                        "7", 
                        "8", 
                        "9"
                    ], System.String);
                    var notescale2 = MidiSheetMusic.NoteScale.FromNumber(notenumber);
                    return num[System.Array.index(notescale2, num)];
                } else if (this.sheetmusic.ShowNoteLetters === MidiSheetMusic.MidiOptions.NoteNameMovableNumber) {
                    var num1 = System.Array.init([
                        "10", 
                        "11", 
                        "12", 
                        "1", 
                        "2", 
                        "3", 
                        "4", 
                        "5", 
                        "6", 
                        "7", 
                        "8", 
                        "9"
                    ], System.String);
                    var mainscale1 = this.sheetmusic.MainKey.Notescale();
                    var diff1 = (MidiSheetMusic.NoteScale.C - mainscale1) | 0;
                    notenumber = (notenumber + diff1) | 0;
                    if (notenumber < 0) {
                        notenumber = (notenumber + 12) | 0;
                    }
                    var notescale3 = MidiSheetMusic.NoteScale.FromNumber(notenumber);
                    return num1[System.Array.index(notescale3, num1)];
                } else {
                    return "";
                }
            },
            Letter: function (notenumber, whitenote) {
                var notescale = MidiSheetMusic.NoteScale.FromNumber(notenumber);
                switch (notescale) {
                    case MidiSheetMusic.NoteScale.A: 
                        return "A";
                    case MidiSheetMusic.NoteScale.B: 
                        return "B";
                    case MidiSheetMusic.NoteScale.C: 
                        return "C";
                    case MidiSheetMusic.NoteScale.D: 
                        return "D";
                    case MidiSheetMusic.NoteScale.E: 
                        return "E";
                    case MidiSheetMusic.NoteScale.F: 
                        return "F";
                    case MidiSheetMusic.NoteScale.G: 
                        return "G";
                    case MidiSheetMusic.NoteScale.Asharp: 
                        if (whitenote.Letter === MidiSheetMusic.WhiteNote.A) {
                            return "A#";
                        } else {
                            return "Bb";
                        }
                    case MidiSheetMusic.NoteScale.Csharp: 
                        if (whitenote.Letter === MidiSheetMusic.WhiteNote.C) {
                            return "C#";
                        } else {
                            return "Db";
                        }
                    case MidiSheetMusic.NoteScale.Dsharp: 
                        if (whitenote.Letter === MidiSheetMusic.WhiteNote.D) {
                            return "D#";
                        } else {
                            return "Eb";
                        }
                    case MidiSheetMusic.NoteScale.Fsharp: 
                        if (whitenote.Letter === MidiSheetMusic.WhiteNote.F) {
                            return "F#";
                        } else {
                            return "Gb";
                        }
                    case MidiSheetMusic.NoteScale.Gsharp: 
                        if (whitenote.Letter === MidiSheetMusic.WhiteNote.G) {
                            return "G#";
                        } else {
                            return "Ab";
                        }
                    default: 
                        return "";
                }
            },
            Draw: function (g, pen, ytop) {
                /* Align the chord to the right */
                g.TranslateTransform(((this.Width - this.MinWidth) | 0), 0);

                /* Draw the accidentals. */
                var topstaff = MidiSheetMusic.WhiteNote.Top(this.clef);
                var xpos = this.DrawAccid(g, pen, ytop);

                /* Draw the notes */
                g.TranslateTransform(xpos, 0);
                this.DrawNotes(g, pen, ytop, topstaff);
                if (this.sheetmusic != null && this.sheetmusic.ShowNoteLetters !== 0) {
                    this.DrawNoteLetters(g, pen, ytop, topstaff);
                }

                /* Draw the stems */
                if (this.stem1 != null) {
                    this.stem1.Draw(g, pen, ytop, topstaff);
                }
                if (this.stem2 != null) {
                    this.stem2.Draw(g, pen, ytop, topstaff);
                }

                g.TranslateTransform(((-xpos) | 0), 0);
                g.TranslateTransform(((-(((this.Width - this.MinWidth) | 0))) | 0), 0);
            },
            DrawAccid: function (g, pen, ytop) {
                var $t;
                var xpos = 0;

                var prev = null;
                $t = Bridge.getEnumerator(this.accidsymbols);
                try {
                    while ($t.moveNext()) {
                        var symbol = $t.Current;
                        if (prev != null && symbol.Note.Dist(prev.Note) < 6) {
                            xpos = (xpos + symbol.Width) | 0;
                        }
                        g.TranslateTransform(xpos, 0);
                        symbol.Draw(g, pen, ytop);
                        g.TranslateTransform(((-xpos) | 0), 0);
                        prev = symbol;
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }if (prev != null) {
                    xpos = (xpos + prev.Width) | 0;
                }
                return xpos;
            },
            DrawNotes: function (g, pen, ytop, topstaff) {
                var $t;
                pen.Width = 1;
                $t = Bridge.getEnumerator(this.notedata);
                try {
                    while ($t.moveNext()) {
                        var note = $t.Current;
                        /* Get the x,y position to draw the note */
                        var ynote = (ytop + ((Bridge.Int.div(Bridge.Int.mul(topstaff.Dist(note.whitenote), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0;

                        var xnote = (Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0;
                        if (!note.leftside) {
                            xnote = (xnote + MidiSheetMusic.SheetMusic.NoteWidth) | 0;
                        }

                        /* Draw rotated ellipse.  You must first translate (0,0)
                          to the center of the ellipse.
                        */
                        g.TranslateTransform(((((xnote + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteWidth, 2)) | 0)) | 0) + 1) | 0), ((((ynote - MidiSheetMusic.SheetMusic.LineWidth) | 0) + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0)) | 0));
                        g.RotateTransform(-45);

                        if (this.sheetmusic != null) {
                            pen.Color = this.sheetmusic.NoteColor(note.number);
                        } else {
                            pen.Color = MidiSheetMusic.Color.Black;
                        }

                        if (note.duration === MidiSheetMusic.NoteDuration.Whole || note.duration === MidiSheetMusic.NoteDuration.Half || note.duration === MidiSheetMusic.NoteDuration.DottedHalf) {

                            g.DrawEllipse(pen, ((Bridge.Int.div(((-MidiSheetMusic.SheetMusic.NoteWidth) | 0), 2)) | 0), ((Bridge.Int.div(((-MidiSheetMusic.SheetMusic.NoteHeight) | 0), 2)) | 0), MidiSheetMusic.SheetMusic.NoteWidth, ((MidiSheetMusic.SheetMusic.NoteHeight - 1) | 0));

                            g.DrawEllipse(pen, ((Bridge.Int.div(((-MidiSheetMusic.SheetMusic.NoteWidth) | 0), 2)) | 0), ((((Bridge.Int.div(((-MidiSheetMusic.SheetMusic.NoteHeight) | 0), 2)) | 0) + 1) | 0), MidiSheetMusic.SheetMusic.NoteWidth, ((MidiSheetMusic.SheetMusic.NoteHeight - 2) | 0));

                            g.DrawEllipse(pen, ((Bridge.Int.div(((-MidiSheetMusic.SheetMusic.NoteWidth) | 0), 2)) | 0), ((((Bridge.Int.div(((-MidiSheetMusic.SheetMusic.NoteHeight) | 0), 2)) | 0) + 1) | 0), MidiSheetMusic.SheetMusic.NoteWidth, ((MidiSheetMusic.SheetMusic.NoteHeight - 3) | 0));

                        } else {
                            var brush = MidiSheetMusic.Brushes.Black;
                            if (!Bridge.referenceEquals(pen.Color, MidiSheetMusic.Color.Black)) {
                                brush = new MidiSheetMusic.SolidBrush(pen.Color);
                            }
                            g.FillEllipse(brush, ((Bridge.Int.div(((-MidiSheetMusic.SheetMusic.NoteWidth) | 0), 2)) | 0), ((Bridge.Int.div(((-MidiSheetMusic.SheetMusic.NoteHeight) | 0), 2)) | 0), MidiSheetMusic.SheetMusic.NoteWidth, ((MidiSheetMusic.SheetMusic.NoteHeight - 1) | 0));
                            if (!Bridge.referenceEquals(pen.Color, MidiSheetMusic.Color.Black)) {
                                brush.Dispose();
                            }
                        }

                        pen.Color = MidiSheetMusic.Color.Black;
                        g.DrawEllipse(pen, ((Bridge.Int.div(((-MidiSheetMusic.SheetMusic.NoteWidth) | 0), 2)) | 0), ((Bridge.Int.div(((-MidiSheetMusic.SheetMusic.NoteHeight) | 0), 2)) | 0), MidiSheetMusic.SheetMusic.NoteWidth, ((MidiSheetMusic.SheetMusic.NoteHeight - 1) | 0));

                        g.RotateTransform(45);
                        g.TranslateTransform(((-(((((xnote + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteWidth, 2)) | 0)) | 0) + 1) | 0))) | 0), ((-(((((ynote - MidiSheetMusic.SheetMusic.LineWidth) | 0) + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0)) | 0))) | 0));

                        /* Draw a dot if this is a dotted duration. */
                        if (note.duration === MidiSheetMusic.NoteDuration.DottedHalf || note.duration === MidiSheetMusic.NoteDuration.DottedQuarter || note.duration === MidiSheetMusic.NoteDuration.DottedEighth) {

                            g.FillEllipse(MidiSheetMusic.Brushes.Black, ((((xnote + MidiSheetMusic.SheetMusic.NoteWidth) | 0) + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 3)) | 0)) | 0), ((ynote + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 3)) | 0)) | 0), 4, 4);

                        }

                        /* Draw horizontal lines if note is above/below the staff */
                        var top = topstaff.Add(1);
                        var dist = note.whitenote.Dist(top);
                        var y = (ytop - MidiSheetMusic.SheetMusic.LineWidth) | 0;

                        if (dist >= 2) {
                            for (var i = 2; i <= dist; i = (i + 2) | 0) {
                                y = (y - MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                                g.DrawLine(pen, ((xnote - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0), y, ((((xnote + MidiSheetMusic.SheetMusic.NoteWidth) | 0) + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0), y);
                            }
                        }

                        var bottom = top.Add(-8);
                        y = (((ytop + Bridge.Int.mul((((MidiSheetMusic.SheetMusic.LineSpace + MidiSheetMusic.SheetMusic.LineWidth) | 0)), 4)) | 0) - 1) | 0;
                        dist = bottom.Dist(note.whitenote);
                        if (dist >= 2) {
                            for (var i1 = 2; i1 <= dist; i1 = (i1 + 2) | 0) {
                                y = (y + MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                                g.DrawLine(pen, ((xnote - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0), y, ((((xnote + MidiSheetMusic.SheetMusic.NoteWidth) | 0) + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0), y);
                            }
                        }
                        /* End drawing horizontal lines */

                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }},
            DrawNoteLetters: function (g, pen, ytop, topstaff) {
                var $t;
                var overlap = MidiSheetMusic.ChordSymbol.NotesOverlap(this.notedata, 0, this.notedata.length);
                pen.Width = 1;

                $t = Bridge.getEnumerator(this.notedata);
                try {
                    while ($t.moveNext()) {
                        var note = $t.Current;
                        if (!note.leftside) {
                            /* There's not enought pixel room to show the letter */
                            continue;
                        }

                        /* Get the x,y position to draw the note */
                        var ynote = (ytop + ((Bridge.Int.div(Bridge.Int.mul(topstaff.Dist(note.whitenote), MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0;

                        /* Draw the letter to the right side of the note */
                        var xnote = (MidiSheetMusic.SheetMusic.NoteWidth + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 4)) | 0)) | 0;

                        if (note.duration === MidiSheetMusic.NoteDuration.DottedHalf || note.duration === MidiSheetMusic.NoteDuration.DottedQuarter || note.duration === MidiSheetMusic.NoteDuration.DottedEighth || overlap) {

                            xnote = (xnote + (((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteWidth, 2)) | 0))) | 0;
                        }
                        g.DrawString(this.NoteName(note.number, note.whitenote), MidiSheetMusic.SheetMusic.LetterFont, MidiSheetMusic.Brushes.Black, xnote, ((ynote - ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0)) | 0));
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }},
            toString: function () {
                var $t, $t1;
                var result = System.String.format("ChordSymbol clef={0} start={1} end={2} width={3} hastwostems={4} ", Bridge.box(this.clef, MidiSheetMusic.Clef, System.Enum.toStringFn(MidiSheetMusic.Clef)), Bridge.box(this.StartTime, System.Int32), Bridge.box(this.EndTime, System.Int32), Bridge.box(this.Width, System.Int32), Bridge.box(this.hastwostems, System.Boolean, System.Boolean.toString));
                $t = Bridge.getEnumerator(this.accidsymbols);
                try {
                    while ($t.moveNext()) {
                        var symbol = $t.Current;
                        result = (result || "") + (((symbol.toString() || "") + " ") || "");
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }$t1 = Bridge.getEnumerator(this.notedata);
                try {
                    while ($t1.moveNext()) {
                        var note = $t1.Current;
                        result = (result || "") + ((System.String.format("Note whitenote={0} duration={1} leftside={2} ", note.whitenote, Bridge.box(note.duration, MidiSheetMusic.NoteDuration, System.Enum.toStringFn(MidiSheetMusic.NoteDuration)), Bridge.box(note.leftside, System.Boolean, System.Boolean.toString))) || "");
                    }
                } finally {
                    if (Bridge.is($t1, System.IDisposable)) {
                        $t1.System$IDisposable$dispose();
                    }
                }if (this.stem1 != null) {
                    result = (result || "") + (((this.stem1.toString() || "") + " ") || "");
                }
                if (this.stem2 != null) {
                    result = (result || "") + (((this.stem2.toString() || "") + " ") || "");
                }
                return result;
            }
        }
    });

    Bridge.define("MidiSheetMusic.ClefSymbol", {
        inherits: [MidiSheetMusic.MusicSymbol],
        statics: {
            fields: {
                treble: null,
                bass: null
            },
            methods: {
                LoadImages: function () {
                    if (MidiSheetMusic.ClefSymbol.treble == null) {
                        MidiSheetMusic.ClefSymbol.treble = new MidiSheetMusic.Bitmap(MidiSheetMusic.ClefSymbol, "Resources.Images.treble.png");
                    }

                    if (MidiSheetMusic.ClefSymbol.bass == null) {
                        MidiSheetMusic.ClefSymbol.bass = new MidiSheetMusic.Bitmap(MidiSheetMusic.ClefSymbol, "Resources.Images.bass.png");
                    }

                }
            }
        },
        fields: {
            starttime: 0,
            smallsize: false,
            clef: 0,
            width: 0
        },
        props: {
            StartTime: {
                get: function () {
                    return this.starttime;
                }
            },
            MinWidth: {
                get: function () {
                    if (this.smallsize) {
                        return Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteWidth, 2);
                    } else {
                        return Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteWidth, 3);
                    }
                }
            },
            Width: {
                get: function () {
                    return this.width;
                },
                set: function (value) {
                    this.width = value;
                }
            },
            AboveStaff: {
                get: function () {
                    if (this.clef === MidiSheetMusic.Clef.Treble && !this.smallsize) {
                        return Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2);
                    } else {
                        return 0;
                    }
                }
            },
            BelowStaff: {
                get: function () {
                    if (this.clef === MidiSheetMusic.Clef.Treble && !this.smallsize) {
                        return Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2);
                    } else {
                        if (this.clef === MidiSheetMusic.Clef.Treble && this.smallsize) {
                            return MidiSheetMusic.SheetMusic.NoteHeight;
                        } else {
                            return 0;
                        }
                    }
                }
            }
        },
        ctors: {
            ctor: function (clef, starttime, small) {
                this.$initialize();
                MidiSheetMusic.MusicSymbol.ctor.call(this);
                this.clef = clef;
                this.starttime = starttime;
                this.smallsize = small;
                MidiSheetMusic.ClefSymbol.LoadImages();
                this.width = this.MinWidth;
            }
        },
        methods: {
            Draw: function (g, pen, ytop) {
                g.TranslateTransform(((this.Width - this.MinWidth) | 0), 0);
                var y = ytop;
                var image;
                var height;

                /* Get the image, height, and top y pixel, depending on the clef
                  and the image size.
                */
                if (this.clef === MidiSheetMusic.Clef.Treble) {
                    image = MidiSheetMusic.ClefSymbol.treble;
                    if (this.smallsize) {
                        height = (MidiSheetMusic.SheetMusic.StaffHeight + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.StaffHeight, 4)) | 0)) | 0;
                    } else {
                        height = (((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.StaffHeight), 2)) | 0) + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0)) | 0;
                        y = (ytop - MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                    }
                } else {
                    image = MidiSheetMusic.ClefSymbol.bass;
                    if (this.smallsize) {
                        height = (MidiSheetMusic.SheetMusic.StaffHeight - ((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0;
                    } else {
                        height = (MidiSheetMusic.SheetMusic.StaffHeight - MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                    }
                }

                /* Scale the image width to match the height */
                var imgwidth = (Bridge.Int.div(Bridge.Int.mul(image.Width, height), image.Height)) | 0;
                g.DrawImage(image, 0, y, imgwidth, height);
                g.TranslateTransform(((-(((this.Width - this.MinWidth) | 0))) | 0), 0);
            },
            toString: function () {
                return System.String.format("ClefSymbol clef={0} small={1} width={2}", Bridge.box(this.clef, MidiSheetMusic.Clef, System.Enum.toStringFn(MidiSheetMusic.Clef)), Bridge.box(this.smallsize, System.Boolean, System.Boolean.toString), Bridge.box(this.width, System.Int32));
            }
        }
    });

    Bridge.define("MidiSheetMusic.FileStream", {
        inherits: [MidiSheetMusic.Stream],
        ctors: {
            ctor: function (filename, mode) {
                this.$initialize();
                MidiSheetMusic.Stream.ctor.call(this);
            }
        }
    });

    Bridge.define("MidiSheetMusic.Piano", {
        inherits: [MidiSheetMusic.Control],
        statics: {
            fields: {
                KeysPerOctave: 0,
                MaxOctave: 0,
                WhiteKeyWidth: 0,
                WhiteKeyHeight: 0,
                BlackKeyWidth: 0,
                BlackKeyHeight: 0,
                margin: 0,
                BlackBorder: 0,
                blackKeyOffsets: null
            },
            ctors: {
                init: function () {
                    this.KeysPerOctave = 7;
                    this.MaxOctave = 7;
                }
            }
        },
        fields: {
            gray1Pen: null,
            gray2Pen: null,
            gray3Pen: null,
            gray1Brush: null,
            gray2Brush: null,
            shadeBrush: null,
            shade2Brush: null,
            useTwoColors: false,
            notes: null,
            maxShadeDuration: 0,
            showNoteLetters: 0,
            graphics: null
        },
        ctors: {
            ctor: function () {
                this.$initialize();
                MidiSheetMusic.Control.ctor.call(this);
                var screenwidth = 1024; //System.Windows.Forms.Screen.PrimaryScreen.Bounds.Width;
                if (screenwidth >= 3200) {
                    /* Linux/Mono is reporting width of 4 screens */
                    screenwidth = (Bridge.Int.div(screenwidth, 4)) | 0;
                }
                screenwidth = (Bridge.Int.div(Bridge.Int.mul(screenwidth, 95), 100)) | 0;
                MidiSheetMusic.Piano.WhiteKeyWidth = Bridge.Int.clip32(screenwidth / (51.0));
                if (MidiSheetMusic.Piano.WhiteKeyWidth % 2 !== 0) {
                    MidiSheetMusic.Piano.WhiteKeyWidth = (MidiSheetMusic.Piano.WhiteKeyWidth - 1) | 0;
                }
                MidiSheetMusic.Piano.margin = 0;
                MidiSheetMusic.Piano.BlackBorder = (Bridge.Int.div(MidiSheetMusic.Piano.WhiteKeyWidth, 2)) | 0;
                MidiSheetMusic.Piano.WhiteKeyHeight = Bridge.Int.mul(MidiSheetMusic.Piano.WhiteKeyWidth, 5);
                MidiSheetMusic.Piano.BlackKeyWidth = (Bridge.Int.div(MidiSheetMusic.Piano.WhiteKeyWidth, 2)) | 0;
                MidiSheetMusic.Piano.BlackKeyHeight = (Bridge.Int.div(Bridge.Int.mul(MidiSheetMusic.Piano.WhiteKeyHeight, 5), 9)) | 0;

                this.Width = (((Bridge.Int.mul(MidiSheetMusic.Piano.margin, 2) + Bridge.Int.mul(MidiSheetMusic.Piano.BlackBorder, 2)) | 0) + Bridge.Int.mul(Bridge.Int.mul(MidiSheetMusic.Piano.WhiteKeyWidth, MidiSheetMusic.Piano.KeysPerOctave), MidiSheetMusic.Piano.MaxOctave)) | 0;
                this.Height = (((Bridge.Int.mul(MidiSheetMusic.Piano.margin, 2) + Bridge.Int.mul(MidiSheetMusic.Piano.BlackBorder, 3)) | 0) + MidiSheetMusic.Piano.WhiteKeyHeight) | 0;
                if (MidiSheetMusic.Piano.blackKeyOffsets == null) {
                    MidiSheetMusic.Piano.blackKeyOffsets = System.Array.init([((((MidiSheetMusic.Piano.WhiteKeyWidth - ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyWidth, 2)) | 0)) | 0) - 1) | 0), ((((MidiSheetMusic.Piano.WhiteKeyWidth + ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyWidth, 2)) | 0)) | 0) - 1) | 0), ((Bridge.Int.mul(2, MidiSheetMusic.Piano.WhiteKeyWidth) - ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyWidth, 2)) | 0)) | 0), ((Bridge.Int.mul(2, MidiSheetMusic.Piano.WhiteKeyWidth) + ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyWidth, 2)) | 0)) | 0), ((((Bridge.Int.mul(4, MidiSheetMusic.Piano.WhiteKeyWidth) - ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyWidth, 2)) | 0)) | 0) - 1) | 0), ((((Bridge.Int.mul(4, MidiSheetMusic.Piano.WhiteKeyWidth) + ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyWidth, 2)) | 0)) | 0) - 1) | 0), ((Bridge.Int.mul(5, MidiSheetMusic.Piano.WhiteKeyWidth) - ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyWidth, 2)) | 0)) | 0), ((Bridge.Int.mul(5, MidiSheetMusic.Piano.WhiteKeyWidth) + ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyWidth, 2)) | 0)) | 0), ((Bridge.Int.mul(6, MidiSheetMusic.Piano.WhiteKeyWidth) - ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyWidth, 2)) | 0)) | 0), ((Bridge.Int.mul(6, MidiSheetMusic.Piano.WhiteKeyWidth) + ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyWidth, 2)) | 0)) | 0)], System.Int32);
                }
                var gray1 = MidiSheetMusic.Color.FromRgb(16, 16, 16);
                var gray2 = MidiSheetMusic.Color.FromRgb(90, 90, 90);
                var gray3 = MidiSheetMusic.Color.FromRgb(200, 200, 200);
                var shade1 = MidiSheetMusic.Color.FromRgb(210, 205, 220);
                var shade2 = MidiSheetMusic.Color.FromRgb(150, 200, 220);

                this.gray1Pen = new MidiSheetMusic.Pen(gray1, 1);
                this.gray2Pen = new MidiSheetMusic.Pen(gray2, 1);
                this.gray3Pen = new MidiSheetMusic.Pen(gray3, 1);

                this.gray1Brush = new MidiSheetMusic.SolidBrush(gray1);
                this.gray2Brush = new MidiSheetMusic.SolidBrush(gray2);
                this.shadeBrush = new MidiSheetMusic.SolidBrush(shade1);
                this.shade2Brush = new MidiSheetMusic.SolidBrush(shade2);
                this.showNoteLetters = MidiSheetMusic.MidiOptions.NoteNameNone;
                this.BackColor = MidiSheetMusic.Color.LightGray;
            }
        },
        methods: {
            SetMidiFile: function (midifile, options) {
                var $t;
                if (midifile == null) {
                    this.notes = null;
                    this.useTwoColors = false;
                    return;
                }

                var tracks = midifile.ChangeMidiNotes(options);
                var track = MidiSheetMusic.MidiFile.CombineToSingleTrack(tracks);
                this.notes = track.Notes;

                this.maxShadeDuration = Bridge.Int.mul(midifile.Time.Quarter, 2);

                /* We want to know which track the note came from.
                  Use the 'channel' field to store the track.
                */
                for (var tracknum = 0; tracknum < tracks.Count; tracknum = (tracknum + 1) | 0) {
                    $t = Bridge.getEnumerator(tracks.getItem(tracknum).Notes);
                    try {
                        while ($t.moveNext()) {
                            var note = $t.Current;
                            note.Channel = tracknum;
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }}

                /* When we have exactly two tracks, we assume this is a piano song,
                  and we use different colors for highlighting the left hand and
                  right hand notes.
                */
                this.useTwoColors = false;
                if (tracks.Count === 2) {
                    this.useTwoColors = true;
                }

                this.showNoteLetters = options.showNoteLetters;
                this.Invalidate();
            },
            SetShadeColors: function (c1, c2) {
                this.shadeBrush.Dispose();
                this.shade2Brush.Dispose();
                this.shadeBrush = new MidiSheetMusic.SolidBrush(c1);
                this.shade2Brush = new MidiSheetMusic.SolidBrush(c2);
            },
            DrawOctaveOutline: function (g) {
                var right = Bridge.Int.mul(MidiSheetMusic.Piano.WhiteKeyWidth, MidiSheetMusic.Piano.KeysPerOctave);

                // Draw the bounding rectangle, from C to B
                g.DrawLine(this.gray1Pen, 0, 0, 0, MidiSheetMusic.Piano.WhiteKeyHeight);
                g.DrawLine(this.gray1Pen, right, 0, right, MidiSheetMusic.Piano.WhiteKeyHeight);
                // g.DrawLine(gray1Pen, 0, 0, right, 0);
                g.DrawLine(this.gray1Pen, 0, MidiSheetMusic.Piano.WhiteKeyHeight, right, MidiSheetMusic.Piano.WhiteKeyHeight);
                g.DrawLine(this.gray3Pen, ((right - 1) | 0), 0, ((right - 1) | 0), MidiSheetMusic.Piano.WhiteKeyHeight);
                g.DrawLine(this.gray3Pen, 1, 0, 1, MidiSheetMusic.Piano.WhiteKeyHeight);

                // Draw the line between E and F
                g.DrawLine(this.gray1Pen, Bridge.Int.mul(3, MidiSheetMusic.Piano.WhiteKeyWidth), 0, Bridge.Int.mul(3, MidiSheetMusic.Piano.WhiteKeyWidth), MidiSheetMusic.Piano.WhiteKeyHeight);
                g.DrawLine(this.gray3Pen, ((Bridge.Int.mul(3, MidiSheetMusic.Piano.WhiteKeyWidth) - 1) | 0), 0, ((Bridge.Int.mul(3, MidiSheetMusic.Piano.WhiteKeyWidth) - 1) | 0), MidiSheetMusic.Piano.WhiteKeyHeight);
                g.DrawLine(this.gray3Pen, ((Bridge.Int.mul(3, MidiSheetMusic.Piano.WhiteKeyWidth) + 1) | 0), 0, ((Bridge.Int.mul(3, MidiSheetMusic.Piano.WhiteKeyWidth) + 1) | 0), MidiSheetMusic.Piano.WhiteKeyHeight);

                // Draw the sides/bottom of the black keys
                for (var i = 0; i < 10; i = (i + 2) | 0) {
                    var x1 = MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(i, MidiSheetMusic.Piano.blackKeyOffsets)];
                    var x2 = MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(((i + 1) | 0), MidiSheetMusic.Piano.blackKeyOffsets)];

                    g.DrawLine(this.gray1Pen, x1, 0, x1, MidiSheetMusic.Piano.BlackKeyHeight);
                    g.DrawLine(this.gray1Pen, x2, 0, x2, MidiSheetMusic.Piano.BlackKeyHeight);
                    g.DrawLine(this.gray1Pen, x1, MidiSheetMusic.Piano.BlackKeyHeight, x2, MidiSheetMusic.Piano.BlackKeyHeight);
                    g.DrawLine(this.gray2Pen, ((x1 - 1) | 0), 0, ((x1 - 1) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 1) | 0));
                    g.DrawLine(this.gray2Pen, ((x2 + 1) | 0), 0, ((x2 + 1) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 1) | 0));
                    g.DrawLine(this.gray2Pen, ((x1 - 1) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 1) | 0), ((x2 + 1) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 1) | 0));
                    g.DrawLine(this.gray3Pen, ((x1 - 2) | 0), 0, ((x1 - 2) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 2) | 0));
                    g.DrawLine(this.gray3Pen, ((x2 + 2) | 0), 0, ((x2 + 2) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 2) | 0));
                    g.DrawLine(this.gray3Pen, ((x1 - 2) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 2) | 0), ((x2 + 2) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 2) | 0));
                }

                // Draw the bottom-half of the white keys
                for (var i1 = 1; i1 < MidiSheetMusic.Piano.KeysPerOctave; i1 = (i1 + 1) | 0) {
                    if (i1 === 3) {
                        continue; // we draw the line between E and F above
                    }
                    g.DrawLine(this.gray1Pen, Bridge.Int.mul(i1, MidiSheetMusic.Piano.WhiteKeyWidth), MidiSheetMusic.Piano.BlackKeyHeight, Bridge.Int.mul(i1, MidiSheetMusic.Piano.WhiteKeyWidth), MidiSheetMusic.Piano.WhiteKeyHeight);
                    var pen1 = this.gray2Pen;
                    var pen2 = this.gray3Pen;
                    g.DrawLine(pen1, ((Bridge.Int.mul(i1, MidiSheetMusic.Piano.WhiteKeyWidth) - 1) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 1) | 0), ((Bridge.Int.mul(i1, MidiSheetMusic.Piano.WhiteKeyWidth) - 1) | 0), MidiSheetMusic.Piano.WhiteKeyHeight);
                    g.DrawLine(pen2, ((Bridge.Int.mul(i1, MidiSheetMusic.Piano.WhiteKeyWidth) + 1) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 1) | 0), ((Bridge.Int.mul(i1, MidiSheetMusic.Piano.WhiteKeyWidth) + 1) | 0), MidiSheetMusic.Piano.WhiteKeyHeight);
                }

            },
            DrawOutline: function (g) {
                for (var octave = 0; octave < MidiSheetMusic.Piano.MaxOctave; octave = (octave + 1) | 0) {
                    g.TranslateTransform(Bridge.Int.mul(Bridge.Int.mul(octave, MidiSheetMusic.Piano.WhiteKeyWidth), MidiSheetMusic.Piano.KeysPerOctave), 0);
                    this.DrawOctaveOutline(g);
                    g.TranslateTransform(((-(Bridge.Int.mul(Bridge.Int.mul(octave, MidiSheetMusic.Piano.WhiteKeyWidth), MidiSheetMusic.Piano.KeysPerOctave))) | 0), 0);
                }
            },
            DrawBlackKeys: function (g) {
                for (var octave = 0; octave < MidiSheetMusic.Piano.MaxOctave; octave = (octave + 1) | 0) {
                    g.TranslateTransform(Bridge.Int.mul(Bridge.Int.mul(octave, MidiSheetMusic.Piano.WhiteKeyWidth), MidiSheetMusic.Piano.KeysPerOctave), 0);
                    for (var i = 0; i < 10; i = (i + 2) | 0) {
                        var x1 = MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(i, MidiSheetMusic.Piano.blackKeyOffsets)];
                        var x2 = MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(((i + 1) | 0), MidiSheetMusic.Piano.blackKeyOffsets)];
                        g.FillRectangle(this.gray1Brush, x1, 0, MidiSheetMusic.Piano.BlackKeyWidth, MidiSheetMusic.Piano.BlackKeyHeight);
                        g.FillRectangle(this.gray2Brush, ((x1 + 1) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight - ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyHeight, 8)) | 0)) | 0), ((MidiSheetMusic.Piano.BlackKeyWidth - 2) | 0), ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyHeight, 8)) | 0));
                    }
                    g.TranslateTransform(((-(Bridge.Int.mul(Bridge.Int.mul(octave, MidiSheetMusic.Piano.WhiteKeyWidth), MidiSheetMusic.Piano.KeysPerOctave))) | 0), 0);
                }
            },
            DrawBlackBorder: function (g) {
                var PianoWidth = Bridge.Int.mul(Bridge.Int.mul(MidiSheetMusic.Piano.WhiteKeyWidth, MidiSheetMusic.Piano.KeysPerOctave), MidiSheetMusic.Piano.MaxOctave);
                g.FillRectangle(this.gray1Brush, MidiSheetMusic.Piano.margin, MidiSheetMusic.Piano.margin, ((PianoWidth + Bridge.Int.mul(MidiSheetMusic.Piano.BlackBorder, 2)) | 0), ((MidiSheetMusic.Piano.BlackBorder - 2) | 0));
                g.FillRectangle(this.gray1Brush, MidiSheetMusic.Piano.margin, MidiSheetMusic.Piano.margin, MidiSheetMusic.Piano.BlackBorder, ((MidiSheetMusic.Piano.WhiteKeyHeight + Bridge.Int.mul(MidiSheetMusic.Piano.BlackBorder, 3)) | 0));
                g.FillRectangle(this.gray1Brush, MidiSheetMusic.Piano.margin, ((((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0) + MidiSheetMusic.Piano.WhiteKeyHeight) | 0), ((Bridge.Int.mul(MidiSheetMusic.Piano.BlackBorder, 2) + PianoWidth) | 0), Bridge.Int.mul(MidiSheetMusic.Piano.BlackBorder, 2));
                g.FillRectangle(this.gray1Brush, ((((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0) + PianoWidth) | 0), MidiSheetMusic.Piano.margin, MidiSheetMusic.Piano.BlackBorder, ((MidiSheetMusic.Piano.WhiteKeyHeight + Bridge.Int.mul(MidiSheetMusic.Piano.BlackBorder, 3)) | 0));

                g.DrawLine(this.gray2Pen, ((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0), ((((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0) - 1) | 0), ((((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0) + PianoWidth) | 0), ((((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0) - 1) | 0));

                g.TranslateTransform(((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0), ((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0));

                // Draw the gray bottoms of the white keys  
                for (var i = 0; i < 49; i = (i + 1) | 0) {
                    g.FillRectangle(this.gray2Brush, ((Bridge.Int.mul(i, MidiSheetMusic.Piano.WhiteKeyWidth) + 1) | 0), ((MidiSheetMusic.Piano.WhiteKeyHeight + 2) | 0), ((MidiSheetMusic.Piano.WhiteKeyWidth - 2) | 0), ((Bridge.Int.div(MidiSheetMusic.Piano.BlackBorder, 2)) | 0));
                }
                g.TranslateTransform(((-(((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0))) | 0), ((-(((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0))) | 0));
            },
            DrawNoteLetters: function (g) {
                var letters = System.Array.init([
                    "C", 
                    "D", 
                    "E", 
                    "F", 
                    "G", 
                    "A", 
                    "B"
                ], System.String);
                var numbers = System.Array.init([
                    "1", 
                    "3", 
                    "5", 
                    "6", 
                    "8", 
                    "10", 
                    "12"
                ], System.String);
                var names;
                if (this.showNoteLetters === MidiSheetMusic.MidiOptions.NoteNameLetter) {
                    names = letters;
                } else if (this.showNoteLetters === MidiSheetMusic.MidiOptions.NoteNameFixedNumber) {
                    names = numbers;
                } else {
                    return;
                }
                g.TranslateTransform(((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0), ((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0));
                for (var octave = 0; octave < MidiSheetMusic.Piano.MaxOctave; octave = (octave + 1) | 0) {
                    for (var i = 0; i < MidiSheetMusic.Piano.KeysPerOctave; i = (i + 1) | 0) {
                        g.DrawString(names[System.Array.index(i, names)], MidiSheetMusic.SheetMusic.LetterFont, MidiSheetMusic.Brushes.White, ((Bridge.Int.mul((((Bridge.Int.mul(octave, MidiSheetMusic.Piano.KeysPerOctave) + i) | 0)), MidiSheetMusic.Piano.WhiteKeyWidth) + ((Bridge.Int.div(MidiSheetMusic.Piano.WhiteKeyWidth, 3)) | 0)) | 0), ((MidiSheetMusic.Piano.WhiteKeyHeight + ((Bridge.Int.div(Bridge.Int.mul(MidiSheetMusic.Piano.BlackBorder, 3), 4)) | 0)) | 0));
                    }
                }
                g.TranslateTransform(((-(((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0))) | 0), ((-(((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0))) | 0));
            },
            OnPaint: function (e) {
                var g = e.Graphics();
                g.SmoothingMode = MidiSheetMusic.SmoothingMode.None;
                g.TranslateTransform(((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0), ((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0));
                g.FillRectangle(MidiSheetMusic.Brushes.White, 0, 0, Bridge.Int.mul(Bridge.Int.mul(MidiSheetMusic.Piano.WhiteKeyWidth, MidiSheetMusic.Piano.KeysPerOctave), MidiSheetMusic.Piano.MaxOctave), MidiSheetMusic.Piano.WhiteKeyHeight);
                this.DrawBlackKeys(g);
                this.DrawOutline(g);
                g.TranslateTransform(((-(((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0))) | 0), ((-(((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0))) | 0));
                this.DrawBlackBorder(g);
                if (this.showNoteLetters !== MidiSheetMusic.MidiOptions.NoteNameNone) {
                    this.DrawNoteLetters(g);
                }
                g.SmoothingMode = MidiSheetMusic.SmoothingMode.AntiAlias;
            },
            ShadeOneNote: function (g, notenumber, brush) {
                var octave = (Bridge.Int.div(notenumber, 12)) | 0;
                var notescale = notenumber % 12;

                octave = (octave - 2) | 0;
                if (octave < 0 || octave >= MidiSheetMusic.Piano.MaxOctave) {
                    return;
                }

                g.TranslateTransform(Bridge.Int.mul(Bridge.Int.mul(octave, MidiSheetMusic.Piano.WhiteKeyWidth), MidiSheetMusic.Piano.KeysPerOctave), 0);
                var x1, x2, x3;

                var bottomHalfHeight = (MidiSheetMusic.Piano.WhiteKeyHeight - (((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0))) | 0;

                /* notescale goes from 0 to 11, from C to B. */
                switch (notescale) {
                    case 0:  /* C */
                        x1 = 2;
                        x2 = (MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(0, MidiSheetMusic.Piano.blackKeyOffsets)] - 2) | 0;
                        g.FillRectangle(brush, x1, 0, ((x2 - x1) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0));
                        g.FillRectangle(brush, x1, ((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0), ((MidiSheetMusic.Piano.WhiteKeyWidth - 3) | 0), bottomHalfHeight);
                        break;
                    case 1:  /* C# */
                        x1 = MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(0, MidiSheetMusic.Piano.blackKeyOffsets)];
                        x2 = MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(1, MidiSheetMusic.Piano.blackKeyOffsets)];
                        g.FillRectangle(brush, x1, 0, ((x2 - x1) | 0), MidiSheetMusic.Piano.BlackKeyHeight);
                        if (Bridge.referenceEquals(brush, this.gray1Brush)) {
                            g.FillRectangle(this.gray2Brush, ((x1 + 1) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight - ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyHeight, 8)) | 0)) | 0), ((MidiSheetMusic.Piano.BlackKeyWidth - 2) | 0), ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyHeight, 8)) | 0));
                        }
                        break;
                    case 2:  /* D */
                        x1 = (MidiSheetMusic.Piano.WhiteKeyWidth + 2) | 0;
                        x2 = (MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(1, MidiSheetMusic.Piano.blackKeyOffsets)] + 3) | 0;
                        x3 = (MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(2, MidiSheetMusic.Piano.blackKeyOffsets)] - 2) | 0;
                        g.FillRectangle(brush, x2, 0, ((x3 - x2) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0));
                        g.FillRectangle(brush, x1, ((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0), ((MidiSheetMusic.Piano.WhiteKeyWidth - 3) | 0), bottomHalfHeight);
                        break;
                    case 3:  /* D# */
                        x1 = MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(2, MidiSheetMusic.Piano.blackKeyOffsets)];
                        x2 = MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(3, MidiSheetMusic.Piano.blackKeyOffsets)];
                        g.FillRectangle(brush, x1, 0, MidiSheetMusic.Piano.BlackKeyWidth, MidiSheetMusic.Piano.BlackKeyHeight);
                        if (Bridge.referenceEquals(brush, this.gray1Brush)) {
                            g.FillRectangle(this.gray2Brush, ((x1 + 1) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight - ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyHeight, 8)) | 0)) | 0), ((MidiSheetMusic.Piano.BlackKeyWidth - 2) | 0), ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyHeight, 8)) | 0));
                        }
                        break;
                    case 4:  /* E */
                        x1 = (Bridge.Int.mul(MidiSheetMusic.Piano.WhiteKeyWidth, 2) + 2) | 0;
                        x2 = (MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(3, MidiSheetMusic.Piano.blackKeyOffsets)] + 3) | 0;
                        x3 = (Bridge.Int.mul(MidiSheetMusic.Piano.WhiteKeyWidth, 3) - 1) | 0;
                        g.FillRectangle(brush, x2, 0, ((x3 - x2) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0));
                        g.FillRectangle(brush, x1, ((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0), ((MidiSheetMusic.Piano.WhiteKeyWidth - 3) | 0), bottomHalfHeight);
                        break;
                    case 5:  /* F */
                        x1 = (Bridge.Int.mul(MidiSheetMusic.Piano.WhiteKeyWidth, 3) + 2) | 0;
                        x2 = (MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(4, MidiSheetMusic.Piano.blackKeyOffsets)] - 2) | 0;
                        x3 = (Bridge.Int.mul(MidiSheetMusic.Piano.WhiteKeyWidth, 4) - 2) | 0;
                        g.FillRectangle(brush, x1, 0, ((x2 - x1) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0));
                        g.FillRectangle(brush, x1, ((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0), ((MidiSheetMusic.Piano.WhiteKeyWidth - 3) | 0), bottomHalfHeight);
                        break;
                    case 6:  /* F# */
                        x1 = MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(4, MidiSheetMusic.Piano.blackKeyOffsets)];
                        x2 = MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(5, MidiSheetMusic.Piano.blackKeyOffsets)];
                        g.FillRectangle(brush, x1, 0, MidiSheetMusic.Piano.BlackKeyWidth, MidiSheetMusic.Piano.BlackKeyHeight);
                        if (Bridge.referenceEquals(brush, this.gray1Brush)) {
                            g.FillRectangle(this.gray2Brush, ((x1 + 1) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight - ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyHeight, 8)) | 0)) | 0), ((MidiSheetMusic.Piano.BlackKeyWidth - 2) | 0), ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyHeight, 8)) | 0));
                        }
                        break;
                    case 7:  /* G */
                        x1 = (Bridge.Int.mul(MidiSheetMusic.Piano.WhiteKeyWidth, 4) + 2) | 0;
                        x2 = (MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(5, MidiSheetMusic.Piano.blackKeyOffsets)] + 3) | 0;
                        x3 = (MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(6, MidiSheetMusic.Piano.blackKeyOffsets)] - 2) | 0;
                        g.FillRectangle(brush, x2, 0, ((x3 - x2) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0));
                        g.FillRectangle(brush, x1, ((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0), ((MidiSheetMusic.Piano.WhiteKeyWidth - 3) | 0), bottomHalfHeight);
                        break;
                    case 8:  /* G# */
                        x1 = MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(6, MidiSheetMusic.Piano.blackKeyOffsets)];
                        x2 = MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(7, MidiSheetMusic.Piano.blackKeyOffsets)];
                        g.FillRectangle(brush, x1, 0, MidiSheetMusic.Piano.BlackKeyWidth, MidiSheetMusic.Piano.BlackKeyHeight);
                        if (Bridge.referenceEquals(brush, this.gray1Brush)) {
                            g.FillRectangle(this.gray2Brush, ((x1 + 1) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight - ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyHeight, 8)) | 0)) | 0), ((MidiSheetMusic.Piano.BlackKeyWidth - 2) | 0), ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyHeight, 8)) | 0));
                        }
                        break;
                    case 9:  /* A */
                        x1 = (Bridge.Int.mul(MidiSheetMusic.Piano.WhiteKeyWidth, 5) + 2) | 0;
                        x2 = (MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(7, MidiSheetMusic.Piano.blackKeyOffsets)] + 3) | 0;
                        x3 = (MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(8, MidiSheetMusic.Piano.blackKeyOffsets)] - 2) | 0;
                        g.FillRectangle(brush, x2, 0, ((x3 - x2) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0));
                        g.FillRectangle(brush, x1, ((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0), ((MidiSheetMusic.Piano.WhiteKeyWidth - 3) | 0), bottomHalfHeight);
                        break;
                    case 10:  /* A# */
                        x1 = MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(8, MidiSheetMusic.Piano.blackKeyOffsets)];
                        x2 = MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(9, MidiSheetMusic.Piano.blackKeyOffsets)];
                        g.FillRectangle(brush, x1, 0, MidiSheetMusic.Piano.BlackKeyWidth, MidiSheetMusic.Piano.BlackKeyHeight);
                        if (Bridge.referenceEquals(brush, this.gray1Brush)) {
                            g.FillRectangle(this.gray2Brush, ((x1 + 1) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight - ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyHeight, 8)) | 0)) | 0), ((MidiSheetMusic.Piano.BlackKeyWidth - 2) | 0), ((Bridge.Int.div(MidiSheetMusic.Piano.BlackKeyHeight, 8)) | 0));
                        }
                        break;
                    case 11:  /* B */
                        x1 = (Bridge.Int.mul(MidiSheetMusic.Piano.WhiteKeyWidth, 6) + 2) | 0;
                        x2 = (MidiSheetMusic.Piano.blackKeyOffsets[System.Array.index(9, MidiSheetMusic.Piano.blackKeyOffsets)] + 3) | 0;
                        x3 = (Bridge.Int.mul(MidiSheetMusic.Piano.WhiteKeyWidth, MidiSheetMusic.Piano.KeysPerOctave) - 1) | 0;
                        g.FillRectangle(brush, x2, 0, ((x3 - x2) | 0), ((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0));
                        g.FillRectangle(brush, x1, ((MidiSheetMusic.Piano.BlackKeyHeight + 3) | 0), ((MidiSheetMusic.Piano.WhiteKeyWidth - 3) | 0), bottomHalfHeight);
                        break;
                    default: 
                        break;
                }
                g.TranslateTransform(((-(Bridge.Int.mul(Bridge.Int.mul(octave, MidiSheetMusic.Piano.WhiteKeyWidth), MidiSheetMusic.Piano.KeysPerOctave))) | 0), 0);
            },
            FindClosestStartTime: function (pulseTime) {
                var left = 0;
                var right = (this.notes.Count - 1) | 0;

                while (((right - left) | 0) > 1) {
                    var i = (Bridge.Int.div((((right + left) | 0)), 2)) | 0;
                    if (this.notes.getItem(left).StartTime === pulseTime) {
                        break;
                    } else {
                        if (this.notes.getItem(i).StartTime <= pulseTime) {
                            left = i;
                        } else {
                            right = i;
                        }
                    }
                }
                while (left >= 1 && (this.notes.getItem(((left - 1) | 0)).StartTime === this.notes.getItem(left).StartTime)) {
                    left = (left - 1) | 0;
                }
                return left;
            },
            NextStartTimeSameTrack: function (i) {
                var start = this.notes.getItem(i).StartTime;
                var end = this.notes.getItem(i).EndTime;
                var track = this.notes.getItem(i).Channel;

                while (i < this.notes.Count) {
                    if (this.notes.getItem(i).Channel !== track) {
                        i = (i + 1) | 0;
                        continue;
                    }
                    if (this.notes.getItem(i).StartTime > start) {
                        return this.notes.getItem(i).StartTime;
                    }
                    end = Math.max(end, this.notes.getItem(i).EndTime);
                    i = (i + 1) | 0;
                }
                return end;
            },
            NextStartTime: function (i) {
                var start = this.notes.getItem(i).StartTime;
                var end = this.notes.getItem(i).EndTime;

                while (i < this.notes.Count) {
                    if (this.notes.getItem(i).StartTime > start) {
                        return this.notes.getItem(i).StartTime;
                    }
                    end = Math.max(end, this.notes.getItem(i).EndTime);
                    i = (i + 1) | 0;
                }
                return end;
            },
            ShadeNotes: function (currentPulseTime, prevPulseTime) {
                if (this.notes == null || this.notes.Count === 0) {
                    return;
                }
                if (this.graphics == null) {
                    this.graphics = this.CreateGraphics("shadeNotes_piano");
                }
                this.graphics.SmoothingMode = MidiSheetMusic.SmoothingMode.None;
                this.graphics.TranslateTransform(((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0), ((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0));

                /* Loop through the Midi notes.
                  Unshade notes where StartTime <= prevPulseTime < next StartTime
                  Shade notes where StartTime <= currentPulseTime < next StartTime
                */
                var lastShadedIndex = this.FindClosestStartTime(((prevPulseTime - Bridge.Int.mul(this.maxShadeDuration, 2)) | 0));
                for (var i = lastShadedIndex; i < this.notes.Count; i = (i + 1) | 0) {
                    var start = this.notes.getItem(i).StartTime;
                    var end = this.notes.getItem(i).EndTime;
                    var notenumber = this.notes.getItem(i).Number;
                    var nextStart = this.NextStartTime(i);
                    var nextStartTrack = this.NextStartTimeSameTrack(i);
                    end = Math.max(end, nextStartTrack);
                    end = Math.min(end, ((((start + this.maxShadeDuration) | 0) - 1) | 0));

                    /* If we've past the previous and current times, we're done. */
                    if ((start > prevPulseTime) && (start > currentPulseTime)) {
                        break;
                    }

                    /* If shaded notes are the same, we're done */
                    if ((start <= currentPulseTime) && (currentPulseTime < nextStart) && (currentPulseTime < end) && (start <= prevPulseTime) && (prevPulseTime < nextStart) && (prevPulseTime < end)) {
                        break;
                    }

                    /* If the note is in the current time, shade it */
                    if ((start <= currentPulseTime) && (currentPulseTime < end)) {
                        if (this.useTwoColors) {
                            if (this.notes.getItem(i).Channel === 1) {
                                this.ShadeOneNote(this.graphics, notenumber, this.shade2Brush);
                            } else {
                                this.ShadeOneNote(this.graphics, notenumber, this.shadeBrush);
                            }
                        } else {
                            this.ShadeOneNote(this.graphics, notenumber, this.shadeBrush);
                        }
                    } else if ((start <= prevPulseTime) && (prevPulseTime < end)) {
                        var num = notenumber % 12;
                        if (num === 1 || num === 3 || num === 6 || num === 8 || num === 10) {
                            this.ShadeOneNote(this.graphics, notenumber, this.gray1Brush);
                        } else {
                            this.ShadeOneNote(this.graphics, notenumber, MidiSheetMusic.Brushes.White);
                        }
                    }
                }
                this.graphics.TranslateTransform(((-(((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0))) | 0), ((-(((MidiSheetMusic.Piano.margin + MidiSheetMusic.Piano.BlackBorder) | 0))) | 0));
                this.graphics.SmoothingMode = MidiSheetMusic.SmoothingMode.AntiAlias;
            }
        }
    });

    Bridge.define("MidiSheetMusic.RestSymbol", {
        inherits: [MidiSheetMusic.MusicSymbol],
        fields: {
            starttime: 0,
            duration: 0,
            width: 0
        },
        props: {
            StartTime: {
                get: function () {
                    return this.starttime;
                }
            },
            Width: {
                get: function () {
                    return this.width;
                },
                set: function (value) {
                    this.width = value;
                }
            },
            MinWidth: {
                get: function () {
                    return ((Bridge.Int.mul(2, MidiSheetMusic.SheetMusic.NoteHeight) + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0)) | 0);
                }
            },
            AboveStaff: {
                get: function () {
                    return 0;
                }
            },
            BelowStaff: {
                get: function () {
                    return 0;
                }
            }
        },
        ctors: {
            ctor: function (start, dur) {
                this.$initialize();
                MidiSheetMusic.MusicSymbol.ctor.call(this);
                this.starttime = start;
                this.duration = dur;
                this.width = this.MinWidth;
            }
        },
        methods: {
            Draw: function (g, pen, ytop) {
                /* Align the rest symbol to the right */
                g.TranslateTransform(((this.Width - this.MinWidth) | 0), 0);
                g.TranslateTransform(((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0), 0);

                if (this.duration === MidiSheetMusic.NoteDuration.Whole) {
                    this.DrawWhole(g, pen, ytop);
                } else if (this.duration === MidiSheetMusic.NoteDuration.Half) {
                    this.DrawHalf(g, pen, ytop);
                } else if (this.duration === MidiSheetMusic.NoteDuration.Quarter) {
                    this.DrawQuarter(g, pen, ytop);
                } else if (this.duration === MidiSheetMusic.NoteDuration.Eighth) {
                    this.DrawEighth(g, pen, ytop);
                }
                g.TranslateTransform(((Bridge.Int.div(((-MidiSheetMusic.SheetMusic.NoteHeight) | 0), 2)) | 0), 0);
                g.TranslateTransform(((-(((this.Width - this.MinWidth) | 0))) | 0), 0);
            },
            DrawWhole: function (g, pen, ytop) {
                var y = (ytop + MidiSheetMusic.SheetMusic.NoteHeight) | 0;

                g.FillRectangle(MidiSheetMusic.Brushes.Black, 0, y, MidiSheetMusic.SheetMusic.NoteWidth, ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0));
            },
            DrawHalf: function (g, pen, ytop) {
                var y = (((ytop + MidiSheetMusic.SheetMusic.NoteHeight) | 0) + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0)) | 0;

                g.FillRectangle(MidiSheetMusic.Brushes.Black, 0, y, MidiSheetMusic.SheetMusic.NoteWidth, ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0));
            },
            DrawQuarter: function (g, pen, ytop) {
                pen.EndCap = MidiSheetMusic.LineCap.Flat;

                var y = (ytop + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0)) | 0;
                var x = 2;
                var xend = (x + ((Bridge.Int.div(Bridge.Int.mul(2, MidiSheetMusic.SheetMusic.NoteHeight), 3)) | 0)) | 0;
                pen.Width = 1;
                g.DrawLine(pen, x, y, ((xend - 1) | 0), ((((y + MidiSheetMusic.SheetMusic.NoteHeight) | 0) - 1) | 0));

                pen.Width = (Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0;
                y = (((ytop + MidiSheetMusic.SheetMusic.NoteHeight) | 0) + 1) | 0;
                g.DrawLine(pen, ((xend - 2) | 0), y, x, ((y + MidiSheetMusic.SheetMusic.NoteHeight) | 0));

                pen.Width = 1;
                y = (((ytop + Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0) - 1) | 0;
                g.DrawLine(pen, 0, y, ((xend + 2) | 0), ((y + MidiSheetMusic.SheetMusic.NoteHeight) | 0));

                pen.Width = (Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0;
                if (MidiSheetMusic.SheetMusic.NoteHeight === 6) {
                    g.DrawLine(pen, xend, ((((y + 1) | 0) + ((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.NoteHeight), 4)) | 0)) | 0), ((Bridge.Int.div(x, 2)) | 0), ((((y + 1) | 0) + ((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.NoteHeight), 4)) | 0)) | 0));
                } else { /* NoteHeight == 8 */
                    g.DrawLine(pen, xend, ((y + ((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.NoteHeight), 4)) | 0)) | 0), ((Bridge.Int.div(x, 2)) | 0), ((y + ((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.NoteHeight), 4)) | 0)) | 0));
                }

                pen.Width = 1;
                g.DrawLine(pen, 0, ((((y + ((Bridge.Int.div(Bridge.Int.mul(2, MidiSheetMusic.SheetMusic.NoteHeight), 3)) | 0)) | 0) + 1) | 0), ((xend - 1) | 0), ((y + ((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.NoteHeight), 2)) | 0)) | 0));
            },
            DrawEighth: function (g, pen, ytop) {
                var y = (((ytop + MidiSheetMusic.SheetMusic.NoteHeight) | 0) - 1) | 0;
                g.FillEllipse(MidiSheetMusic.Brushes.Black, 0, ((y + 1) | 0), ((MidiSheetMusic.SheetMusic.LineSpace - 1) | 0), ((MidiSheetMusic.SheetMusic.LineSpace - 1) | 0));
                pen.Width = 1;
                g.DrawLine(pen, ((Bridge.Int.div((((MidiSheetMusic.SheetMusic.LineSpace - 2) | 0)), 2)) | 0), ((((y + MidiSheetMusic.SheetMusic.LineSpace) | 0) - 1) | 0), ((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.LineSpace), 2)) | 0), ((y + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0));
                g.DrawLine(pen, ((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.LineSpace), 2)) | 0), ((y + ((Bridge.Int.div(MidiSheetMusic.SheetMusic.LineSpace, 2)) | 0)) | 0), ((Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.LineSpace), 4)) | 0), ((y + Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0));
            },
            toString: function () {
                return System.String.format("RestSymbol starttime={0} duration={1} width={2}", Bridge.box(this.starttime, System.Int32), Bridge.box(this.duration, MidiSheetMusic.NoteDuration, System.Enum.toStringFn(MidiSheetMusic.NoteDuration)), Bridge.box(this.width, System.Int32));
            }
        }
    });

    Bridge.define("MidiSheetMusic.SheetMusic", {
        inherits: [MidiSheetMusic.Control],
        statics: {
            fields: {
                LineWidth: 0,
                LeftMargin: 0,
                TitleHeight: 0,
                LineSpace: 0,
                StaffHeight: 0,
                NoteHeight: 0,
                NoteWidth: 0,
                PageWidth: 0,
                PageHeight: 0,
                LetterFont: null
            },
            ctors: {
                init: function () {
                    this.LineWidth = 1;
                    this.LeftMargin = 4;
                    this.TitleHeight = 14;
                    this.PageWidth = 800;
                    this.PageHeight = 1050;
                },
                ctor: function () {
                    MidiSheetMusic.SheetMusic.SetNoteSize(false);
                }
            },
            methods: {
                IsChord: function (symbol) {
                    return Bridge.is(symbol, MidiSheetMusic.ChordSymbol);
                },
                FindConsecutiveChords: function (symbols, time, startIndex, chordIndexes, horizDistance) {

                    var i = startIndex;
                    var numChords = chordIndexes.length;

                    while (true) {
                        horizDistance.v = 0;

                        /* Find the starting chord */
                        while (i < ((symbols.Count - numChords) | 0)) {
                            if (Bridge.is(symbols.getItem(i), MidiSheetMusic.ChordSymbol)) {
                                var c = Bridge.cast(symbols.getItem(i), MidiSheetMusic.ChordSymbol);
                                if (c.Stem != null) {
                                    break;
                                }
                            }
                            i = (i + 1) | 0;
                        }
                        if (i >= ((symbols.Count - numChords) | 0)) {
                            chordIndexes[System.Array.index(0, chordIndexes)] = -1;
                            return false;
                        }
                        chordIndexes[System.Array.index(0, chordIndexes)] = i;
                        var foundChords = true;
                        for (var chordIndex = 1; chordIndex < numChords; chordIndex = (chordIndex + 1) | 0) {
                            i = (i + 1) | 0;
                            var remaining = (((numChords - 1) | 0) - chordIndex) | 0;
                            while ((i < ((symbols.Count - remaining) | 0)) && (Bridge.is(symbols.getItem(i), MidiSheetMusic.BlankSymbol))) {
                                horizDistance.v = (horizDistance.v + symbols.getItem(i).Width) | 0;
                                i = (i + 1) | 0;
                            }
                            if (i >= ((symbols.Count - remaining) | 0)) {
                                return false;
                            }
                            if (!(Bridge.is(symbols.getItem(i), MidiSheetMusic.ChordSymbol))) {
                                foundChords = false;
                                break;
                            }
                            chordIndexes[System.Array.index(chordIndex, chordIndexes)] = i;
                            horizDistance.v = (horizDistance.v + symbols.getItem(i).Width) | 0;
                        }
                        if (foundChords) {
                            return true;
                        }

                        /* Else, start searching again from index i */
                    }
                },
                CreateBeamedChords: function (allsymbols, time, numChords, startBeat) {
                    var $t;
                    var chordIndexes = System.Array.init(numChords, 0, System.Int32);
                    var chords = System.Array.init(numChords, null, MidiSheetMusic.ChordSymbol);

                    $t = Bridge.getEnumerator(allsymbols);
                    try {
                        while ($t.moveNext()) {
                            var symbols = $t.Current;
                            var startIndex = 0;
                            while (true) {
                                var horizDistance = { v : 0 };
                                var found = MidiSheetMusic.SheetMusic.FindConsecutiveChords(symbols, time, startIndex, chordIndexes, horizDistance);
                                if (!found) {
                                    break;
                                }
                                for (var i = 0; i < numChords; i = (i + 1) | 0) {
                                    chords[System.Array.index(i, chords)] = Bridge.cast(symbols.getItem(chordIndexes[System.Array.index(i, chordIndexes)]), MidiSheetMusic.ChordSymbol);
                                }

                                if (MidiSheetMusic.ChordSymbol.CanCreateBeam(chords, time, startBeat)) {
                                    MidiSheetMusic.ChordSymbol.CreateBeam(chords, horizDistance.v);
                                    startIndex = (chordIndexes[System.Array.index(((numChords - 1) | 0), chordIndexes)] + 1) | 0;
                                } else {
                                    startIndex = (chordIndexes[System.Array.index(0, chordIndexes)] + 1) | 0;
                                }

                                /* What is the value of startIndex here?
                                  If we created a beam, we start after the last chord.
                                  If we failed to create a beam, we start after the first chord.
                                */
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }},
                CreateAllBeamedChords: function (allsymbols, time) {
                    if ((time.Numerator === 3 && time.Denominator === 4) || (time.Numerator === 6 && time.Denominator === 8) || (time.Numerator === 6 && time.Denominator === 4)) {

                        MidiSheetMusic.SheetMusic.CreateBeamedChords(allsymbols, time, 6, true);
                    }
                    MidiSheetMusic.SheetMusic.CreateBeamedChords(allsymbols, time, 3, true);
                    MidiSheetMusic.SheetMusic.CreateBeamedChords(allsymbols, time, 4, true);
                    MidiSheetMusic.SheetMusic.CreateBeamedChords(allsymbols, time, 2, true);
                    MidiSheetMusic.SheetMusic.CreateBeamedChords(allsymbols, time, 2, false);
                },
                KeySignatureWidth: function (key) {
                    var $t;
                    var clefsym = new MidiSheetMusic.ClefSymbol(MidiSheetMusic.Clef.Treble, 0, false);
                    var result = clefsym.MinWidth;
                    var keys = key.GetSymbols(MidiSheetMusic.Clef.Treble);
                    $t = Bridge.getEnumerator(keys);
                    try {
                        while ($t.moveNext()) {
                            var symbol = $t.Current;
                            result = (result + symbol.MinWidth) | 0;
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }return ((((result + MidiSheetMusic.SheetMusic.LeftMargin) | 0) + 5) | 0);
                },
                GetLyrics: function (tracks) {
                    var $t;
                    var hasLyrics = false;
                    var result = System.Array.init(tracks.Count, null, System.Collections.Generic.List$1(MidiSheetMusic.LyricSymbol));
                    for (var tracknum = 0; tracknum < tracks.Count; tracknum = (tracknum + 1) | 0) {
                        var track = tracks.getItem(tracknum);
                        if (track.Lyrics == null) {
                            continue;
                        }
                        hasLyrics = true;
                        result[System.Array.index(tracknum, result)] = new (System.Collections.Generic.List$1(MidiSheetMusic.LyricSymbol)).ctor();
                        $t = Bridge.getEnumerator(track.Lyrics);
                        try {
                            while ($t.moveNext()) {
                                var ev = $t.Current;
                                var text = System.Text.Encoding.UTF8.GetString$1(ev.Value, 0, ev.Value.length);
                                var sym = new MidiSheetMusic.LyricSymbol(ev.StartTime, text);
                                result[System.Array.index(tracknum, result)].add(sym);
                            }
                        } finally {
                            if (Bridge.is($t, System.IDisposable)) {
                                $t.System$IDisposable$dispose();
                            }
                        }}
                    if (!hasLyrics) {
                        return null;
                    } else {
                        return result;
                    }
                },
                AddLyricsToStaffs: function (staffs, tracklyrics) {
                    var $t;
                    $t = Bridge.getEnumerator(staffs);
                    try {
                        while ($t.moveNext()) {
                            var staff = $t.Current;
                            var lyrics = tracklyrics[System.Array.index(staff.Track, tracklyrics)];
                            staff.AddLyrics(lyrics);
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }},
                SetNoteSize: function (largenotes) {
                    if (largenotes) {
                        MidiSheetMusic.SheetMusic.LineSpace = 7;
                    } else {
                        MidiSheetMusic.SheetMusic.LineSpace = 5;
                    }

                    MidiSheetMusic.SheetMusic.StaffHeight = (Bridge.Int.mul(MidiSheetMusic.SheetMusic.LineSpace, 4) + 5) | 0;
                    MidiSheetMusic.SheetMusic.NoteHeight = (MidiSheetMusic.SheetMusic.LineSpace + MidiSheetMusic.SheetMusic.LineWidth) | 0;
                    MidiSheetMusic.SheetMusic.NoteWidth = (Bridge.Int.div(Bridge.Int.mul(3, MidiSheetMusic.SheetMusic.LineSpace), 2)) | 0;
                    MidiSheetMusic.SheetMusic.LetterFont = new MidiSheetMusic.Font("Arial", 8, MidiSheetMusic.FontStyle.Regular);
                }
            }
        },
        fields: {
            staffs: null,
            mainkey: null,
            numtracks: 0,
            zoom: 0,
            scrollVert: false,
            filename: null,
            showNoteLetters: 0,
            NoteColors: null,
            shadeBrush: null,
            shade2Brush: null,
            deselectedShadeBrush: null,
            pen: null,
            SelectionStartPulse: 0,
            SelectionEndPulse: 0
        },
        props: {
            ShadeBrush: {
                get: function () {
                    return this.shadeBrush;
                }
            },
            Shade2Brush: {
                get: function () {
                    return this.shade2Brush;
                }
            },
            ShowNoteLetters: {
                get: function () {
                    return this.showNoteLetters;
                }
            },
            MainKey: {
                get: function () {
                    return this.mainkey;
                }
            }
        },
        ctors: {
            init: function () {
                this.deselectedShadeBrush = new MidiSheetMusic.SolidBrush(MidiSheetMusic.Color.LightGray);
            },
            ctor: function (file, options) {
                this.$initialize();
                MidiSheetMusic.Control.ctor.call(this);
                this.init(file, options);
            },
            $ctor1: function (file, options, tracks) {
                this.$initialize();
                MidiSheetMusic.Control.ctor.call(this);
                this.init$1(file, options, tracks);
            },
            $ctor2: function (data, title, options) {
                this.$initialize();
                MidiSheetMusic.Control.ctor.call(this);
                var file = new MidiSheetMusic.MidiFile(data, title);
                this.init(file, options);
            }
        },
        methods: {
            init$1: function (file, options, tracks) {
                var $t;
                this.zoom = 1.0;
                this.filename = file.FileName;

                this.SetColors(options.colors, options.shadeColor, options.shade2Color);
                this.pen = new MidiSheetMusic.Pen(MidiSheetMusic.Color.Black, 1);

                MidiSheetMusic.SheetMusic.SetNoteSize(options.largeNoteSize);
                this.scrollVert = options.scrollVert;
                this.showNoteLetters = options.showNoteLetters;
                var time = file.Time;
                if (options.time != null) {
                    time = options.time;
                }
                if (options.key === -1) {
                    this.mainkey = this.GetKeySignature(tracks);
                } else {
                    this.mainkey = new MidiSheetMusic.KeySignature.ctor(options.key);
                }

                this.numtracks = tracks.Count;

                var lastStart = (file.EndTime() + options.shifttime) | 0;

                /* Create all the music symbols (notes, rests, vertical bars, and
                  clef changes).  The symbols variable contains a list of music 
                  symbols for each track.  The list does not include the left-side 
                  Clef and key signature symbols.  Those can only be calculated 
                  when we create the staffs.
                */
                var symbols = System.Array.init(this.numtracks, null, System.Collections.Generic.List$1(MidiSheetMusic.MusicSymbol));
                for (var tracknum = 0; tracknum < this.numtracks; tracknum = (tracknum + 1) | 0) {
                    var track = tracks.getItem(tracknum);
                    var clefs = new MidiSheetMusic.ClefMeasures(track.Notes, time.Measure);
                    var chords = this.CreateChords(track.Notes, this.mainkey, time, clefs);
                    symbols[System.Array.index(tracknum, symbols)] = this.CreateSymbols(chords, clefs, time, lastStart);
                }

                var lyrics = null;
                if (options.showLyrics) {
                    lyrics = MidiSheetMusic.SheetMusic.GetLyrics(tracks);
                }

                /* Vertically align the music symbols */
                var widths = new MidiSheetMusic.SymbolWidths(symbols, lyrics);
                this.AlignSymbols(symbols, widths, options);

                this.staffs = this.CreateStaffs(symbols, this.mainkey, options, time.Measure);
                MidiSheetMusic.SheetMusic.CreateAllBeamedChords(symbols, time);
                if (lyrics != null) {
                    MidiSheetMusic.SheetMusic.AddLyricsToStaffs(this.staffs, lyrics);
                }

                /* After making chord pairs, the stem directions can change,
                  which affects the staff height.  Re-calculate the staff height.
                */
                $t = Bridge.getEnumerator(this.staffs);
                try {
                    while ($t.moveNext()) {
                        var staff = $t.Current;
                        staff.CalculateHeight();
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }
                this.BackColor = MidiSheetMusic.Color.White;

                this.SetZoom(1.0);
            },
            init: function (file, options) {
                if (options == null) {
                    options = new MidiSheetMusic.MidiOptions.$ctor1(file);
                }
                var tracks = file.ChangeMidiNotes(options);
                this.init$1(file, options, tracks);

            },
            GetKeySignature: function (tracks) {
                var $t, $t1;
                var notenums = new (System.Collections.Generic.List$1(System.Int32)).ctor();
                $t = Bridge.getEnumerator(tracks);
                try {
                    while ($t.moveNext()) {
                        var track = $t.Current;
                        $t1 = Bridge.getEnumerator(track.Notes);
                        try {
                            while ($t1.moveNext()) {
                                var note = $t1.Current;
                                notenums.add(note.Number);
                            }
                        } finally {
                            if (Bridge.is($t1, System.IDisposable)) {
                                $t1.System$IDisposable$dispose();
                            }
                        }
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }return MidiSheetMusic.KeySignature.Guess(notenums);
            },
            CreateChords: function (midinotes, key, time, clefs) {

                var i = 0;
                var chords = new (System.Collections.Generic.List$1(MidiSheetMusic.ChordSymbol)).ctor();
                var notegroup = new (System.Collections.Generic.List$1(MidiSheetMusic.MidiNote)).$ctor2(12);
                var len = midinotes.Count;

                while (i < len) {

                    var starttime = midinotes.getItem(i).StartTime;
                    var clef = clefs.GetClef(starttime);

                    /* Group all the midi notes with the same start time
                      into the notes list.
                    */
                    notegroup.clear();
                    notegroup.add(midinotes.getItem(i));
                    i = (i + 1) | 0;
                    while (i < len && midinotes.getItem(i).StartTime === starttime) {
                        notegroup.add(midinotes.getItem(i));
                        i = (i + 1) | 0;
                    }

                    /* Create a single chord from the group of midi notes with
                      the same start time.
                    */
                    var chord = new MidiSheetMusic.ChordSymbol(notegroup, key, time, clef, this);
                    chords.add(chord);
                }

                return chords;
            },
            CreateSymbols: function (chords, clefs, time, lastStart) {

                var symbols = new (System.Collections.Generic.List$1(MidiSheetMusic.MusicSymbol)).ctor();
                symbols = this.AddBars(chords, time, lastStart);
                symbols = this.AddRests(symbols, time);
                symbols = this.AddClefChanges(symbols, clefs, time);

                return symbols;
            },
            AddBars: function (chords, time, lastStart) {

                var symbols = new (System.Collections.Generic.List$1(MidiSheetMusic.MusicSymbol)).ctor();

                var timesig = new MidiSheetMusic.TimeSigSymbol(time.Numerator, time.Denominator);
                symbols.add(timesig);

                /* The starttime of the beginning of the measure */
                var measuretime = 0;

                var i = 0;
                while (i < chords.Count) {
                    if (measuretime <= chords.getItem(i).StartTime) {
                        symbols.add(new MidiSheetMusic.BarSymbol(measuretime));
                        measuretime = (measuretime + time.Measure) | 0;
                    } else {
                        symbols.add(chords.getItem(i));
                        i = (i + 1) | 0;
                    }
                }

                /* Keep adding bars until the last StartTime (the end of the song) */
                while (measuretime < lastStart) {
                    symbols.add(new MidiSheetMusic.BarSymbol(measuretime));
                    measuretime = (measuretime + time.Measure) | 0;
                }

                /* Add the final vertical bar to the last measure */
                symbols.add(new MidiSheetMusic.BarSymbol(measuretime));
                return symbols;
            },
            AddRests: function (symbols, time) {
                var $t, $t1;
                var prevtime = 0;

                var result = new (System.Collections.Generic.List$1(MidiSheetMusic.MusicSymbol)).$ctor2(symbols.Count);

                $t = Bridge.getEnumerator(symbols);
                try {
                    while ($t.moveNext()) {
                        var symbol = $t.Current;
                        var starttime = symbol.StartTime;
                        var rests = this.GetRests(time, prevtime, starttime);
                        if (rests != null) {
                            $t1 = Bridge.getEnumerator(rests);
                            try {
                                while ($t1.moveNext()) {
                                    var r = $t1.Current;
                                    result.add(r);
                                }
                            } finally {
                                if (Bridge.is($t1, System.IDisposable)) {
                                    $t1.System$IDisposable$dispose();
                                }
                            }}

                        result.add(symbol);

                        /* Set prevtime to the end time of the last note/symbol. */
                        if (Bridge.is(symbol, MidiSheetMusic.ChordSymbol)) {
                            var chord = Bridge.cast(symbol, MidiSheetMusic.ChordSymbol);
                            prevtime = Math.max(chord.EndTime, prevtime);
                        } else {
                            prevtime = Math.max(starttime, prevtime);
                        }
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }return result;
            },
            GetRests: function (time, start, end) {
                var result;
                var r1, r2;

                if (((end - start) | 0) < 0) {
                    return null;
                }

                var dur = time.GetNoteDuration(((end - start) | 0));
                switch (dur) {
                    case MidiSheetMusic.NoteDuration.Whole: 
                    case MidiSheetMusic.NoteDuration.Half: 
                    case MidiSheetMusic.NoteDuration.Quarter: 
                    case MidiSheetMusic.NoteDuration.Eighth: 
                        r1 = new MidiSheetMusic.RestSymbol(start, dur);
                        result = System.Array.init([r1], MidiSheetMusic.RestSymbol);
                        return result;
                    case MidiSheetMusic.NoteDuration.DottedHalf: 
                        r1 = new MidiSheetMusic.RestSymbol(start, MidiSheetMusic.NoteDuration.Half);
                        r2 = new MidiSheetMusic.RestSymbol(((start + Bridge.Int.mul(time.Quarter, 2)) | 0), MidiSheetMusic.NoteDuration.Quarter);
                        result = System.Array.init([r1, r2], MidiSheetMusic.RestSymbol);
                        return result;
                    case MidiSheetMusic.NoteDuration.DottedQuarter: 
                        r1 = new MidiSheetMusic.RestSymbol(start, MidiSheetMusic.NoteDuration.Quarter);
                        r2 = new MidiSheetMusic.RestSymbol(((start + time.Quarter) | 0), MidiSheetMusic.NoteDuration.Eighth);
                        result = System.Array.init([r1, r2], MidiSheetMusic.RestSymbol);
                        return result;
                    case MidiSheetMusic.NoteDuration.DottedEighth: 
                        r1 = new MidiSheetMusic.RestSymbol(start, MidiSheetMusic.NoteDuration.Eighth);
                        r2 = new MidiSheetMusic.RestSymbol(((start + ((Bridge.Int.div(time.Quarter, 2)) | 0)) | 0), MidiSheetMusic.NoteDuration.Sixteenth);
                        result = System.Array.init([r1, r2], MidiSheetMusic.RestSymbol);
                        return result;
                    default: 
                        return null;
                }
            },
            AddClefChanges: function (symbols, clefs, time) {
                var $t;

                var result = new (System.Collections.Generic.List$1(MidiSheetMusic.MusicSymbol)).$ctor2(symbols.Count);
                var prevclef = clefs.GetClef(0);
                $t = Bridge.getEnumerator(symbols);
                try {
                    while ($t.moveNext()) {
                        var symbol = $t.Current;
                        /* A BarSymbol indicates a new measure */
                        if (Bridge.is(symbol, MidiSheetMusic.BarSymbol)) {
                            var clef = clefs.GetClef(symbol.StartTime);
                            if (clef !== prevclef) {
                                result.add(new MidiSheetMusic.ClefSymbol(clef, ((symbol.StartTime - 1) | 0), true));
                            }
                            prevclef = clef;
                        }
                        result.add(symbol);
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }return result;
            },
            AlignSymbols: function (allsymbols, widths, options) {
                var $t, $t1;

                // If we show measure numbers, increase bar symbol width
                if (options.showMeasures) {
                    for (var track = 0; track < allsymbols.length; track = (track + 1) | 0) {
                        var symbols = allsymbols[System.Array.index(track, allsymbols)];
                        $t = Bridge.getEnumerator(symbols);
                        try {
                            while ($t.moveNext()) {
                                var sym = $t.Current;
                                if (Bridge.is(sym, MidiSheetMusic.BarSymbol)) {
                                    sym.Width = (sym.Width + MidiSheetMusic.SheetMusic.NoteWidth) | 0;
                                }
                            }
                        } finally {
                            if (Bridge.is($t, System.IDisposable)) {
                                $t.System$IDisposable$dispose();
                            }
                        }}
                }

                for (var track1 = 0; track1 < allsymbols.length; track1 = (track1 + 1) | 0) {
                    var symbols1 = allsymbols[System.Array.index(track1, allsymbols)];
                    var result = new (System.Collections.Generic.List$1(MidiSheetMusic.MusicSymbol)).ctor();

                    var i = 0;

                    /* If a track doesn't have a symbol for a starttime,
                      add a blank symbol.
                    */
                    $t1 = Bridge.getEnumerator(widths.StartTimes);
                    try {
                        while ($t1.moveNext()) {
                            var start = $t1.Current;

                            /* BarSymbols are not included in the SymbolWidths calculations */
                            while (i < symbols1.Count && (Bridge.is(symbols1.getItem(i), MidiSheetMusic.BarSymbol)) && symbols1.getItem(i).StartTime <= start) {
                                result.add(symbols1.getItem(i));
                                i = (i + 1) | 0;
                            }

                            if (i < symbols1.Count && symbols1.getItem(i).StartTime === start) {

                                while (i < symbols1.Count && symbols1.getItem(i).StartTime === start) {

                                    result.add(symbols1.getItem(i));
                                    i = (i + 1) | 0;
                                }
                            } else {
                                result.add(new MidiSheetMusic.BlankSymbol(start, 0));
                            }
                        }
                    } finally {
                        if (Bridge.is($t1, System.IDisposable)) {
                            $t1.System$IDisposable$dispose();
                        }
                    }
                    /* For each starttime, increase the symbol width by
                      SymbolWidths.GetExtraWidth().
                    */
                    i = 0;
                    while (i < result.Count) {
                        if (Bridge.is(result.getItem(i), MidiSheetMusic.BarSymbol)) {
                            i = (i + 1) | 0;
                            continue;
                        }
                        var start1 = result.getItem(i).StartTime;
                        var extra = widths.GetExtraWidth(track1, start1);
                        result.getItem(i).Width = (result.getItem(i).Width + extra) | 0;

                        /* Skip all remaining symbols with the same starttime. */
                        while (i < result.Count && result.getItem(i).StartTime === start1) {
                            i = (i + 1) | 0;
                        }
                    }
                    allsymbols[System.Array.index(track1, allsymbols)] = result;
                }
            },
            CreateStaffsForTrack: function (symbols, measurelen, key, options, track, totaltracks) {
                var keysigWidth = MidiSheetMusic.SheetMusic.KeySignatureWidth(key);
                var startindex = 0;
                var thestaffs = new (System.Collections.Generic.List$1(MidiSheetMusic.Staff)).$ctor2(((Bridge.Int.div(symbols.Count, 50)) | 0));

                while (startindex < symbols.Count) {
                    /* startindex is the index of the first symbol in the staff.
                      endindex is the index of the last symbol in the staff.
                    */
                    var endindex = startindex;
                    var width = keysigWidth;
                    var maxwidth;

                    /* If we're scrolling vertically, the maximum width is PageWidth. */
                    if (this.scrollVert) {
                        maxwidth = MidiSheetMusic.SheetMusic.PageWidth;
                    } else {
                        maxwidth = 2000000;
                    }

                    while (endindex < symbols.Count && ((width + symbols.getItem(endindex).Width) | 0) < maxwidth) {

                        width = (width + symbols.getItem(endindex).Width) | 0;
                        endindex = (endindex + 1) | 0;
                    }
                    endindex = (endindex - 1) | 0;

                    /* There's 3 possibilities at this point:
                      1. We have all the symbols in the track.
                         The endindex stays the same.

                      2. We have symbols for less than one measure.
                         The endindex stays the same.

                      3. We have symbols for 1 or more measures.
                         Since measures cannot span multiple staffs, we must
                         make sure endindex does not occur in the middle of a
                         measure.  We count backwards until we come to the end
                         of a measure.
                    */

                    if (endindex === ((symbols.Count - 1) | 0)) {
                        /* endindex stays the same */
                    } else if (((Bridge.Int.div(symbols.getItem(startindex).StartTime, measurelen)) | 0) === ((Bridge.Int.div(symbols.getItem(endindex).StartTime, measurelen)) | 0)) {
                        /* endindex stays the same */
                    } else {
                        var endmeasure = (Bridge.Int.div(symbols.getItem(((endindex + 1) | 0)).StartTime, measurelen)) | 0;
                        while (((Bridge.Int.div(symbols.getItem(endindex).StartTime, measurelen)) | 0) === endmeasure) {
                            endindex = (endindex - 1) | 0;
                        }
                    }
                    var range = (((endindex + 1) | 0) - startindex) | 0;
                    if (this.scrollVert) {
                        width = MidiSheetMusic.SheetMusic.PageWidth;
                    }
                    var staff = new MidiSheetMusic.Staff(symbols.getRange(startindex, range), key, options, track, totaltracks);
                    thestaffs.add(staff);
                    startindex = (endindex + 1) | 0;
                }
                return thestaffs;
            },
            CreateStaffs: function (allsymbols, key, options, measurelen) {
                var $t, $t1;

                var trackstaffs = System.Array.init(allsymbols.length, null, System.Collections.Generic.List$1(MidiSheetMusic.Staff));
                var totaltracks = trackstaffs.length;

                for (var track = 0; track < totaltracks; track = (track + 1) | 0) {
                    var symbols = allsymbols[System.Array.index(track, allsymbols)];
                    trackstaffs[System.Array.index(track, trackstaffs)] = this.CreateStaffsForTrack(symbols, measurelen, key, options, track, totaltracks);
                }

                /* Update the EndTime of each Staff. EndTime is used for playback */
                $t = Bridge.getEnumerator(trackstaffs);
                try {
                    while ($t.moveNext()) {
                        var list = $t.Current;
                        for (var i = 0; i < ((list.Count - 1) | 0); i = (i + 1) | 0) {
                            list.getItem(i).EndTime = list.getItem(((i + 1) | 0)).StartTime;
                        }
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }
                /* Interleave the staffs of each track into the result array. */
                var maxstaffs = 0;
                for (var i1 = 0; i1 < trackstaffs.length; i1 = (i1 + 1) | 0) {
                    if (maxstaffs < trackstaffs[System.Array.index(i1, trackstaffs)].Count) {
                        maxstaffs = trackstaffs[System.Array.index(i1, trackstaffs)].Count;
                    }
                }
                var result = new (System.Collections.Generic.List$1(MidiSheetMusic.Staff)).$ctor2(Bridge.Int.mul(maxstaffs, trackstaffs.length));
                for (var i2 = 0; i2 < maxstaffs; i2 = (i2 + 1) | 0) {
                    $t1 = Bridge.getEnumerator(trackstaffs);
                    try {
                        while ($t1.moveNext()) {
                            var list1 = $t1.Current;
                            if (i2 < list1.Count) {
                                result.add(list1.getItem(i2));
                            }
                        }
                    } finally {
                        if (Bridge.is($t1, System.IDisposable)) {
                            $t1.System$IDisposable$dispose();
                        }
                    }}
                return result;
            },
            SetZoom: function (value) {
                var $t;
                this.zoom = value;
                var width = 0;
                var height = 0;
                $t = Bridge.getEnumerator(this.staffs);
                try {
                    while ($t.moveNext()) {
                        var staff = $t.Current;
                        width = Math.max(width, staff.Width * this.zoom);
                        height += (staff.Height * this.zoom);
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }this.Width = Bridge.Int.clip32(width + 2);
                this.Height = (Bridge.Int.clip32(height) + MidiSheetMusic.SheetMusic.LeftMargin) | 0;
                this.Invalidate();
            },
            SetColors: function (newcolors, newshade, newshade2) {
                if (this.NoteColors == null) {
                    this.NoteColors = System.Array.init(12, null, MidiSheetMusic.Color);
                    for (var i = 0; i < 12; i = (i + 1) | 0) {
                        this.NoteColors[System.Array.index(i, this.NoteColors)] = MidiSheetMusic.Color.Black;
                    }
                }
                if (newcolors != null) {
                    for (var i1 = 0; i1 < 12; i1 = (i1 + 1) | 0) {
                        this.NoteColors[System.Array.index(i1, this.NoteColors)] = newcolors[System.Array.index(i1, newcolors)];
                    }
                } else {
                    for (var i2 = 0; i2 < 12; i2 = (i2 + 1) | 0) {
                        this.NoteColors[System.Array.index(i2, this.NoteColors)] = MidiSheetMusic.Color.Black;
                    }
                }
                if (this.shadeBrush != null) {
                    this.shadeBrush.Dispose();
                    this.shade2Brush.Dispose();
                }
                this.shadeBrush = new MidiSheetMusic.SolidBrush(newshade);
                this.shade2Brush = new MidiSheetMusic.SolidBrush(newshade2);
            },
            NoteColor: function (number) {
                return this.NoteColors[System.Array.index(MidiSheetMusic.NoteScale.FromNumber(number), this.NoteColors)];
            },
            OnPaint: function (e) {
                var $t;
                var clip = new MidiSheetMusic.Rectangle(Bridge.Int.clip32(e.ClipRectangle.X / this.zoom), Bridge.Int.clip32(e.ClipRectangle.Y / this.zoom), Bridge.Int.clip32(e.ClipRectangle.Width / this.zoom), Bridge.Int.clip32(e.ClipRectangle.Height / this.zoom));

                var g = e.Graphics();
                g.ScaleTransform(this.zoom, this.zoom);
                /* g.PageScale = zoom; */
                g.SmoothingMode = MidiSheetMusic.SmoothingMode.AntiAlias;
                var ypos = 0;
                $t = Bridge.getEnumerator(this.staffs);
                try {
                    while ($t.moveNext()) {
                        var staff = $t.Current;
                        if ((((ypos + staff.Height) | 0) < clip.Y) || (ypos > ((clip.Y + clip.Height) | 0))) {
                            /* Staff is not in the clip, don't need to draw it */
                        } else {
                            g.TranslateTransform(0, ypos);
                            staff.Draw(g, clip, this.pen, this.SelectionStartPulse, this.SelectionEndPulse, this.deselectedShadeBrush);
                            g.TranslateTransform(0, ((-ypos) | 0));
                        }

                        ypos = (ypos + staff.Height) | 0;
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }g.ScaleTransform(1.0 / this.zoom, 1.0 / this.zoom);
            },
            DrawTitle: function (g) {
                var leftmargin = 20;
                var topmargin = 20;
                var title = MidiSheetMusic.Path.GetFileName(this.filename);
                title = System.String.replaceAll(System.String.replaceAll(title, ".mid", ""), "_", " ");
                var font = new MidiSheetMusic.Font("Arial", 10, MidiSheetMusic.FontStyle.Bold);
                g.TranslateTransform(leftmargin, topmargin);
                g.DrawString(title, font, MidiSheetMusic.Brushes.Black, 0, 0);
                g.TranslateTransform(((-leftmargin) | 0), ((-topmargin) | 0));
                font.Dispose();
            },
            GetTotalPages: function () {
                var $t;
                var num = 1;
                var currheight = MidiSheetMusic.SheetMusic.TitleHeight;

                if (this.numtracks === 2 && (this.staffs.Count % 2) === 0) {
                    for (var i = 0; i < this.staffs.Count; i = (i + 2) | 0) {
                        var heights = (this.staffs.getItem(i).Height + this.staffs.getItem(((i + 1) | 0)).Height) | 0;
                        if (((currheight + heights) | 0) > MidiSheetMusic.SheetMusic.PageHeight) {
                            num = (num + 1) | 0;
                            currheight = heights;
                        } else {
                            currheight = (currheight + heights) | 0;
                        }
                    }
                } else {
                    $t = Bridge.getEnumerator(this.staffs);
                    try {
                        while ($t.moveNext()) {
                            var staff = $t.Current;
                            if (((currheight + staff.Height) | 0) > MidiSheetMusic.SheetMusic.PageHeight) {
                                num = (num + 1) | 0;
                                currheight = staff.Height;
                            } else {
                                currheight = (currheight + staff.Height) | 0;
                            }
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$dispose();
                        }
                    }}
                return num;
            },
            ShadeNotes: function (currentPulseTime, prevPulseTime, scrollGradually, brush) {
                var $t;
                var g = this.CreateGraphics("shadeNotes");
                g.SmoothingMode = MidiSheetMusic.SmoothingMode.AntiAlias;
                g.ScaleTransform(this.zoom, this.zoom);
                var ypos = 0;

                var x_shade = { v : 0 };
                var y_shade = 0;
                var width = 0;
                var height = 0;

                $t = Bridge.getEnumerator(this.staffs);
                try {
                    while ($t.moveNext()) {
                        var staff = $t.Current;
                        g.TranslateTransform(0, ypos);
                        width = (width + (staff.ShadeNotes(g, brush, this.pen, currentPulseTime, prevPulseTime, x_shade))) | 0;
                        g.TranslateTransform(0, ((-ypos) | 0));
                        ypos = (ypos + staff.Height) | 0;
                        if (currentPulseTime >= staff.EndTime) {
                            y_shade = (y_shade + staff.Height) | 0;
                        }
                        if (currentPulseTime >= staff.StartTime && currentPulseTime <= staff.EndTime) {
                            height = (height + staff.Height) | 0;
                        }
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }g.ScaleTransform(1.0 / this.zoom, 1.0 / this.zoom);
                g.Dispose();
                x_shade.v = Bridge.Int.clip32(x_shade.v * this.zoom);
                y_shade = (y_shade - MidiSheetMusic.SheetMusic.NoteHeight) | 0;
                y_shade = Bridge.Int.clip32(y_shade * this.zoom);
                if (currentPulseTime >= 0) {
                    this.ScrollToShadedNotes(x_shade.v, y_shade, scrollGradually);
                }
                return new MidiSheetMusic.Rectangle(x_shade.v, y_shade, width, Bridge.Int.clip32((((height + 8) | 0)) * this.zoom));
            },
            ScrollToShadedNotes: function (x_shade, y_shade, scrollGradually) {
                var scrollview = this.Parent;
                var scrollPos = scrollview.AutoScrollPosition;

                /* The scroll position is in negative coordinates for some reason */
                scrollPos.X = (-scrollPos.X) | 0;
                scrollPos.Y = (-scrollPos.Y) | 0;
                var newPos = scrollPos;

                if (this.scrollVert) {
                    var scrollDist = ((y_shade - scrollPos.Y) | 0);

                    if (scrollGradually) {
                        if (scrollDist > (this.zoom * MidiSheetMusic.SheetMusic.StaffHeight * 8)) {
                            scrollDist = (Bridge.Int.div(scrollDist, 2)) | 0;
                        } else {
                            if (scrollDist > (Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 3) * this.zoom)) {
                                scrollDist = Bridge.Int.clip32(Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 3) * this.zoom);
                            }
                        }
                    }
                    newPos = new MidiSheetMusic.Point(scrollPos.X, ((scrollPos.Y + scrollDist) | 0));
                } else {
                    var x_view = (scrollPos.X + ((Bridge.Int.div(Bridge.Int.mul(40, scrollview.Width), 100)) | 0)) | 0;
                    var xmax = (scrollPos.X + ((Bridge.Int.div(Bridge.Int.mul(65, scrollview.Width), 100)) | 0)) | 0;
                    var scrollDist1 = (x_shade - x_view) | 0;

                    if (scrollGradually) {
                        if (x_shade > xmax) {
                            scrollDist1 = (Bridge.Int.div((((x_shade - x_view) | 0)), 3)) | 0;
                        } else {
                            if (x_shade > x_view) {
                                scrollDist1 = (Bridge.Int.div((((x_shade - x_view) | 0)), 6)) | 0;
                            }
                        }
                    }

                    newPos = new MidiSheetMusic.Point(((scrollPos.X + scrollDist1) | 0), scrollPos.Y);
                    if (newPos.X < 0) {
                        newPos.X = 0;
                    }
                }
                scrollview.AutoScrollPosition = newPos;
            },
            PulseTimeForPoint: function (point) {
                var $t;
                var scaledPoint = new MidiSheetMusic.Point(Bridge.Int.clip32(point.X / this.zoom), Bridge.Int.clip32(point.Y / this.zoom));
                var y = 0;
                $t = Bridge.getEnumerator(this.staffs);
                try {
                    while ($t.moveNext()) {
                        var staff = $t.Current;
                        if (scaledPoint.Y >= y && scaledPoint.Y <= ((y + staff.Height) | 0)) {
                            return staff.PulseTimeForPoint(scaledPoint);
                        }
                        y = (y + staff.Height) | 0;
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }return -1;
            },
            toString: function () {
                var $t;
                var result = "SheetMusic staffs=" + this.staffs.Count + "\n";
                $t = Bridge.getEnumerator(this.staffs);
                try {
                    while ($t.moveNext()) {
                        var staff = $t.Current;
                        result = (result || "") + ((staff.toString()) || "");
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$dispose();
                    }
                }result = (result || "") + "End SheetMusic\n";
                return result;
            }
        }
    });

    Bridge.define("MidiSheetMusic.SolidBrush", {
        inherits: [MidiSheetMusic.Brush],
        ctors: {
            ctor: function (color) {
                this.$initialize();
                MidiSheetMusic.Brush.ctor.call(this, color);
            }
        }
    });

    Bridge.define("MidiSheetMusic.TimeSigSymbol", {
        inherits: [MidiSheetMusic.MusicSymbol],
        statics: {
            fields: {
                images: null
            },
            methods: {
                LoadImages: function () {
                    if (MidiSheetMusic.TimeSigSymbol.images == null) {
                        MidiSheetMusic.TimeSigSymbol.images = System.Array.init(13, null, MidiSheetMusic.Image);
                        for (var i = 0; i < 13; i = (i + 1) | 0) {
                            MidiSheetMusic.TimeSigSymbol.images[System.Array.index(i, MidiSheetMusic.TimeSigSymbol.images)] = null;
                        }
                        MidiSheetMusic.TimeSigSymbol.images[System.Array.index(2, MidiSheetMusic.TimeSigSymbol.images)] = new MidiSheetMusic.Bitmap(MidiSheetMusic.TimeSigSymbol, "Resources.Images.two.png");
                        MidiSheetMusic.TimeSigSymbol.images[System.Array.index(3, MidiSheetMusic.TimeSigSymbol.images)] = new MidiSheetMusic.Bitmap(MidiSheetMusic.TimeSigSymbol, "Resources.Images.three.png");
                        MidiSheetMusic.TimeSigSymbol.images[System.Array.index(4, MidiSheetMusic.TimeSigSymbol.images)] = new MidiSheetMusic.Bitmap(MidiSheetMusic.TimeSigSymbol, "Resources.Images.four.png");
                        MidiSheetMusic.TimeSigSymbol.images[System.Array.index(6, MidiSheetMusic.TimeSigSymbol.images)] = new MidiSheetMusic.Bitmap(MidiSheetMusic.TimeSigSymbol, "Resources.Images.six.png");
                        MidiSheetMusic.TimeSigSymbol.images[System.Array.index(8, MidiSheetMusic.TimeSigSymbol.images)] = new MidiSheetMusic.Bitmap(MidiSheetMusic.TimeSigSymbol, "Resources.Images.eight.png");
                        MidiSheetMusic.TimeSigSymbol.images[System.Array.index(9, MidiSheetMusic.TimeSigSymbol.images)] = new MidiSheetMusic.Bitmap(MidiSheetMusic.TimeSigSymbol, "Resources.Images.nine.png");
                        MidiSheetMusic.TimeSigSymbol.images[System.Array.index(12, MidiSheetMusic.TimeSigSymbol.images)] = new MidiSheetMusic.Bitmap(MidiSheetMusic.TimeSigSymbol, "Resources.Images.twelve.png");
                    }
                }
            }
        },
        fields: {
            numerator: 0,
            denominator: 0,
            width: 0,
            candraw: false
        },
        props: {
            StartTime: {
                get: function () {
                    return -1;
                }
            },
            MinWidth: {
                get: function () {
                    if (this.candraw) {
                        return ((Bridge.Int.div(Bridge.Int.mul(Bridge.Int.mul(MidiSheetMusic.TimeSigSymbol.images[System.Array.index(2, MidiSheetMusic.TimeSigSymbol.images)].Width, MidiSheetMusic.SheetMusic.NoteHeight), 2), MidiSheetMusic.TimeSigSymbol.images[System.Array.index(2, MidiSheetMusic.TimeSigSymbol.images)].Height)) | 0);
                    } else {
                        return 0;
                    }
                }
            },
            Width: {
                get: function () {
                    return this.width;
                },
                set: function (value) {
                    this.width = value;
                }
            },
            AboveStaff: {
                get: function () {
                    return 0;
                }
            },
            BelowStaff: {
                get: function () {
                    return 0;
                }
            }
        },
        ctors: {
            ctor: function (numer, denom) {
                this.$initialize();
                MidiSheetMusic.MusicSymbol.ctor.call(this);
                this.numerator = numer;
                this.denominator = denom;
                MidiSheetMusic.TimeSigSymbol.LoadImages();
                if (numer >= 0 && numer < MidiSheetMusic.TimeSigSymbol.images.length && MidiSheetMusic.TimeSigSymbol.images[System.Array.index(numer, MidiSheetMusic.TimeSigSymbol.images)] != null && denom >= 0 && denom < MidiSheetMusic.TimeSigSymbol.images.length && MidiSheetMusic.TimeSigSymbol.images[System.Array.index(numer, MidiSheetMusic.TimeSigSymbol.images)] != null) {
                    this.candraw = true;
                } else {
                    this.candraw = false;
                }
                this.width = this.MinWidth;
            }
        },
        methods: {
            Draw: function (g, pen, ytop) {
                if (!this.candraw) {
                    return;
                }

                g.TranslateTransform(((this.Width - this.MinWidth) | 0), 0);
                var numer = MidiSheetMusic.TimeSigSymbol.images[System.Array.index(this.numerator, MidiSheetMusic.TimeSigSymbol.images)];
                var denom = MidiSheetMusic.TimeSigSymbol.images[System.Array.index(this.denominator, MidiSheetMusic.TimeSigSymbol.images)];

                /* Scale the image width to match the height */
                var imgheight = Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2);
                var imgwidth = (Bridge.Int.div(Bridge.Int.mul(numer.Width, imgheight), numer.Height)) | 0;
                g.DrawImage(numer, 0, ytop, imgwidth, imgheight);
                g.DrawImage(denom, 0, ((ytop + Bridge.Int.mul(MidiSheetMusic.SheetMusic.NoteHeight, 2)) | 0), imgwidth, imgheight);
                g.TranslateTransform(((-(((this.Width - this.MinWidth) | 0))) | 0), 0);
            },
            toString: function () {
                return System.String.format("TimeSigSymbol numerator={0} denominator={1}", Bridge.box(this.numerator, System.Int32), Bridge.box(this.denominator, System.Int32));
            }
        }
    });
});

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICJNaWRpU2hlZXRNdXNpY0JyaWRnZS5qcyIsCiAgInNvdXJjZVJvb3QiOiAiIiwKICAic291cmNlcyI6IFsiQ2xhc3Nlcy9EcmF3aW5nL0ltYWdlLmNzIiwiQ2xhc3Nlcy9SaWZmUGFyc2VyLmNzIiwiQ2xhc3Nlcy9EcmF3aW5nL0JydXNoLmNzIiwiQ2xhc3Nlcy9EcmF3aW5nL0JydXNoZXMuY3MiLCJDbGFzc2VzL0NsZWZNZWFzdXJlcy5jcyIsIkNsYXNzZXMvRHJhd2luZy9Db2xvci5jcyIsIkNsYXNzZXMvRHJhd2luZy9Db250cm9sLmNzIiwiQ2xhc3Nlcy9JTy9TdHJlYW0uY3MiLCJDbGFzc2VzL0RyYXdpbmcvRm9udC5jcyIsIkNsYXNzZXMvRHJhd2luZy9HcmFwaGljcy5jcyIsIkNsYXNzZXMvS2V5U2lnbmF0dXJlLmNzIiwiQ2xhc3Nlcy9MeXJpY1N5bWJvbC5jcyIsIkNsYXNzZXMvTWlkaUV2ZW50LmNzIiwiQ2xhc3Nlcy9NaWRpRmlsZS5jcyIsIkNsYXNzZXMvTWlkaUZpbGVFeGNlcHRpb24uY3MiLCJDbGFzc2VzL01pZGlGaWxlUmVhZGVyLmNzIiwiQ2xhc3Nlcy9NaWRpTm90ZS5jcyIsIkNsYXNzZXMvTWlkaU9wdGlvbnMuY3MiLCJDbGFzc2VzL01pZGlUcmFjay5jcyIsIkNsYXNzZXMvV2hpdGVOb3RlLmNzIiwiQ2xhc3Nlcy9EcmF3aW5nL1BhaW50RXZlbnRBcmdzLmNzIiwiQ2xhc3Nlcy9EcmF3aW5nL1BhbmVsLmNzIiwiQ2xhc3Nlcy9JTy9QYXRoLmNzIiwiQ2xhc3Nlcy9EcmF3aW5nL1Blbi5jcyIsIkNsYXNzZXMvRHJhd2luZy9Qb2ludC5jcyIsIkNsYXNzZXMvRHJhd2luZy9SZWN0YW5nbGUuY3MiLCJDbGFzc2VzL1N0YWZmLmNzIiwiQ2xhc3Nlcy9TdGVtLmNzIiwiQ2xhc3Nlcy9TeW1ib2xXaWR0aHMuY3MiLCJDbGFzc2VzL1RpbWVTaWduYXR1cmUuY3MiLCJDbGFzc2VzL1RleHQvQVNDSUkuY3MiLCJDbGFzc2VzL1RleHQvRW5jb2RpbmcuY3MiLCJDbGFzc2VzL0FjY2lkU3ltYm9sLmNzIiwiQ2xhc3Nlcy9CYXJTeW1ib2wuY3MiLCJDbGFzc2VzL0RyYXdpbmcvQml0bWFwLmNzIiwiQ2xhc3Nlcy9CbGFua1N5bWJvbC5jcyIsIkNsYXNzZXMvQ2hvcmRTeW1ib2wuY3MiLCJDbGFzc2VzL0NsZWZTeW1ib2wuY3MiLCJDbGFzc2VzL0lPL0ZpbGVTdHJlYW0uY3MiLCJDbGFzc2VzL1BpYW5vLmNzIiwiQ2xhc3Nlcy9SZXN0U3ltYm9sLmNzIiwiQ2xhc3Nlcy9TaGVldE11c2ljLmNzIiwiQ2xhc3Nlcy9EcmF3aW5nL1NvbGlkQnJ1c2guY3MiLCJDbGFzc2VzL1RpbWVTaWdTeW1ib2wuY3MiXSwKICAibmFtZXMiOiBbIiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQW9CZ0JBLE9BQU9BLDBCQUE4Q0E7Ozs7O29CQVFyREEsT0FBT0EsMkJBQStDQTs7Ozs7NEJBakI5Q0EsTUFBV0E7O2dCQUV2QkEsc0JBQXFDQSxNQUFNQSxNQUFNQTs7Ozs7Ozs7Ozs7OzRCQ2U3QkEsUUFBWUEsT0FBV0E7O2dCQUUzQ0EsY0FBY0E7Z0JBQ2RBLGFBQWFBO2dCQUNiQSxZQUFZQTs7Ozs7Z0JBS1pBLFlBQWVBLGtCQUFTQTtnQkFDeEJBLGtCQUFXQSxXQUFNQSxhQUFRQSxVQUFVQTtnQkFDbkNBLE9BQU9BOzs7Ozs7Ozs7OzRCQzdCRUE7O2dCQUVUQSxhQUFRQTs7Ozs7Ozs7Ozs7Ozt3QkNKc0JBLE9BQU9BLElBQUlBLHFCQUFNQTs7Ozs7d0JBQ2pCQSxPQUFPQSxJQUFJQSxxQkFBTUE7Ozs7O3dCQUNiQSxPQUFPQSxJQUFJQSxxQkFBTUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29DQ3FGOUJBOztvQkFDekJBLGNBQWNBO29CQUNkQTtvQkFDQUEsMEJBQXVCQTs7Ozs0QkFDbkJBLGlCQUFTQTs7Ozs7O3FCQUViQSxJQUFJQTt3QkFDQUEsT0FBT0E7MkJBRU5BLElBQUlBLHdCQUFNQSxzQkFBZUE7d0JBQzFCQSxP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b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGlDQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxpQ0FBTEEsUUFBMEJBOztvQkFFMUJBLE1BQU1BLHlEQUFVQSwrQkFBVkE7b0JBQ05BLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGlDQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGlDQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxpQ0FBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxpQ0FBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsaUNBQUxBLFFBQTBCQTs7b0JBRTFCQSxNQUFNQSx5REFBVUEsK0JBQVZBO29CQUNOQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxpQ0FBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxpQ0FBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsaUNBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsaUNBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGlDQUFMQSxRQUEwQkE7O29C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QkFBS0EsaUNBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGdDQUFMQSxRQUEwQkE7O29CQUUxQkEsTUFBTUEsd0RBQVNBLG1DQUFUQTtvQkFDTkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsZ0NBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsZ0NBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGdDQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGlDQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxnQ0FBTEEsUUFBMEJBOztvQkFFMUJBLE1BQU1BLHdEQUFTQSxtQ0FBVEE7b0JBQ05BLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGdDQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGdDQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxnQ0FBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxpQ0FBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsZ0NBQUxBLFFBQTBCQTs7b0JBRTFCQSxNQUFNQSx3REFBU0EsbUNBQVRBO29CQUNOQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFL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LHVEQUFPQSxrQkFBUEE7OztnQkFHZEEsZ0JBQWdCQTtnQkFDaEJBLGVBQWVBLDRDQUFjQSxZQUFZQTtnQkFDekNBLFlBQVlBLFVBQVVBLE1BQU1BLFVBQVVBO2dCQUN0Q0EsWUFBWUEsVUFBVUEsU0FBT0EsK0RBQXlCQSxVQUFVQTtnQkFDaEVBLHFCQUFxQkEsR0FBQ0EsQ0FBQ0EsZUFBUUE7OztnQkFJL0JBLE9BQU9BLG9FQUNjQSwwQ0FBV0EiLAogICJzb3VyY2VzQ29udGVudCI6IFsidXNpbmcgQnJpZGdlO1xyXG51c2luZyBTeXN0ZW07XHJcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xyXG51c2luZyBTeXN0ZW0uVGV4dDtcclxuXHJcbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY1xyXG57XHJcbiAgICBwdWJsaWMgY2xhc3MgSW1hZ2VcclxuICAgIHtcclxuICAgICAgICBwdWJsaWMgb2JqZWN0IERvbUltYWdlO1xyXG5cclxuICAgICAgICBwcm90ZWN0ZWQgSW1hZ2UoVHlwZSB0eXBlLCBzdHJpbmcgZmlsZW5hbWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBTY3JpcHQuQ2FsbChcImJyaWRnZVV0aWwuaW1hZ2UuY3RvclwiLCB0aGlzLCB0eXBlLCBmaWxlbmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgaW50IFdpZHRoXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBnZXRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFNjcmlwdC5DYWxsPGludD4oXCJicmlkZ2VVdGlsLmltYWdlLmdldFdpZHRoXCIsIHRoaXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgaW50IEhlaWdodFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ2V0XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBTY3JpcHQuQ2FsbDxpbnQ+KFwiYnJpZGdlVXRpbC5pbWFnZS5nZXRIZWlnaHRcIiwgdGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uVGV4dDtcclxuXHJcbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY1xyXG57XHJcbiAgICAvL2FkYXB0ZWQgZnJvbSBodHRwczovL3d3dy5jb2RlcHJvamVjdC5jb20vQXJ0aWNsZXMvMTA2MTMvJTJGQXJ0aWNsZXMlMkYxMDYxMyUyRkMtUklGRi1QYXJzZXJcclxuICAgIC8vbW9kaWZpZWQgdG8gdXNlIGJ5dGUgYXJyYXkgaW5zdGVhZCBvZiBzdHJlYW0gc2luY2UgdGhpcyB3aWxsIGJlIGNvbXBpbGVkIHRvIEphdmFzY3JpcHRcclxuICAgIHB1YmxpYyBjbGFzcyBSaWZmUGFyc2VyRXhjZXB0aW9uIDogRXhjZXB0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgcHVibGljIFJpZmZQYXJzZXJFeGNlcHRpb24oc3RyaW5nIG1lc3NhZ2UpXHJcbiAgICAgICAgICAgIDogYmFzZShtZXNzYWdlKVxyXG4gICAgICAgIHtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGFzcyBSaWZmRmlsZUluZm9cclxuICAgIHtcclxuICAgICAgICBwdWJsaWMgc3RyaW5nIEhlYWRlciB7IGdldDsgc2V0OyB9XHJcbiAgICAgICAgcHVibGljIHN0cmluZyBGaWxlVHlwZSB7IGdldDsgc2V0OyB9XHJcbiAgICAgICAgcHVibGljIGludCBGaWxlU2l6ZSB7IGdldDsgc2V0OyB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsYXNzIEJvdW5kZWRCeXRlQXJyYXlcclxuICAgIHtcclxuICAgICAgICBwcml2YXRlIGludCBvZmZzZXQ7XHJcbiAgICAgICAgcHJpdmF0ZSBpbnQgY291bnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBieXRlW10gZGF0YTtcclxuICAgICAgICBwdWJsaWMgQm91bmRlZEJ5dGVBcnJheShpbnQgb2Zmc2V0LCBpbnQgY291bnQsIGJ5dGVbXSBkYXRhKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5vZmZzZXQgPSBvZmZzZXQ7XHJcbiAgICAgICAgICAgIHRoaXMuY291bnQgPSBjb3VudDtcclxuICAgICAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBieXRlW10gR2V0RGF0YSgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBieXRlW10gc2xpY2UgPSBuZXcgYnl0ZVtjb3VudF07XHJcbiAgICAgICAgICAgIEFycmF5LkNvcHkoZGF0YSwgb2Zmc2V0LCBzbGljZSwgMCwgY291bnQpO1xyXG4gICAgICAgICAgICByZXR1cm4gc2xpY2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZWxlZ2F0ZSB2b2lkIFByb2Nlc3NFbGVtZW50KHN0cmluZyB0eXBlLCBib29sIGlzTGlzdCwgQm91bmRlZEJ5dGVBcnJheSBkYXRhKTtcclxuXHJcblxyXG4gICAgcHVibGljIGNsYXNzIFJpZmZQYXJzZXJcclxuICAgIHtcclxuICAgICAgICBwcml2YXRlIGNvbnN0IGludCBXb3JkU2l6ZSA9IDQ7XHJcbiAgICAgICAgcHJpdmF0ZSBjb25zdCBzdHJpbmcgUmlmZjRDQyA9IFwiUklGRlwiO1xyXG4gICAgICAgIHByaXZhdGUgY29uc3Qgc3RyaW5nIFJpZlg0Q0MgPSBcIlJJRlhcIjtcclxuICAgICAgICBwcml2YXRlIGNvbnN0IHN0cmluZyBMaXN0NENDID0gXCJMSVNUXCI7XHJcblxyXG4gICAgICAgIHByaXZhdGUgYnl0ZVtdIGRhdGE7XHJcbiAgICAgICAgcHJpdmF0ZSBpbnQgcG9zaXRpb247XHJcblxyXG4gICAgICAgIHB1YmxpYyBSaWZmRmlsZUluZm8gRmlsZUluZm8geyBnZXQ7IHByaXZhdGUgc2V0OyB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIFJpZmZGaWxlSW5mbyBSZWFkSGVhZGVyKGJ5dGVbXSBkYXRhKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEuTGVuZ3RoIDwgV29yZFNpemUgKiAzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmlmZlBhcnNlckV4Y2VwdGlvbihcIlJlYWQgZmFpbGVkLiBGaWxlIHRvbyBzbWFsbD9cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHN0cmluZyBoZWFkZXI7XHJcbiAgICAgICAgICAgIGlmICghSXNSaWZmRmlsZShkYXRhLCBvdXQgaGVhZGVyKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJpZmZQYXJzZXJFeGNlcHRpb24oXCJSZWFkIGZhaWxlZC4gTm8gUklGRiBoZWFkZXJcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSaWZmRmlsZUluZm9cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgSGVhZGVyID0gaGVhZGVyLFxyXG4gICAgICAgICAgICAgICAgRmlsZVNpemUgPSBCaXRDb252ZXJ0ZXIuVG9JbnQzMihkYXRhLCBXb3JkU2l6ZSksXHJcbiAgICAgICAgICAgICAgICBGaWxlVHlwZSA9IEVuY29kaW5nLkFTQ0lJLkdldFN0cmluZyhkYXRhLCBXb3JkU2l6ZSAqIDIsIFdvcmRTaXplKSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgUmlmZlBhcnNlcigpIHsgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIFJpZmZQYXJzZXIgUGFyc2VCeXRlQXJyYXkoYnl0ZVtdIGRhdGEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgcmlmZlBhcnNlciA9IG5ldyBSaWZmUGFyc2VyKCk7XHJcbiAgICAgICAgICAgIHJpZmZQYXJzZXIuSW5pdChkYXRhKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJpZmZQYXJzZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgdm9pZCBJbml0KGJ5dGVbXSBkYXRhKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcclxuICAgICAgICAgICAgRmlsZUluZm8gPSBSZWFkSGVhZGVyKGRhdGEpO1xyXG4gICAgICAgICAgICBwb3NpdGlvbiA9IFdvcmRTaXplICogMztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgYm9vbCBJc1JpZmZGaWxlKGJ5dGVbXSBkYXRhLCBvdXQgc3RyaW5nIGhlYWRlcilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB0ZXN0ID0gRW5jb2RpbmcuQVNDSUkuR2V0U3RyaW5nKGRhdGEsIDAsIFdvcmRTaXplKTtcclxuICAgICAgICAgICAgaWYgKHRlc3QgPT0gUmlmZjRDQyB8fCB0ZXN0ID09IFJpZlg0Q0MpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGhlYWRlciA9IHRlc3Q7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBoZWFkZXIgPSBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYm9vbCBSZWFkKFByb2Nlc3NFbGVtZW50IHByb2Nlc3NFbGVtZW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEuTGVuZ3RoIC0gcG9zaXRpb24gPCBXb3JkU2l6ZSAqIDIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHR5cGUgPSBFbmNvZGluZy5BU0NJSS5HZXRTdHJpbmcoZGF0YSwgcG9zaXRpb24sIFdvcmRTaXplKTtcclxuICAgICAgICAgICAgcG9zaXRpb24gKz0gV29yZFNpemU7XHJcbiAgICAgICAgICAgIHZhciBzaXplID0gQml0Q29udmVydGVyLlRvSW50MzIoZGF0YSwgcG9zaXRpb24pO1xyXG4gICAgICAgICAgICBwb3NpdGlvbiArPSBXb3JkU2l6ZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRhLkxlbmd0aCAtIHBvc2l0aW9uIDwgc2l6ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJpZmZQYXJzZXJFeGNlcHRpb24oc3RyaW5nLkZvcm1hdChcIkVsZW1lbnQgc2l6ZSBtaXNtYXRjaCBmb3IgZWxlbWVudCB7MH0gXCIsdHlwZSkrXHJcbnN0cmluZy5Gb3JtYXQoXCJuZWVkIHswfSBidXQgaGF2ZSBvbmx5IHsxfVwiLHNpemUsRmlsZUluZm8uRmlsZVNpemUgLSBwb3NpdGlvbikpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBMaXN0NENDKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGlzdFR5cGUgPSBFbmNvZGluZy5BU0NJSS5HZXRTdHJpbmcoZGF0YSwgcG9zaXRpb24sIFdvcmRTaXplKTtcclxuICAgICAgICAgICAgICAgIHByb2Nlc3NFbGVtZW50KGxpc3RUeXBlLCB0cnVlLCBuZXcgQm91bmRlZEJ5dGVBcnJheShwb3NpdGlvbiArIFdvcmRTaXplLCBzaXplLCBkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiArPSBzaXplO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhZGRlZFNpemUgPSBzaXplO1xyXG4gICAgICAgICAgICAgICAgaWYgKChzaXplICYgMSkgIT0gMCkgcGFkZGVkU2l6ZSsrO1xyXG4gICAgICAgICAgICAgICAgcHJvY2Vzc0VsZW1lbnQodHlwZSwgZmFsc2UsIG5ldyBCb3VuZGVkQnl0ZUFycmF5KHBvc2l0aW9uLCBzaXplLCBkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiArPSBwYWRkZWRTaXplO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCJ1c2luZyBTeXN0ZW07XHJcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xyXG51c2luZyBTeXN0ZW0uVGV4dDtcclxuXHJcbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY1xyXG57XHJcbiAgICBwdWJsaWMgY2xhc3MgQnJ1c2hcclxuICAgIHtcclxuICAgICAgICBwdWJsaWMgQ29sb3IgQ29sb3I7XHJcblxyXG4gICAgICAgIHB1YmxpYyBCcnVzaChDb2xvciBjb2xvcilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIENvbG9yID0gY29sb3I7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBEaXNwb3NlKCkgeyB9XHJcbiAgICB9XHJcbn1cclxuIiwidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcblxyXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBjbGFzcyBCcnVzaGVzXHJcbiAgICB7XHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBCcnVzaCBCbGFjayB7IGdldCB7IHJldHVybiBuZXcgQnJ1c2goQ29sb3IuQmxhY2spOyB9IH1cclxuICAgICAgICBwdWJsaWMgc3RhdGljIEJydXNoIFdoaXRlIHsgZ2V0IHsgcmV0dXJuIG5ldyBCcnVzaChDb2xvci5XaGl0ZSk7IH0gfVxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgQnJ1c2ggTGlnaHRHcmF5IHsgZ2V0IHsgcmV0dXJuIG5ldyBCcnVzaChDb2xvci5MaWdodEdyYXkpOyB9IH1cclxuICAgIH1cclxufVxyXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMDggTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xuXG4vKiogQGNsYXNzIENsZWZNZWFzdXJlc1xuICogVGhlIENsZWZNZWFzdXJlcyBjbGFzcyBpcyB1c2VkIHRvIHJlcG9ydCB3aGF0IENsZWYgKFRyZWJsZSBvciBCYXNzKSBhXG4gKiBnaXZlbiBtZWFzdXJlIHVzZXMuXG4gKi9cbnB1YmxpYyBjbGFzcyBDbGVmTWVhc3VyZXMge1xuICAgIHByaXZhdGUgTGlzdDxDbGVmPiBjbGVmczsgIC8qKiBUaGUgY2xlZnMgdXNlZCBmb3IgZWFjaCBtZWFzdXJlIChmb3IgYSBzaW5nbGUgdHJhY2spICovXG4gICAgcHJpdmF0ZSBpbnQgbWVhc3VyZTsgICAgICAgLyoqIFRoZSBsZW5ndGggb2YgYSBtZWFzdXJlLCBpbiBwdWxzZXMgKi9cblxuIFxuICAgIC8qKiBHaXZlbiB0aGUgbm90ZXMgaW4gYSB0cmFjaywgY2FsY3VsYXRlIHRoZSBhcHByb3ByaWF0ZSBDbGVmIHRvIHVzZVxuICAgICAqIGZvciBlYWNoIG1lYXN1cmUuICBTdG9yZSB0aGUgcmVzdWx0IGluIHRoZSBjbGVmcyBsaXN0LlxuICAgICAqIEBwYXJhbSBub3RlcyAgVGhlIG1pZGkgbm90ZXNcbiAgICAgKiBAcGFyYW0gbWVhc3VyZWxlbiBUaGUgbGVuZ3RoIG9mIGEgbWVhc3VyZSwgaW4gcHVsc2VzXG4gICAgICovXG4gICAgcHVibGljIENsZWZNZWFzdXJlcyhMaXN0PE1pZGlOb3RlPiBub3RlcywgaW50IG1lYXN1cmVsZW4pIHtcbiAgICAgICAgbWVhc3VyZSA9IG1lYXN1cmVsZW47XG4gICAgICAgIENsZWYgbWFpbmNsZWYgPSBNYWluQ2xlZihub3Rlcyk7XG4gICAgICAgIGludCBuZXh0bWVhc3VyZSA9IG1lYXN1cmVsZW47XG4gICAgICAgIGludCBwb3MgPSAwO1xuICAgICAgICBDbGVmIGNsZWYgPSBtYWluY2xlZjtcblxuICAgICAgICBjbGVmcyA9IG5ldyBMaXN0PENsZWY+KCk7XG5cbiAgICAgICAgd2hpbGUgKHBvcyA8IG5vdGVzLkNvdW50KSB7XG4gICAgICAgICAgICAvKiBTdW0gYWxsIHRoZSBub3RlcyBpbiB0aGUgY3VycmVudCBtZWFzdXJlICovXG4gICAgICAgICAgICBpbnQgc3Vtbm90ZXMgPSAwO1xuICAgICAgICAgICAgaW50IG5vdGVjb3VudCA9IDA7XG4gICAgICAgICAgICB3aGlsZSAocG9zIDwgbm90ZXMuQ291bnQgJiYgbm90ZXNbcG9zXS5TdGFydFRpbWUgPCBuZXh0bWVhc3VyZSkge1xuICAgICAgICAgICAgICAgIHN1bW5vdGVzICs9IG5vdGVzW3Bvc10uTnVtYmVyO1xuICAgICAgICAgICAgICAgIG5vdGVjb3VudCsrO1xuICAgICAgICAgICAgICAgIHBvcysrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vdGVjb3VudCA9PSAwKVxuICAgICAgICAgICAgICAgIG5vdGVjb3VudCA9IDE7XG5cbiAgICAgICAgICAgIC8qIENhbGN1bGF0ZSB0aGUgXCJhdmVyYWdlXCIgbm90ZSBpbiB0aGUgbWVhc3VyZSAqL1xuICAgICAgICAgICAgaW50IGF2Z25vdGUgPSBzdW1ub3RlcyAvIG5vdGVjb3VudDtcbiAgICAgICAgICAgIGlmIChhdmdub3RlID09IDApIHtcbiAgICAgICAgICAgICAgICAvKiBUaGlzIG1lYXN1cmUgZG9lc24ndCBjb250YWluIGFueSBub3Rlcy5cbiAgICAgICAgICAgICAgICAgKiBLZWVwIHRoZSBwcmV2aW91cyBjbGVmLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYXZnbm90ZSA+PSBXaGl0ZU5vdGUuQm90dG9tVHJlYmxlLk51bWJlcigpKSB7XG4gICAgICAgICAgICAgICAgY2xlZiA9IENsZWYuVHJlYmxlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYXZnbm90ZSA8PSBXaGl0ZU5vdGUuVG9wQmFzcy5OdW1iZXIoKSkge1xuICAgICAgICAgICAgICAgIGNsZWYgPSBDbGVmLkJhc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvKiBUaGUgYXZlcmFnZSBub3RlIGlzIGJldHdlZW4gRzMgYW5kIEY0LiBXZSBjYW4gdXNlIGVpdGhlclxuICAgICAgICAgICAgICAgICAqIHRoZSB0cmVibGUgb3IgYmFzcyBjbGVmLiAgVXNlIHRoZSBcIm1haW5cIiBjbGVmLCB0aGUgY2xlZlxuICAgICAgICAgICAgICAgICAqIHRoYXQgYXBwZWFycyBtb3N0IGZvciB0aGlzIHRyYWNrLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGNsZWYgPSBtYWluY2xlZjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2xlZnMuQWRkKGNsZWYpO1xuICAgICAgICAgICAgbmV4dG1lYXN1cmUgKz0gbWVhc3VyZWxlbjtcbiAgICAgICAgfVxuICAgICAgICBjbGVmcy5BZGQoY2xlZik7XG4gICAgfVxuXG4gICAgLyoqIEdpdmVuIGEgdGltZSAoaW4gcHVsc2VzKSwgcmV0dXJuIHRoZSBjbGVmIHVzZWQgZm9yIHRoYXQgbWVhc3VyZS4gKi9cbiAgICBwdWJsaWMgQ2xlZiBHZXRDbGVmKGludCBzdGFydHRpbWUpIHtcblxuICAgICAgICAvKiBJZiB0aGUgdGltZSBleGNlZWRzIHRoZSBsYXN0IG1lYXN1cmUsIHJldHVybiB0aGUgbGFzdCBtZWFzdXJlICovXG4gICAgICAgIGlmIChzdGFydHRpbWUgLyBtZWFzdXJlID49IGNsZWZzLkNvdW50KSB7XG4gICAgICAgICAgICByZXR1cm4gY2xlZnNbIGNsZWZzLkNvdW50LTEgXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjbGVmc1sgc3RhcnR0aW1lIC8gbWVhc3VyZSBdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIENhbGN1bGF0ZSB0aGUgYmVzdCBjbGVmIHRvIHVzZSBmb3IgdGhlIGdpdmVuIG5vdGVzLiAgSWYgdGhlXG4gICAgICogYXZlcmFnZSBub3RlIGlzIGJlbG93IE1pZGRsZSBDLCB1c2UgYSBiYXNzIGNsZWYuICBFbHNlLCB1c2UgYSB0cmVibGVcbiAgICAgKiBjbGVmLlxuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIENsZWYgTWFpbkNsZWYoTGlzdDxNaWRpTm90ZT4gbm90ZXMpIHtcbiAgICAgICAgaW50IG1pZGRsZUMgPSBXaGl0ZU5vdGUuTWlkZGxlQy5OdW1iZXIoKTtcbiAgICAgICAgaW50IHRvdGFsID0gMDtcbiAgICAgICAgZm9yZWFjaCAoTWlkaU5vdGUgbSBpbiBub3Rlcykge1xuICAgICAgICAgICAgdG90YWwgKz0gbS5OdW1iZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vdGVzLkNvdW50ID09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBDbGVmLlRyZWJsZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0b3RhbC9ub3Rlcy5Db3VudCA+PSBtaWRkbGVDKSB7XG4gICAgICAgICAgICByZXR1cm4gQ2xlZi5UcmVibGU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gQ2xlZi5CYXNzO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cbn1cblxuIiwidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcblxyXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcclxue1xyXG4gICAgcHVibGljIGNsYXNzIENvbG9yXHJcbiAgICB7XHJcbiAgICAgICAgcHVibGljIGludCBSZWQ7XHJcbiAgICAgICAgcHVibGljIGludCBHcmVlbjtcclxuICAgICAgICBwdWJsaWMgaW50IEJsdWU7XHJcbiAgICAgICAgcHVibGljIGludCBBbHBoYTtcclxuXHJcbiAgICAgICAgcHVibGljIENvbG9yKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIEFscGhhID0gMjU1O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBDb2xvciBGcm9tUmdiKGludCByZWQsIGludCBncmVlbiwgaW50IGJsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEZyb21BcmdiKDI1NSwgcmVkLCBncmVlbiwgYmx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIENvbG9yIEZyb21BcmdiKGludCBhbHBoYSwgaW50IHJlZCwgaW50IGdyZWVuLCBpbnQgYmx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29sb3JcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgQWxwaGEgPSBhbHBoYSxcclxuICAgICAgICAgICAgICAgIFJlZCA9IHJlZCxcclxuICAgICAgICAgICAgICAgIEdyZWVuID0gZ3JlZW4sXHJcbiAgICAgICAgICAgICAgICBCbHVlID0gYmx1ZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBDb2xvciBCbGFjayB7IGdldCB7IHJldHVybiBuZXcgQ29sb3IoKTsgfSB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgQ29sb3IgV2hpdGUgeyBnZXQgeyByZXR1cm4gRnJvbVJnYigyNTUsMjU1LDI1NSk7IH0gfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIENvbG9yIExpZ2h0R3JheSB7IGdldCB7IHJldHVybiBGcm9tUmdiKDB4ZDMsMHhkMywweGQzKTsgfSB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBpbnQgUiB7IGdldCB7IHJldHVybiBSZWQ7IH0gfVxyXG4gICAgICAgIHB1YmxpYyBpbnQgRyB7IGdldCB7IHJldHVybiBHcmVlbjsgfSB9XHJcbiAgICAgICAgcHVibGljIGludCBCIHsgZ2V0IHsgcmV0dXJuIEJsdWU7IH0gfVxyXG5cclxuICAgICAgICBwdWJsaWMgYm9vbCBFcXVhbHMoQ29sb3IgY29sb3IpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gUmVkID09IGNvbG9yLlJlZCAmJiBHcmVlbiA9PSBjb2xvci5HcmVlbiAmJiBCbHVlID09IGNvbG9yLkJsdWUgJiYgQWxwaGE9PWNvbG9yLkFscGhhO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCJ1c2luZyBTeXN0ZW07XHJcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xyXG51c2luZyBTeXN0ZW0uVGV4dDtcclxuXHJcbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY1xyXG57XHJcbiAgICBwdWJsaWMgY2xhc3MgQ29udHJvbFxyXG4gICAge1xyXG4gICAgICAgIHB1YmxpYyBpbnQgV2lkdGg7XHJcbiAgICAgICAgcHVibGljIGludCBIZWlnaHQ7XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIEludmFsaWRhdGUoKSB7IH1cclxuXHJcbiAgICAgICAgcHVibGljIEdyYXBoaWNzIENyZWF0ZUdyYXBoaWNzKHN0cmluZyBuYW1lKSB7IHJldHVybiBuZXcgR3JhcGhpY3MobmFtZSk7IH1cclxuXHJcbiAgICAgICAgcHVibGljIFBhbmVsIFBhcmVudCB7IGdldCB7IHJldHVybiBuZXcgUGFuZWwoKTsgfSB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBDb2xvciBCYWNrQ29sb3I7XHJcbiAgICB9XHJcbn1cclxuIiwidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcblxyXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcclxue1xyXG4gICAgcHVibGljIGNsYXNzIFN0cmVhbVxyXG4gICAge1xyXG4gICAgICAgIHB1YmxpYyB2b2lkIFdyaXRlKGJ5dGVbXSBidWZmZXIsIGludCBvZmZzZXQsIGludCBjb3VudCkgeyB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIENsb3NlKCkgeyB9XHJcbiAgICB9XHJcbn1cclxuIiwidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcblxyXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcclxue1xyXG4gICAgcHVibGljIGNsYXNzIEZvbnRcclxuICAgIHtcclxuICAgICAgICBwdWJsaWMgc3RyaW5nIE5hbWU7XHJcbiAgICAgICAgcHVibGljIGludCBTaXplO1xyXG4gICAgICAgIHB1YmxpYyBGb250U3R5bGUgU3R5bGU7XHJcblxyXG4gICAgICAgIHB1YmxpYyBGb250KHN0cmluZyBuYW1lLCBpbnQgc2l6ZSwgRm9udFN0eWxlIHN0eWxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgTmFtZSA9IG5hbWU7XHJcbiAgICAgICAgICAgIFNpemUgPSBzaXplO1xyXG4gICAgICAgICAgICBTdHlsZSA9IHN0eWxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGZsb2F0IEdldEhlaWdodCgpIHsgcmV0dXJuIDA7IH1cclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgRGlzcG9zZSgpIHsgfVxyXG4gICAgfVxyXG59XHJcbiIsInVzaW5nIEJyaWRnZTtcclxudXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcblxyXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcclxue1xyXG4gICAgcHVibGljIGNsYXNzIEdyYXBoaWNzXHJcbiAgICB7XHJcbiAgICAgICAgcHVibGljIEdyYXBoaWNzKHN0cmluZyBuYW1lKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgTmFtZSA9IG5hbWU7XHJcbiAgICAgICAgICAgIFNjcmlwdC5DYWxsKFwiYnJpZGdlVXRpbC5ncmFwaGljcy5pbml0R3JhcGhpY3NcIiwgdGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RyaW5nIE5hbWU7XHJcblxyXG4gICAgICAgIHB1YmxpYyBvYmplY3QgQ29udGV4dDtcclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgVHJhbnNsYXRlVHJhbnNmb3JtKGludCB4LCBpbnQgeSkge1xyXG4gICAgICAgICAgICBTY3JpcHQuQ2FsbChcImJyaWRnZVV0aWwuZ3JhcGhpY3MudHJhbnNsYXRlVHJhbnNmb3JtXCIsIHRoaXMsIHgsIHkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgRHJhd0ltYWdlKEltYWdlIGltYWdlLCBpbnQgeCwgaW50IHksIGludCB3aWR0aCwgaW50IGhlaWdodCkge1xyXG4gICAgICAgICAgICBTY3JpcHQuQ2FsbChcImJyaWRnZVV0aWwuZ3JhcGhpY3MuZHJhd0ltYWdlXCIsIHRoaXMsIGltYWdlLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIERyYXdTdHJpbmcoc3RyaW5nIHRleHQsIEZvbnQgZm9udCwgQnJ1c2ggYnJ1c2gsIGludCB4LCBpbnQgeSkge1xyXG4gICAgICAgICAgICBTY3JpcHQuQ2FsbChcImJyaWRnZVV0aWwuZ3JhcGhpY3MuZHJhd1N0cmluZ1wiLCB0aGlzLCB0ZXh0LCBmb250LCBicnVzaCwgeCwgeSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBEcmF3TGluZShQZW4gcGVuLCBpbnQgeFN0YXJ0LCBpbnQgeVN0YXJ0LCBpbnQgeEVuZCwgaW50IHlFbmQpIHtcclxuICAgICAgICAgICAgU2NyaXB0LkNhbGwoXCJicmlkZ2VVdGlsLmdyYXBoaWNzLmRyYXdMaW5lXCIsIHRoaXMsIHBlbiwgeFN0YXJ0LCB5U3RhcnQsIHhFbmQsIHlFbmQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgRHJhd0JlemllcihQZW4gcGVuLCBpbnQgeDEsIGludCB5MSwgaW50IHgyLCBpbnQgeTIsIGludCB4MywgaW50IHkzLCBpbnQgeDQsIGludCB5NCkge1xyXG4gICAgICAgICAgICBTY3JpcHQuQ2FsbChcImJyaWRnZVV0aWwuZ3JhcGhpY3MuZHJhd0JlemllclwiLCB0aGlzLCBwZW4sIHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBTY2FsZVRyYW5zZm9ybShmbG9hdCB4LCBmbG9hdCB5KSB7XHJcbiAgICAgICAgICAgIFNjcmlwdC5DYWxsKFwiYnJpZGdlVXRpbC5ncmFwaGljcy5zY2FsZVRyYW5zZm9ybVwiLCB0aGlzLCB4LCB5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIEZpbGxSZWN0YW5nbGUoQnJ1c2ggYnJ1c2gsIGludCB4LCBpbnQgeSwgaW50IHdpZHRoLCBpbnQgaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgIFNjcmlwdC5DYWxsKFwiYnJpZGdlVXRpbC5ncmFwaGljcy5maWxsUmVjdGFuZ2xlXCIsIHRoaXMsIGJydXNoLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIENsZWFyUmVjdGFuZ2xlKGludCB4LCBpbnQgeSwgaW50IHdpZHRoLCBpbnQgaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgIFNjcmlwdC5DYWxsKFwiYnJpZGdlVXRpbC5ncmFwaGljcy5jbGVhclJlY3RhbmdsZVwiLCB0aGlzLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIEZpbGxFbGxpcHNlKEJydXNoIGJydXNoLCBpbnQgeCwgaW50IHksIGludCB3aWR0aCwgaW50IGhlaWdodCkge1xyXG4gICAgICAgICAgICBTY3JpcHQuQ2FsbChcImJyaWRnZVV0aWwuZ3JhcGhpY3MuZmlsbEVsbGlwc2VcIiwgdGhpcywgYnJ1c2gsIHgsIHksIHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgRHJhd0VsbGlwc2UoUGVuIHBlbiwgaW50IHgsIGludCB5LCBpbnQgd2lkdGgsIGludCBoZWlnaHQpIHtcclxuICAgICAgICAgICAgU2NyaXB0LkNhbGwoXCJicmlkZ2VVdGlsLmdyYXBoaWNzLmRyYXdFbGxpcHNlXCIsIHRoaXMsIHBlbiwgeCwgeSwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBSb3RhdGVUcmFuc2Zvcm0oZmxvYXQgYW5nbGVEZWcpIHtcclxuICAgICAgICAgICAgU2NyaXB0LkNhbGwoXCJicmlkZ2VVdGlsLmdyYXBoaWNzLnJvdGF0ZVRyYW5zZm9ybVwiLCB0aGlzLCBhbmdsZURlZyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgU21vb3RoaW5nTW9kZSBTbW9vdGhpbmdNb2RlIHsgZ2V0OyBzZXQ7IH1cclxuXHJcbiAgICAgICAgcHVibGljIFJlY3RhbmdsZSBWaXNpYmxlQ2xpcEJvdW5kcyB7IGdldDsgc2V0OyB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBmbG9hdCBQYWdlU2NhbGUgeyBnZXQ7IHNldDsgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBEaXNwb3NlKCkgeyB9XHJcbiAgICB9XHJcbn1cclxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAwNy0yMDEzIE1hZGhhdiBWYWlkeWFuYXRoYW5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuXG51c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uSU87XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xuXG5cbi8qKiBAY2xhc3MgS2V5U2lnbmF0dXJlXG4gKiBUaGUgS2V5U2lnbmF0dXJlIGNsYXNzIHJlcHJlc2VudHMgYSBrZXkgc2lnbmF0dXJlLCBsaWtlIEcgTWFqb3JcbiAqIG9yIEItZmxhdCBNYWpvci4gIEZvciBzaGVldCBtdXNpYywgd2Ugb25seSBjYXJlIGFib3V0IHRoZSBudW1iZXJcbiAqIG9mIHNoYXJwcyBvciBmbGF0cyBpbiB0aGUga2V5IHNpZ25hdHVyZSwgbm90IHdoZXRoZXIgaXQgaXMgbWFqb3JcbiAqIG9yIG1pbm9yLlxuICpcbiAqIFRoZSBtYWluIG9wZXJhdGlvbnMgb2YgdGhpcyBjbGFzcyBhcmU6XG4gKiAtIEd1ZXNzaW5nIHRoZSBrZXkgc2lnbmF0dXJlLCBnaXZlbiB0aGUgbm90ZXMgaW4gYSBzb25nLlxuICogLSBHZW5lcmF0aW5nIHRoZSBhY2NpZGVudGFsIHN5bWJvbHMgZm9yIHRoZSBrZXkgc2lnbmF0dXJlLlxuICogLSBEZXRlcm1pbmluZyB3aGV0aGVyIGEgcGFydGljdWxhciBub3RlIHJlcXVpcmVzIGFuIGFjY2lkZW50YWxcbiAqICAgb3Igbm90LlxuICpcbiAqL1xuXG5wdWJsaWMgY2xhc3MgS2V5U2lnbmF0dXJlIHtcbiAgICAvKiogVGhlIG51bWJlciBvZiBzaGFycHMgaW4gZWFjaCBrZXkgc2lnbmF0dXJlICovXG4gICAgcHVibGljIGNvbnN0IGludCBDID0gMDtcbiAgICBwdWJsaWMgY29uc3QgaW50IEcgPSAxO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgRCA9IDI7XG4gICAgcHVibGljIGNvbnN0IGludCBBID0gMztcbiAgICBwdWJsaWMgY29uc3QgaW50IEUgPSA0O1xuICAgIHB1YmxpYyBjb25zdCBpbnQgQiA9IDU7XG5cbiAgICAvKiogVGhlIG51bWJlciBvZiBmbGF0cyBpbiBlYWNoIGtleSBzaWduYXR1cmUgKi9cbiAgICBwdWJsaWMgY29uc3QgaW50IEYgPSAxO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgQmZsYXQgPSAyO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgRWZsYXQgPSAzO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgQWZsYXQgPSA0O1xuICAgIHB1YmxpYyBjb25zdCBpbnQgRGZsYXQgPSA1O1xuICAgIHB1YmxpYyBjb25zdCBpbnQgR2ZsYXQgPSA2O1xuXG4gICAgLyoqIFRoZSB0d28gYXJyYXlzIGJlbG93IGFyZSBrZXkgbWFwcy4gIFRoZXkgdGFrZSBhIG1ham9yIGtleVxuICAgICAqIChsaWtlIEcgbWFqb3IsIEItZmxhdCBtYWpvcikgYW5kIGEgbm90ZSBpbiB0aGUgc2NhbGUsIGFuZFxuICAgICAqIHJldHVybiB0aGUgQWNjaWRlbnRhbCByZXF1aXJlZCB0byBkaXNwbGF5IHRoYXQgbm90ZSBpbiB0aGVcbiAgICAgKiBnaXZlbiBrZXkuICBJbiBhIG51dHNoZWwsIHRoZSBtYXAgaXNcbiAgICAgKlxuICAgICAqICAgbWFwW0tleV1bTm90ZVNjYWxlXSAtPiBBY2NpZGVudGFsXG4gICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgQWNjaWRbXVtdIHNoYXJwa2V5cztcbiAgICBwcml2YXRlIHN0YXRpYyBBY2NpZFtdW10gZmxhdGtleXM7XG5cbiAgICBwcml2YXRlIGludCBudW1fZmxhdHM7ICAgLyoqIFRoZSBudW1iZXIgb2Ygc2hhcnBzIGluIHRoZSBrZXksIDAgdGhydSA2ICovXG4gICAgcHJpdmF0ZSBpbnQgbnVtX3NoYXJwczsgIC8qKiBUaGUgbnVtYmVyIG9mIGZsYXRzIGluIHRoZSBrZXksIDAgdGhydSA2ICovXG5cbiAgICAvKiogVGhlIGFjY2lkZW50YWwgc3ltYm9scyB0aGF0IGRlbm90ZSB0aGlzIGtleSwgaW4gYSB0cmVibGUgY2xlZiAqL1xuICAgIHByaXZhdGUgQWNjaWRTeW1ib2xbXSB0cmVibGU7XG5cbiAgICAvKiogVGhlIGFjY2lkZW50YWwgc3ltYm9scyB0aGF0IGRlbm90ZSB0aGlzIGtleSwgaW4gYSBiYXNzIGNsZWYgKi9cbiAgICBwcml2YXRlIEFjY2lkU3ltYm9sW10gYmFzcztcblxuICAgIC8qKiBUaGUga2V5IG1hcCBmb3IgdGhpcyBrZXkgc2lnbmF0dXJlOlxuICAgICAqICAga2V5bWFwW25vdGVudW1iZXJdIC0+IEFjY2lkZW50YWxcbiAgICAgKi9cbiAgICBwcml2YXRlIEFjY2lkW10ga2V5bWFwO1xuXG4gICAgLyoqIFRoZSBtZWFzdXJlIHVzZWQgaW4gdGhlIHByZXZpb3VzIGNhbGwgdG8gR2V0QWNjaWRlbnRhbCgpICovXG4gICAgcHJpdmF0ZSBpbnQgcHJldm1lYXN1cmU7IFxuXG5cbiAgICAvKiogQ3JlYXRlIG5ldyBrZXkgc2lnbmF0dXJlLCB3aXRoIHRoZSBnaXZlbiBudW1iZXIgb2ZcbiAgICAgKiBzaGFycHMgYW5kIGZsYXRzLiAgT25lIG9mIHRoZSB0d28gbXVzdCBiZSAwLCB5b3UgY2FuJ3RcbiAgICAgKiBoYXZlIGJvdGggc2hhcnBzIGFuZCBmbGF0cyBpbiB0aGUga2V5IHNpZ25hdHVyZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgS2V5U2lnbmF0dXJlKGludCBudW1fc2hhcnBzLCBpbnQgbnVtX2ZsYXRzKSB7XG4gICAgICAgIGlmICghKG51bV9zaGFycHMgPT0gMCB8fCBudW1fZmxhdHMgPT0gMCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBTeXN0ZW0uQXJndW1lbnRFeGNlcHRpb24oXCJCYWQgS2V5U2lnYXR1cmUgYXJnc1wiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm51bV9zaGFycHMgPSBudW1fc2hhcnBzO1xuICAgICAgICB0aGlzLm51bV9mbGF0cyA9IG51bV9mbGF0cztcblxuICAgICAgICBDcmVhdGVBY2NpZGVudGFsTWFwcygpO1xuICAgICAgICBrZXltYXAgPSBuZXcgQWNjaWRbMTYwXTtcbiAgICAgICAgUmVzZXRLZXlNYXAoKTtcbiAgICAgICAgQ3JlYXRlU3ltYm9scygpO1xuICAgIH1cblxuICAgIC8qKiBDcmVhdGUgbmV3IGtleSBzaWduYXR1cmUsIHdpdGggdGhlIGdpdmVuIG5vdGVzY2FsZS4gICovXG4gICAgcHVibGljIEtleVNpZ25hdHVyZShpbnQgbm90ZXNjYWxlKSB7XG4gICAgICAgIG51bV9zaGFycHMgPSBudW1fZmxhdHMgPSAwO1xuICAgICAgICBzd2l0Y2ggKG5vdGVzY2FsZSkge1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuQTogICAgIG51bV9zaGFycHMgPSAzOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkJmbGF0OiBudW1fZmxhdHMgPSAyOyAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5COiAgICAgbnVtX3NoYXJwcyA9IDU7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuQzogICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuRGZsYXQ6IG51bV9mbGF0cyA9IDU7ICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkQ6ICAgICBudW1fc2hhcnBzID0gMjsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5FZmxhdDogbnVtX2ZsYXRzID0gMzsgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuRTogICAgIG51bV9zaGFycHMgPSA0OyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkY6ICAgICBudW1fZmxhdHMgPSAxOyAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5HZmxhdDogbnVtX2ZsYXRzID0gNjsgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuRzogICAgIG51bV9zaGFycHMgPSAxOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkFmbGF0OiBudW1fZmxhdHMgPSA0OyAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBDcmVhdGVBY2NpZGVudGFsTWFwcygpO1xuICAgICAgICBrZXltYXAgPSBuZXcgQWNjaWRbMTYwXTtcbiAgICAgICAgUmVzZXRLZXlNYXAoKTtcbiAgICAgICAgQ3JlYXRlU3ltYm9scygpO1xuICAgIH1cblxuXG4gICAgLyoqIEluaWl0YWxpemUgdGhlIHNoYXJwa2V5cyBhbmQgZmxhdGtleXMgbWFwcyAqL1xuICAgIHByaXZhdGUgc3RhdGljIHZvaWQgQ3JlYXRlQWNjaWRlbnRhbE1hcHMoKSB7XG4gICAgICAgIGlmIChzaGFycGtleXMgIT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybjsgXG5cbiAgICAgICAgQWNjaWRbXSBtYXA7XG4gICAgICAgIHNoYXJwa2V5cyA9IG5ldyBBY2NpZFs4XVtdO1xuICAgICAgICBmbGF0a2V5cyA9IG5ldyBBY2NpZFs4XVtdO1xuXG4gICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgODsgaSsrKSB7XG4gICAgICAgICAgICBzaGFycGtleXNbaV0gPSBuZXcgQWNjaWRbMTJdO1xuICAgICAgICAgICAgZmxhdGtleXNbaV0gPSBuZXcgQWNjaWRbMTJdO1xuICAgICAgICB9XG5cbiAgICAgICAgbWFwID0gc2hhcnBrZXlzW0NdO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5BIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkFzaGFycCBdID0gQWNjaWQuRmxhdDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5DIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkNzaGFycCBdID0gQWNjaWQuU2hhcnA7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkQgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRHNoYXJwIF0gPSBBY2NpZC5TaGFycDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRSBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5GIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkZzaGFycCBdID0gQWNjaWQuU2hhcnA7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkcgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuR3NoYXJwIF0gPSBBY2NpZC5TaGFycDtcblxuICAgICAgICBtYXAgPSBzaGFycGtleXNbR107XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkEgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQXNoYXJwIF0gPSBBY2NpZC5GbGF0O1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5CIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkMgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQ3NoYXJwIF0gPSBBY2NpZC5TaGFycDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRCBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Ec2hhcnAgXSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkYgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRnNoYXJwIF0gPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkdzaGFycCBdID0gQWNjaWQuU2hhcnA7XG5cbiAgICAgICAgbWFwID0gc2hhcnBrZXlzW0RdO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5BIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkFzaGFycCBdID0gQWNjaWQuRmxhdDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5DIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkNzaGFycCBdID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRCBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Ec2hhcnAgXSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkYgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRnNoYXJwIF0gPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkdzaGFycCBdID0gQWNjaWQuU2hhcnA7XG5cbiAgICAgICAgbWFwID0gc2hhcnBrZXlzW0FdO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5BIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkFzaGFycCBdID0gQWNjaWQuRmxhdDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5DIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkNzaGFycCBdID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRCBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Ec2hhcnAgXSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkYgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRnNoYXJwIF0gPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkdzaGFycCBdID0gQWNjaWQuTm9uZTtcblxuICAgICAgICBtYXAgPSBzaGFycGtleXNbRV07XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkEgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQXNoYXJwIF0gPSBBY2NpZC5GbGF0O1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5CIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkMgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQ3NoYXJwIF0gPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5EIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkRzaGFycCBdID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRSBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5GIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkZzaGFycCBdID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRyBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Hc2hhcnAgXSA9IEFjY2lkLk5vbmU7XG5cbiAgICAgICAgbWFwID0gc2hhcnBrZXlzW0JdO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5BIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkFzaGFycCBdID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5DIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkNzaGFycCBdID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRCBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Ec2hhcnAgXSA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkUgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRiBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Gc2hhcnAgXSA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkcgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuR3NoYXJwIF0gPSBBY2NpZC5Ob25lO1xuXG4gICAgICAgIC8qIEZsYXQga2V5cyAqL1xuICAgICAgICBtYXAgPSBmbGF0a2V5c1tDXTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQSBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Bc2hhcnAgXSA9IEFjY2lkLkZsYXQ7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkIgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQyBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Dc2hhcnAgXSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5EIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkRzaGFycCBdID0gQWNjaWQuU2hhcnA7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkUgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Gc2hhcnAgXSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkdzaGFycCBdID0gQWNjaWQuU2hhcnA7XG5cbiAgICAgICAgbWFwID0gZmxhdGtleXNbRl07XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkEgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQmZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5CIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkMgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQ3NoYXJwIF0gPSBBY2NpZC5TaGFycDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRCBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FZmxhdCBdICA9IEFjY2lkLkZsYXQ7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkUgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Gc2hhcnAgXSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkFmbGF0IF0gID0gQWNjaWQuRmxhdDtcblxuICAgICAgICBtYXAgPSBmbGF0a2V5c1tCZmxhdF07XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkEgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQmZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5CIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkMgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQ3NoYXJwIF0gPSBBY2NpZC5TaGFycDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRCBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FZmxhdCBdICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkUgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Gc2hhcnAgXSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkFmbGF0IF0gID0gQWNjaWQuRmxhdDtcblxuICAgICAgICBtYXAgPSBmbGF0a2V5c1tFZmxhdF07XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkEgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQmZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5CIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkMgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRGZsYXQgXSAgPSBBY2NpZC5GbGF0O1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5EIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkVmbGF0IF0gID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRSBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5GIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkZzaGFycCBdID0gQWNjaWQuU2hhcnA7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkcgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQWZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuXG4gICAgICAgIG1hcCA9IGZsYXRrZXlzW0FmbGF0XTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQSBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5CZmxhdCBdICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkIgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQyBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5EZmxhdCBdICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkQgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRWZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkYgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRnNoYXJwIF0gPSBBY2NpZC5TaGFycDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRyBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5BZmxhdCBdICA9IEFjY2lkLk5vbmU7XG5cbiAgICAgICAgbWFwID0gZmxhdGtleXNbRGZsYXRdO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5BIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkJmbGF0IF0gID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQiBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5DIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkRmbGF0IF0gID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRCBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FZmxhdCBdICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkUgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HZmxhdCBdICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkcgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQWZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuXG4gICAgICAgIG1hcCA9IGZsYXRrZXlzW0dmbGF0XTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQSBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5CZmxhdCBdICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkIgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQyBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5EZmxhdCBdICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkQgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRWZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkYgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuR2ZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkFmbGF0IF0gID0gQWNjaWQuTm9uZTtcblxuXG4gICAgfVxuXG4gICAgLyoqIFRoZSBrZXltYXAgdGVsbHMgd2hhdCBhY2NpZGVudGFsIHN5bWJvbCBpcyBuZWVkZWQgZm9yIGVhY2hcbiAgICAgKiAgbm90ZSBpbiB0aGUgc2NhbGUuICBSZXNldCB0aGUga2V5bWFwIHRvIHRoZSB2YWx1ZXMgb2YgdGhlXG4gICAgICogIGtleSBzaWduYXR1cmUuXG4gICAgICovXG4gICAgcHJpdmF0ZSB2b2lkIFJlc2V0S2V5TWFwKClcbiAgICB7XG4gICAgICAgIEFjY2lkW10ga2V5O1xuICAgICAgICBpZiAobnVtX2ZsYXRzID4gMClcbiAgICAgICAgICAgIGtleSA9IGZsYXRrZXlzW251bV9mbGF0c107XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGtleSA9IHNoYXJwa2V5c1tudW1fc2hhcnBzXTtcblxuICAgICAgICBmb3IgKGludCBub3RlbnVtYmVyID0gMDsgbm90ZW51bWJlciA8IGtleW1hcC5MZW5ndGg7IG5vdGVudW1iZXIrKykge1xuICAgICAgICAgICAga2V5bWFwW25vdGVudW1iZXJdID0ga2V5W05vdGVTY2FsZS5Gcm9tTnVtYmVyKG5vdGVudW1iZXIpXTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqIENyZWF0ZSB0aGUgQWNjaWRlbnRhbCBzeW1ib2xzIGZvciB0aGlzIGtleSwgZm9yXG4gICAgICogdGhlIHRyZWJsZSBhbmQgYmFzcyBjbGVmcy5cbiAgICAgKi9cbiAgICBwcml2YXRlIHZvaWQgQ3JlYXRlU3ltYm9scygpIHtcbiAgICAgICAgaW50IGNvdW50ID0gTWF0aC5NYXgobnVtX3NoYXJwcywgbnVtX2ZsYXRzKTtcbiAgICAgICAgdHJlYmxlID0gbmV3IEFjY2lkU3ltYm9sW2NvdW50XTtcbiAgICAgICAgYmFzcyA9IG5ldyBBY2NpZFN5bWJvbFtjb3VudF07XG5cbiAgICAgICAgaWYgKGNvdW50ID09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIFdoaXRlTm90ZVtdIHRyZWJsZW5vdGVzID0gbnVsbDtcbiAgICAgICAgV2hpdGVOb3RlW10gYmFzc25vdGVzID0gbnVsbDtcblxuICAgICAgICBpZiAobnVtX3NoYXJwcyA+IDApICB7XG4gICAgICAgICAgICB0cmVibGVub3RlcyA9IG5ldyBXaGl0ZU5vdGVbXSB7XG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRiwgNSksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuQywgNSksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRywgNSksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRCwgNSksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuQSwgNiksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRSwgNSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBiYXNzbm90ZXMgPSBuZXcgV2hpdGVOb3RlW10ge1xuICAgICAgICAgICAgICAgIG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkYsIDMpLFxuICAgICAgICAgICAgICAgIG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkMsIDMpLFxuICAgICAgICAgICAgICAgIG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkcsIDMpLFxuICAgICAgICAgICAgICAgIG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkQsIDMpLFxuICAgICAgICAgICAgICAgIG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkEsIDQpLFxuICAgICAgICAgICAgICAgIG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkUsIDMpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG51bV9mbGF0cyA+IDApIHtcbiAgICAgICAgICAgIHRyZWJsZW5vdGVzID0gbmV3IFdoaXRlTm90ZVtdIHtcbiAgICAgICAgICAgICAgICBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5CLCA1KSxcbiAgICAgICAgICAgICAgICBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5FLCA1KSxcbiAgICAgICAgICAgICAgICBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5BLCA1KSxcbiAgICAgICAgICAgICAgICBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5ELCA1KSxcbiAgICAgICAgICAgICAgICBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5HLCA0KSxcbiAgICAgICAgICAgICAgICBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5DLCA1KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGJhc3Nub3RlcyA9IG5ldyBXaGl0ZU5vdGVbXSB7XG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuQiwgMyksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRSwgMyksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuQSwgMyksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRCwgMyksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRywgMiksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuQywgMylcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBBY2NpZCBhID0gQWNjaWQuTm9uZTtcbiAgICAgICAgaWYgKG51bV9zaGFycHMgPiAwKVxuICAgICAgICAgICAgYSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBhID0gQWNjaWQuRmxhdDtcblxuICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHRyZWJsZVtpXSA9IG5ldyBBY2NpZFN5bWJvbChhLCB0cmVibGVub3Rlc1tpXSwgQ2xlZi5UcmVibGUpO1xuICAgICAgICAgICAgYmFzc1tpXSA9IG5ldyBBY2NpZFN5bWJvbChhLCBiYXNzbm90ZXNbaV0sIENsZWYuQmFzcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHRoZSBBY2NpZGVudGFsIHN5bWJvbHMgZm9yIGRpc3BsYXlpbmcgdGhpcyBrZXkgc2lnbmF0dXJlXG4gICAgICogZm9yIHRoZSBnaXZlbiBjbGVmLlxuICAgICAqL1xuICAgIHB1YmxpYyBBY2NpZFN5bWJvbFtdIEdldFN5bWJvbHMoQ2xlZiBjbGVmKSB7XG4gICAgICAgIGlmIChjbGVmID09IENsZWYuVHJlYmxlKVxuICAgICAgICAgICAgcmV0dXJuIHRyZWJsZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGJhc3M7XG4gICAgfVxuXG4gICAgLyoqIEdpdmVuIGEgbWlkaSBub3RlIG51bWJlciwgcmV0dXJuIHRoZSBhY2NpZGVudGFsIChpZiBhbnkpIFxuICAgICAqIHRoYXQgc2hvdWxkIGJlIHVzZWQgd2hlbiBkaXNwbGF5aW5nIHRoZSBub3RlIGluIHRoaXMga2V5IHNpZ25hdHVyZS5cbiAgICAgKlxuICAgICAqIFRoZSBjdXJyZW50IG1lYXN1cmUgaXMgYWxzbyByZXF1aXJlZC4gIE9uY2Ugd2UgcmV0dXJuIGFuXG4gICAgICogYWNjaWRlbnRhbCBmb3IgYSBtZWFzdXJlLCB0aGUgYWNjaWRlbnRhbCByZW1haW5zIGZvciB0aGVcbiAgICAgKiByZXN0IG9mIHRoZSBtZWFzdXJlLiBTbyB3ZSBtdXN0IHVwZGF0ZSB0aGUgY3VycmVudCBrZXltYXBcbiAgICAgKiB3aXRoIGFueSBuZXcgYWNjaWRlbnRhbHMgdGhhdCB3ZSByZXR1cm4uICBXaGVuIHdlIG1vdmUgdG8gYW5vdGhlclxuICAgICAqIG1lYXN1cmUsIHdlIHJlc2V0IHRoZSBrZXltYXAgYmFjayB0byB0aGUga2V5IHNpZ25hdHVyZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgQWNjaWQgR2V0QWNjaWRlbnRhbChpbnQgbm90ZW51bWJlciwgaW50IG1lYXN1cmUpIHtcbiAgICAgICAgaWYgKG1lYXN1cmUgIT0gcHJldm1lYXN1cmUpIHtcbiAgICAgICAgICAgIFJlc2V0S2V5TWFwKCk7XG4gICAgICAgICAgICBwcmV2bWVhc3VyZSA9IG1lYXN1cmU7XG4gICAgICAgIH1cblxuICAgICAgICBBY2NpZCByZXN1bHQgPSBrZXltYXBbbm90ZW51bWJlcl07XG4gICAgICAgIGlmIChyZXN1bHQgPT0gQWNjaWQuU2hhcnApIHtcbiAgICAgICAgICAgIGtleW1hcFtub3RlbnVtYmVyXSA9IEFjY2lkLk5vbmU7XG4gICAgICAgICAgICBrZXltYXBbbm90ZW51bWJlci0xXSA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocmVzdWx0ID09IEFjY2lkLkZsYXQpIHtcbiAgICAgICAgICAgIGtleW1hcFtub3RlbnVtYmVyXSA9IEFjY2lkLk5vbmU7XG4gICAgICAgICAgICBrZXltYXBbbm90ZW51bWJlcisxXSA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocmVzdWx0ID09IEFjY2lkLk5hdHVyYWwpIHtcbiAgICAgICAgICAgIGtleW1hcFtub3RlbnVtYmVyXSA9IEFjY2lkLk5vbmU7XG4gICAgICAgICAgICBpbnQgbmV4dGtleSA9IE5vdGVTY2FsZS5Gcm9tTnVtYmVyKG5vdGVudW1iZXIrMSk7XG4gICAgICAgICAgICBpbnQgcHJldmtleSA9IE5vdGVTY2FsZS5Gcm9tTnVtYmVyKG5vdGVudW1iZXItMSk7XG5cbiAgICAgICAgICAgIC8qIElmIHdlIGluc2VydCBhIG5hdHVyYWwsIHRoZW4gZWl0aGVyOlxuICAgICAgICAgICAgICogLSB0aGUgbmV4dCBrZXkgbXVzdCBnbyBiYWNrIHRvIHNoYXJwLFxuICAgICAgICAgICAgICogLSB0aGUgcHJldmlvdXMga2V5IG11c3QgZ28gYmFjayB0byBmbGF0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZiAoa2V5bWFwW25vdGVudW1iZXItMV0gPT0gQWNjaWQuTm9uZSAmJiBrZXltYXBbbm90ZW51bWJlcisxXSA9PSBBY2NpZC5Ob25lICYmXG4gICAgICAgICAgICAgICAgTm90ZVNjYWxlLklzQmxhY2tLZXkobmV4dGtleSkgJiYgTm90ZVNjYWxlLklzQmxhY2tLZXkocHJldmtleSkgKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAobnVtX2ZsYXRzID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAga2V5bWFwW25vdGVudW1iZXIrMV0gPSBBY2NpZC5TaGFycDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGtleW1hcFtub3RlbnVtYmVyLTFdID0gQWNjaWQuRmxhdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXltYXBbbm90ZW51bWJlci0xXSA9PSBBY2NpZC5Ob25lICYmIE5vdGVTY2FsZS5Jc0JsYWNrS2V5KHByZXZrZXkpKSB7XG4gICAgICAgICAgICAgICAga2V5bWFwW25vdGVudW1iZXItMV0gPSBBY2NpZC5GbGF0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5bWFwW25vdGVudW1iZXIrMV0gPT0gQWNjaWQuTm9uZSAmJiBOb3RlU2NhbGUuSXNCbGFja0tleShuZXh0a2V5KSkge1xuICAgICAgICAgICAgICAgIGtleW1hcFtub3RlbnVtYmVyKzFdID0gQWNjaWQuU2hhcnA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvKiBTaG91bGRuJ3QgZ2V0IGhlcmUgKi9cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuXG4gICAgLyoqIEdpdmVuIGEgbWlkaSBub3RlIG51bWJlciwgcmV0dXJuIHRoZSB3aGl0ZSBub3RlICh0aGVcbiAgICAgKiBub24tc2hhcnAvbm9uLWZsYXQgbm90ZSkgdGhhdCBzaG91bGQgYmUgdXNlZCB3aGVuIGRpc3BsYXlpbmdcbiAgICAgKiB0aGlzIG5vdGUgaW4gdGhpcyBrZXkgc2lnbmF0dXJlLiAgVGhpcyBzaG91bGQgYmUgY2FsbGVkXG4gICAgICogYmVmb3JlIGNhbGxpbmcgR2V0QWNjaWRlbnRhbCgpLlxuICAgICAqL1xuICAgIHB1YmxpYyBXaGl0ZU5vdGUgR2V0V2hpdGVOb3RlKGludCBub3RlbnVtYmVyKSB7XG4gICAgICAgIGludCBub3Rlc2NhbGUgPSBOb3RlU2NhbGUuRnJvbU51bWJlcihub3RlbnVtYmVyKTtcbiAgICAgICAgaW50IG9jdGF2ZSA9IChub3RlbnVtYmVyICsgMykgLyAxMiAtIDE7XG4gICAgICAgIGludCBsZXR0ZXIgPSAwO1xuXG4gICAgICAgIGludFtdIHdob2xlX3NoYXJwcyA9IHsgXG4gICAgICAgICAgICBXaGl0ZU5vdGUuQSwgV2hpdGVOb3RlLkEsIFxuICAgICAgICAgICAgV2hpdGVOb3RlLkIsIFxuICAgICAgICAgICAgV2hpdGVOb3RlLkMsIFdoaXRlTm90ZS5DLFxuICAgICAgICAgICAgV2hpdGVOb3RlLkQsIFdoaXRlTm90ZS5ELFxuICAgICAgICAgICAgV2hpdGVOb3RlLkUsXG4gICAgICAgICAgICBXaGl0ZU5vdGUuRiwgV2hpdGVOb3RlLkYsXG4gICAgICAgICAgICBXaGl0ZU5vdGUuRywgV2hpdGVOb3RlLkdcbiAgICAgICAgfTtcblxuICAgICAgICBpbnRbXSB3aG9sZV9mbGF0cyA9IHtcbiAgICAgICAgICAgIFdoaXRlTm90ZS5BLCBcbiAgICAgICAgICAgIFdoaXRlTm90ZS5CLCBXaGl0ZU5vdGUuQixcbiAgICAgICAgICAgIFdoaXRlTm90ZS5DLFxuICAgICAgICAgICAgV2hpdGVOb3RlLkQsIFdoaXRlTm90ZS5ELFxuICAgICAgICAgICAgV2hpdGVOb3RlLkUsIFdoaXRlTm90ZS5FLFxuICAgICAgICAgICAgV2hpdGVOb3RlLkYsXG4gICAgICAgICAgICBXaGl0ZU5vdGUuRywgV2hpdGVOb3RlLkcsXG4gICAgICAgICAgICBXaGl0ZU5vdGUuQVxuICAgICAgICB9O1xuXG4gICAgICAgIEFjY2lkIGFjY2lkID0ga2V5bWFwW25vdGVudW1iZXJdO1xuICAgICAgICBpZiAoYWNjaWQgPT0gQWNjaWQuRmxhdCkge1xuICAgICAgICAgICAgbGV0dGVyID0gd2hvbGVfZmxhdHNbbm90ZXNjYWxlXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChhY2NpZCA9PSBBY2NpZC5TaGFycCkge1xuICAgICAgICAgICAgbGV0dGVyID0gd2hvbGVfc2hhcnBzW25vdGVzY2FsZV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYWNjaWQgPT0gQWNjaWQuTmF0dXJhbCkge1xuICAgICAgICAgICAgbGV0dGVyID0gd2hvbGVfc2hhcnBzW25vdGVzY2FsZV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYWNjaWQgPT0gQWNjaWQuTm9uZSkge1xuICAgICAgICAgICAgbGV0dGVyID0gd2hvbGVfc2hhcnBzW25vdGVzY2FsZV07XG5cbiAgICAgICAgICAgIC8qIElmIHRoZSBub3RlIG51bWJlciBpcyBhIHNoYXJwL2ZsYXQsIGFuZCB0aGVyZSdzIG5vIGFjY2lkZW50YWwsXG4gICAgICAgICAgICAgKiBkZXRlcm1pbmUgdGhlIHdoaXRlIG5vdGUgYnkgc2VlaW5nIHdoZXRoZXIgdGhlIHByZXZpb3VzIG9yIG5leHQgbm90ZVxuICAgICAgICAgICAgICogaXMgYSBuYXR1cmFsLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZiAoTm90ZVNjYWxlLklzQmxhY2tLZXkobm90ZXNjYWxlKSkge1xuICAgICAgICAgICAgICAgIGlmIChrZXltYXBbbm90ZW51bWJlci0xXSA9PSBBY2NpZC5OYXR1cmFsICYmIFxuICAgICAgICAgICAgICAgICAgICBrZXltYXBbbm90ZW51bWJlcisxXSA9PSBBY2NpZC5OYXR1cmFsKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG51bV9mbGF0cyA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldHRlciA9IHdob2xlX2ZsYXRzW25vdGVzY2FsZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXR0ZXIgPSB3aG9sZV9zaGFycHNbbm90ZXNjYWxlXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrZXltYXBbbm90ZW51bWJlci0xXSA9PSBBY2NpZC5OYXR1cmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldHRlciA9IHdob2xlX3NoYXJwc1tub3Rlc2NhbGVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrZXltYXBbbm90ZW51bWJlcisxXSA9PSBBY2NpZC5OYXR1cmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldHRlciA9IHdob2xlX2ZsYXRzW25vdGVzY2FsZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyogVGhlIGFib3ZlIGFsZ29yaXRobSBkb2Vzbid0IHF1aXRlIHdvcmsgZm9yIEctZmxhdCBtYWpvci5cbiAgICAgICAgICogSGFuZGxlIGl0IGhlcmUuXG4gICAgICAgICAqL1xuICAgICAgICBpZiAobnVtX2ZsYXRzID09IEdmbGF0ICYmIG5vdGVzY2FsZSA9PSBOb3RlU2NhbGUuQikge1xuICAgICAgICAgICAgbGV0dGVyID0gV2hpdGVOb3RlLkM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG51bV9mbGF0cyA9PSBHZmxhdCAmJiBub3Rlc2NhbGUgPT0gTm90ZVNjYWxlLkJmbGF0KSB7XG4gICAgICAgICAgICBsZXR0ZXIgPSBXaGl0ZU5vdGUuQjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChudW1fZmxhdHMgPiAwICYmIG5vdGVzY2FsZSA9PSBOb3RlU2NhbGUuQWZsYXQpIHtcbiAgICAgICAgICAgIG9jdGF2ZSsrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBXaGl0ZU5vdGUobGV0dGVyLCBvY3RhdmUpO1xuICAgIH1cblxuXG4gICAgLyoqIEd1ZXNzIHRoZSBrZXkgc2lnbmF0dXJlLCBnaXZlbiB0aGUgbWlkaSBub3RlIG51bWJlcnMgdXNlZCBpblxuICAgICAqIHRoZSBzb25nLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgS2V5U2lnbmF0dXJlIEd1ZXNzKExpc3Q8aW50PiBub3Rlcykge1xuICAgICAgICBDcmVhdGVBY2NpZGVudGFsTWFwcygpO1xuXG4gICAgICAgIC8qIEdldCB0aGUgZnJlcXVlbmN5IGNvdW50IG9mIGVhY2ggbm90ZSBpbiB0aGUgMTItbm90ZSBzY2FsZSAqL1xuICAgICAgICBpbnRbXSBub3RlY291bnQgPSBuZXcgaW50WzEyXTtcbiAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCBub3Rlcy5Db3VudDsgaSsrKSB7XG4gICAgICAgICAgICBpbnQgbm90ZW51bWJlciA9IG5vdGVzW2ldO1xuICAgICAgICAgICAgaW50IG5vdGVzY2FsZSA9IChub3RlbnVtYmVyICsgMykgJSAxMjtcbiAgICAgICAgICAgIG5vdGVjb3VudFtub3Rlc2NhbGVdICs9IDE7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBGb3IgZWFjaCBrZXkgc2lnbmF0dXJlLCBjb3VudCB0aGUgdG90YWwgbnVtYmVyIG9mIGFjY2lkZW50YWxzXG4gICAgICAgICAqIG5lZWRlZCB0byBkaXNwbGF5IGFsbCB0aGUgbm90ZXMuICBDaG9vc2UgdGhlIGtleSBzaWduYXR1cmVcbiAgICAgICAgICogd2l0aCB0aGUgZmV3ZXN0IGFjY2lkZW50YWxzLlxuICAgICAgICAgKi9cbiAgICAgICAgaW50IGJlc3RrZXkgPSAwO1xuICAgICAgICBib29sIGlzX2Jlc3Rfc2hhcnAgPSB0cnVlO1xuICAgICAgICBpbnQgc21hbGxlc3RfYWNjaWRfY291bnQgPSBub3Rlcy5Db3VudDtcbiAgICAgICAgaW50IGtleTtcblxuICAgICAgICBmb3IgKGtleSA9IDA7IGtleSA8IDY7IGtleSsrKSB7XG4gICAgICAgICAgICBpbnQgYWNjaWRfY291bnQgPSAwO1xuICAgICAgICAgICAgZm9yIChpbnQgbiA9IDA7IG4gPCAxMjsgbisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNoYXJwa2V5c1trZXldW25dICE9IEFjY2lkLk5vbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjaWRfY291bnQgKz0gbm90ZWNvdW50W25dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhY2NpZF9jb3VudCA8IHNtYWxsZXN0X2FjY2lkX2NvdW50KSB7XG4gICAgICAgICAgICAgICAgc21hbGxlc3RfYWNjaWRfY291bnQgPSBhY2NpZF9jb3VudDtcbiAgICAgICAgICAgICAgICBiZXN0a2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIGlzX2Jlc3Rfc2hhcnAgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChrZXkgPSAwOyBrZXkgPCA3OyBrZXkrKykge1xuICAgICAgICAgICAgaW50IGFjY2lkX2NvdW50ID0gMDtcbiAgICAgICAgICAgIGZvciAoaW50IG4gPSAwOyBuIDwgMTI7IG4rKykge1xuICAgICAgICAgICAgICAgIGlmIChmbGF0a2V5c1trZXldW25dICE9IEFjY2lkLk5vbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjaWRfY291bnQgKz0gbm90ZWNvdW50W25dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhY2NpZF9jb3VudCA8IHNtYWxsZXN0X2FjY2lkX2NvdW50KSB7XG4gICAgICAgICAgICAgICAgc21hbGxlc3RfYWNjaWRfY291bnQgPSBhY2NpZF9jb3VudDtcbiAgICAgICAgICAgICAgICBiZXN0a2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIGlzX2Jlc3Rfc2hhcnAgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNfYmVzdF9zaGFycCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBLZXlTaWduYXR1cmUoYmVzdGtleSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEtleVNpZ25hdHVyZSgwLCBiZXN0a2V5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdHJ1ZSBpZiB0aGlzIGtleSBzaWduYXR1cmUgaXMgZXF1YWwgdG8ga2V5IHNpZ25hdHVyZSBrICovXG4gICAgcHVibGljIGJvb2wgRXF1YWxzKEtleVNpZ25hdHVyZSBrKSB7XG4gICAgICAgIGlmIChrLm51bV9zaGFycHMgPT0gbnVtX3NoYXJwcyAmJiBrLm51bV9mbGF0cyA9PSBudW1fZmxhdHMpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qIFJldHVybiB0aGUgTWFqb3IgS2V5IG9mIHRoaXMgS2V5IFNpZ25hdHVyZSAqL1xuICAgIHB1YmxpYyBpbnQgTm90ZXNjYWxlKCkge1xuICAgICAgICBpbnRbXSBmbGF0bWFqb3IgPSB7XG4gICAgICAgICAgICBOb3RlU2NhbGUuQywgTm90ZVNjYWxlLkYsIE5vdGVTY2FsZS5CZmxhdCwgTm90ZVNjYWxlLkVmbGF0LFxuICAgICAgICAgICAgTm90ZVNjYWxlLkFmbGF0LCBOb3RlU2NhbGUuRGZsYXQsIE5vdGVTY2FsZS5HZmxhdCwgTm90ZVNjYWxlLkIgXG4gICAgICAgIH07XG5cbiAgICAgICAgaW50W10gc2hhcnBtYWpvciA9IHtcbiAgICAgICAgICAgIE5vdGVTY2FsZS5DLCBOb3RlU2NhbGUuRywgTm90ZVNjYWxlLkQsIE5vdGVTY2FsZS5BLCBOb3RlU2NhbGUuRSxcbiAgICAgICAgICAgIE5vdGVTY2FsZS5CLCBOb3RlU2NhbGUuRnNoYXJwLCBOb3RlU2NhbGUuQ3NoYXJwLCBOb3RlU2NhbGUuR3NoYXJwLFxuICAgICAgICAgICAgTm90ZVNjYWxlLkRzaGFycFxuICAgICAgICB9O1xuICAgICAgICBpZiAobnVtX2ZsYXRzID4gMClcbiAgICAgICAgICAgIHJldHVybiBmbGF0bWFqb3JbbnVtX2ZsYXRzXTtcbiAgICAgICAgZWxzZSBcbiAgICAgICAgICAgIHJldHVybiBzaGFycG1ham9yW251bV9zaGFycHNdO1xuICAgIH1cblxuICAgIC8qIENvbnZlcnQgYSBNYWpvciBLZXkgaW50byBhIHN0cmluZyAqL1xuICAgIHB1YmxpYyBzdGF0aWMgc3RyaW5nIEtleVRvU3RyaW5nKGludCBub3Rlc2NhbGUpIHtcbiAgICAgICAgc3dpdGNoIChub3Rlc2NhbGUpIHtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkE6ICAgICByZXR1cm4gXCJBIG1ham9yLCBGIyBtaW5vclwiIDtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkJmbGF0OiByZXR1cm4gXCJCLWZsYXQgbWFqb3IsIEcgbWlub3JcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkI6ICAgICByZXR1cm4gXCJCIG1ham9yLCBBLWZsYXQgbWlub3JcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkM6ICAgICByZXR1cm4gXCJDIG1ham9yLCBBIG1pbm9yXCI7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5EZmxhdDogcmV0dXJuIFwiRC1mbGF0IG1ham9yLCBCLWZsYXQgbWlub3JcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkQ6ICAgICByZXR1cm4gXCJEIG1ham9yLCBCIG1pbm9yXCI7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5FZmxhdDogcmV0dXJuIFwiRS1mbGF0IG1ham9yLCBDIG1pbm9yXCI7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5FOiAgICAgcmV0dXJuIFwiRSBtYWpvciwgQyMgbWlub3JcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkY6ICAgICByZXR1cm4gXCJGIG1ham9yLCBEIG1pbm9yXCI7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5HZmxhdDogcmV0dXJuIFwiRy1mbGF0IG1ham9yLCBFLWZsYXQgbWlub3JcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkc6ICAgICByZXR1cm4gXCJHIG1ham9yLCBFIG1pbm9yXCI7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5BZmxhdDogcmV0dXJuIFwiQS1mbGF0IG1ham9yLCBGIG1pbm9yXCI7XG4gICAgICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBrZXkgc2lnbmF0dXJlLlxuICAgICAqIFdlIG9ubHkgcmV0dXJuIHRoZSBtYWpvciBrZXkgc2lnbmF0dXJlLCBub3QgdGhlIG1pbm9yIG9uZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgc3RyaW5nIFRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gS2V5VG9TdHJpbmcoIE5vdGVzY2FsZSgpICk7XG4gICAgfVxuXG5cbn1cblxufVxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAwNy0yMDEyIE1hZGhhdiBWYWlkeWFuYXRoYW5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuXG51c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uSU87XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyB7XG5cbi8qKiBAY2xhc3MgTHlyaWNTeW1ib2xcbiAqICBBIGx5cmljIGNvbnRhaW5zIHRoZSBseXJpYyB0byBkaXNwbGF5LCB0aGUgc3RhcnQgdGltZSB0aGUgbHlyaWMgb2NjdXJzIGF0LFxuICogIHRoZSB0aGUgeC1jb29yZGluYXRlIHdoZXJlIGl0IHdpbGwgYmUgZGlzcGxheWVkLlxuICovXG5wdWJsaWMgY2xhc3MgTHlyaWNTeW1ib2wge1xuICAgIHByaXZhdGUgaW50IHN0YXJ0dGltZTsgICAvKiogVGhlIHN0YXJ0IHRpbWUsIGluIHB1bHNlcyAqL1xuICAgIHByaXZhdGUgc3RyaW5nIHRleHQ7ICAgICAvKiogVGhlIGx5cmljIHRleHQgKi9cbiAgICBwcml2YXRlIGludCB4OyAgICAgICAgICAgLyoqIFRoZSB4IChob3Jpem9udGFsKSBwb3NpdGlvbiB3aXRoaW4gdGhlIHN0YWZmICovXG5cbiAgICBwdWJsaWMgTHlyaWNTeW1ib2woaW50IHN0YXJ0dGltZSwgc3RyaW5nIHRleHQpIHtcbiAgICAgICAgdGhpcy5zdGFydHRpbWUgPSBzdGFydHRpbWU7IFxuICAgICAgICB0aGlzLnRleHQgPSB0ZXh0O1xuICAgIH1cbiAgICAgXG4gICAgcHVibGljIGludCBTdGFydFRpbWUge1xuICAgICAgICBnZXQgeyByZXR1cm4gc3RhcnR0aW1lOyB9XG4gICAgICAgIHNldCB7IHN0YXJ0dGltZSA9IHZhbHVlOyB9XG4gICAgfVxuXG4gICAgcHVibGljIHN0cmluZyBUZXh0IHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHRleHQ7IH1cbiAgICAgICAgc2V0IHsgdGV4dCA9IHZhbHVlOyB9XG4gICAgfVxuXG4gICAgcHVibGljIGludCBYIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHg7IH1cbiAgICAgICAgc2V0IHsgeCA9IHZhbHVlOyB9XG4gICAgfVxuXG4gICAgcHVibGljIGludCBNaW5XaWR0aCB7XG4gICAgICAgIGdldCB7IHJldHVybiBtaW5XaWR0aCgpOyB9XG4gICAgfVxuXG4gICAgLyogUmV0dXJuIHRoZSBtaW5pbXVtIHdpZHRoIGluIHBpeGVscyBuZWVkZWQgdG8gZGlzcGxheSB0aGlzIGx5cmljLlxuICAgICAqIFRoaXMgaXMgYW4gZXN0aW1hdGlvbiwgbm90IGV4YWN0LlxuICAgICAqL1xuICAgIHByaXZhdGUgaW50IG1pbldpZHRoKCkgeyBcbiAgICAgICAgZmxvYXQgd2lkdGhQZXJDaGFyID0gU2hlZXRNdXNpYy5MZXR0ZXJGb250LkdldEhlaWdodCgpICogMi4wZi8zLjBmO1xuICAgICAgICBmbG9hdCB3aWR0aCA9IHRleHQuTGVuZ3RoICogd2lkdGhQZXJDaGFyO1xuICAgICAgICBpZiAodGV4dC5JbmRleE9mKFwiaVwiKSA+PSAwKSB7XG4gICAgICAgICAgICB3aWR0aCAtPSB3aWR0aFBlckNoYXIvMi4wZjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGV4dC5JbmRleE9mKFwialwiKSA+PSAwKSB7XG4gICAgICAgICAgICB3aWR0aCAtPSB3aWR0aFBlckNoYXIvMi4wZjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGV4dC5JbmRleE9mKFwibFwiKSA+PSAwKSB7XG4gICAgICAgICAgICB3aWR0aCAtPSB3aWR0aFBlckNoYXIvMi4wZjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKGludCl3aWR0aDtcbiAgICB9XG5cbiAgICBwdWJsaWMgb3ZlcnJpZGUgXG4gICAgc3RyaW5nIFRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gc3RyaW5nLkZvcm1hdChcIkx5cmljIHN0YXJ0PXswfSB4PXsxfSB0ZXh0PXsyfVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydHRpbWUsIHgsIHRleHQpO1xuICAgIH1cblxufVxuXG5cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMiBNYWRoYXYgVmFpZHlhbmF0aGFuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cblxudXNpbmcgU3lzdGVtO1xudXNpbmcgU3lzdGVtLklPO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG51c2luZyBTeXN0ZW0uVGV4dDtcblxuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xuXG4vKiogQGNsYXNzIE1pZGlFdmVudFxuICogQSBNaWRpRXZlbnQgcmVwcmVzZW50cyBhIHNpbmdsZSBldmVudCAoc3VjaCBhcyBFdmVudE5vdGVPbikgaW4gdGhlXG4gKiBNaWRpIGZpbGUuIEl0IGluY2x1ZGVzIHRoZSBkZWx0YSB0aW1lIG9mIHRoZSBldmVudC5cbiAqL1xucHVibGljIGNsYXNzIE1pZGlFdmVudCA6IElDb21wYXJlcjxNaWRpRXZlbnQ+IHtcblxuICAgIHB1YmxpYyBpbnQgICAgRGVsdGFUaW1lOyAgICAgLyoqIFRoZSB0aW1lIGJldHdlZW4gdGhlIHByZXZpb3VzIGV2ZW50IGFuZCB0aGlzIG9uICovXG4gICAgcHVibGljIGludCAgICBTdGFydFRpbWU7ICAgICAvKiogVGhlIGFic29sdXRlIHRpbWUgdGhpcyBldmVudCBvY2N1cnMgKi9cbiAgICBwdWJsaWMgYm9vbCAgIEhhc0V2ZW50ZmxhZzsgIC8qKiBGYWxzZSBpZiB0aGlzIGlzIHVzaW5nIHRoZSBwcmV2aW91cyBldmVudGZsYWcgKi9cbiAgICBwdWJsaWMgYnl0ZSAgIEV2ZW50RmxhZzsgICAgIC8qKiBOb3RlT24sIE5vdGVPZmYsIGV0Yy4gIEZ1bGwgbGlzdCBpcyBpbiBjbGFzcyBNaWRpRmlsZSAqL1xuICAgIHB1YmxpYyBieXRlICAgQ2hhbm5lbDsgICAgICAgLyoqIFRoZSBjaGFubmVsIHRoaXMgZXZlbnQgb2NjdXJzIG9uICovIFxuXG4gICAgcHVibGljIGJ5dGUgICBOb3RlbnVtYmVyOyAgICAvKiogVGhlIG5vdGUgbnVtYmVyICAqL1xuICAgIHB1YmxpYyBieXRlICAgVmVsb2NpdHk7ICAgICAgLyoqIFRoZSB2b2x1bWUgb2YgdGhlIG5vdGUgKi9cbiAgICBwdWJsaWMgYnl0ZSAgIEluc3RydW1lbnQ7ICAgIC8qKiBUaGUgaW5zdHJ1bWVudCAqL1xuICAgIHB1YmxpYyBieXRlICAgS2V5UHJlc3N1cmU7ICAgLyoqIFRoZSBrZXkgcHJlc3N1cmUgKi9cbiAgICBwdWJsaWMgYnl0ZSAgIENoYW5QcmVzc3VyZTsgIC8qKiBUaGUgY2hhbm5lbCBwcmVzc3VyZSAqL1xuICAgIHB1YmxpYyBieXRlICAgQ29udHJvbE51bTsgICAgLyoqIFRoZSBjb250cm9sbGVyIG51bWJlciAqL1xuICAgIHB1YmxpYyBieXRlICAgQ29udHJvbFZhbHVlOyAgLyoqIFRoZSBjb250cm9sbGVyIHZhbHVlICovXG4gICAgcHVibGljIHVzaG9ydCBQaXRjaEJlbmQ7ICAgICAvKiogVGhlIHBpdGNoIGJlbmQgdmFsdWUgKi9cbiAgICBwdWJsaWMgYnl0ZSAgIE51bWVyYXRvcjsgICAgIC8qKiBUaGUgbnVtZXJhdG9yLCBmb3IgVGltZVNpZ25hdHVyZSBtZXRhIGV2ZW50cyAqL1xuICAgIHB1YmxpYyBieXRlICAgRGVub21pbmF0b3I7ICAgLyoqIFRoZSBkZW5vbWluYXRvciwgZm9yIFRpbWVTaWduYXR1cmUgbWV0YSBldmVudHMgKi9cbiAgICBwdWJsaWMgaW50ICAgIFRlbXBvOyAgICAgICAgIC8qKiBUaGUgdGVtcG8sIGZvciBUZW1wbyBtZXRhIGV2ZW50cyAqL1xuICAgIHB1YmxpYyBieXRlICAgTWV0YWV2ZW50OyAgICAgLyoqIFRoZSBtZXRhZXZlbnQsIHVzZWQgaWYgZXZlbnRmbGFnIGlzIE1ldGFFdmVudCAqL1xuICAgIHB1YmxpYyBpbnQgICAgTWV0YWxlbmd0aDsgICAgLyoqIFRoZSBtZXRhZXZlbnQgbGVuZ3RoICAqL1xuICAgIHB1YmxpYyBieXRlW10gVmFsdWU7ICAgICAgICAgLyoqIFRoZSByYXcgYnl0ZSB2YWx1ZSwgZm9yIFN5c2V4IGFuZCBtZXRhIGV2ZW50cyAqL1xuXG4gICAgcHVibGljIE1pZGlFdmVudCgpIHtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIGEgY29weSBvZiB0aGlzIGV2ZW50ICovXG4gICAgcHVibGljIE1pZGlFdmVudCBDbG9uZSgpIHtcbiAgICAgICAgTWlkaUV2ZW50IG1ldmVudD0gbmV3IE1pZGlFdmVudCgpO1xuICAgICAgICBtZXZlbnQuRGVsdGFUaW1lID0gRGVsdGFUaW1lO1xuICAgICAgICBtZXZlbnQuU3RhcnRUaW1lID0gU3RhcnRUaW1lO1xuICAgICAgICBtZXZlbnQuSGFzRXZlbnRmbGFnID0gSGFzRXZlbnRmbGFnO1xuICAgICAgICBtZXZlbnQuRXZlbnRGbGFnID0gRXZlbnRGbGFnO1xuICAgICAgICBtZXZlbnQuQ2hhbm5lbCA9IENoYW5uZWw7XG4gICAgICAgIG1ldmVudC5Ob3RlbnVtYmVyID0gTm90ZW51bWJlcjtcbiAgICAgICAgbWV2ZW50LlZlbG9jaXR5ID0gVmVsb2NpdHk7XG4gICAgICAgIG1ldmVudC5JbnN0cnVtZW50ID0gSW5zdHJ1bWVudDtcbiAgICAgICAgbWV2ZW50LktleVByZXNzdXJlID0gS2V5UHJlc3N1cmU7XG4gICAgICAgIG1ldmVudC5DaGFuUHJlc3N1cmUgPSBDaGFuUHJlc3N1cmU7XG4gICAgICAgIG1ldmVudC5Db250cm9sTnVtID0gQ29udHJvbE51bTtcbiAgICAgICAgbWV2ZW50LkNvbnRyb2xWYWx1ZSA9IENvbnRyb2xWYWx1ZTtcbiAgICAgICAgbWV2ZW50LlBpdGNoQmVuZCA9IFBpdGNoQmVuZDtcbiAgICAgICAgbWV2ZW50Lk51bWVyYXRvciA9IE51bWVyYXRvcjtcbiAgICAgICAgbWV2ZW50LkRlbm9taW5hdG9yID0gRGVub21pbmF0b3I7XG4gICAgICAgIG1ldmVudC5UZW1wbyA9IFRlbXBvO1xuICAgICAgICBtZXZlbnQuTWV0YWV2ZW50ID0gTWV0YWV2ZW50O1xuICAgICAgICBtZXZlbnQuTWV0YWxlbmd0aCA9IE1ldGFsZW5ndGg7XG4gICAgICAgIG1ldmVudC5WYWx1ZSA9IFZhbHVlO1xuICAgICAgICByZXR1cm4gbWV2ZW50O1xuICAgIH1cblxuICAgIC8qKiBDb21wYXJlIHR3byBNaWRpRXZlbnRzIGJhc2VkIG9uIHRoZWlyIHN0YXJ0IHRpbWVzLiAqL1xuICAgIHB1YmxpYyBpbnQgQ29tcGFyZShNaWRpRXZlbnQgeCwgTWlkaUV2ZW50IHkpIHtcbiAgICAgICAgaWYgKHguU3RhcnRUaW1lID09IHkuU3RhcnRUaW1lKSB7XG4gICAgICAgICAgICBpZiAoeC5FdmVudEZsYWcgPT0geS5FdmVudEZsYWcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geC5Ob3RlbnVtYmVyIC0geS5Ob3RlbnVtYmVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHguRXZlbnRGbGFnIC0geS5FdmVudEZsYWc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4geC5TdGFydFRpbWUgLSB5LlN0YXJ0VGltZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxufSAgLyogRW5kIG5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyAqL1xuXG4iLCIvKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMiBNYWRoYXYgVmFpZHlhbmF0aGFuXHJcbiAqXHJcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXHJcbiAqXHJcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG4gKi9cclxuXHJcbnVzaW5nIFN5c3RlbTtcclxudXNpbmcgU3lzdGVtLklPO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcblxyXG5cclxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljXHJcbntcclxuXHJcbiAgICAvKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNsYXNzZXMgZm9yIHBhcnNpbmcgYW5kIG1vZGlmeWluZ1xyXG4gICAgICogTUlESSBtdXNpYyBmaWxlcy5cclxuICAgICAqL1xyXG5cclxuICAgIC8qIE1JREkgZmlsZSBmb3JtYXQuXHJcbiAgICAgKlxyXG4gICAgICogVGhlIE1pZGkgRmlsZSBmb3JtYXQgaXMgZGVzY3JpYmVkIGJlbG93LiAgVGhlIGRlc2NyaXB0aW9uIHVzZXNcclxuICAgICAqIHRoZSBmb2xsb3dpbmcgYWJicmV2aWF0aW9ucy5cclxuICAgICAqXHJcbiAgICAgKiB1MSAgICAgLSBPbmUgYnl0ZVxyXG4gICAgICogdTIgICAgIC0gVHdvIGJ5dGVzIChiaWcgZW5kaWFuKVxyXG4gICAgICogdTQgICAgIC0gRm91ciBieXRlcyAoYmlnIGVuZGlhbilcclxuICAgICAqIHZhcmxlbiAtIEEgdmFyaWFibGUgbGVuZ3RoIGludGVnZXIsIHRoYXQgY2FuIGJlIDEgdG8gNCBieXRlcy4gVGhlIFxyXG4gICAgICogICAgICAgICAgaW50ZWdlciBlbmRzIHdoZW4geW91IGVuY291bnRlciBhIGJ5dGUgdGhhdCBkb2Vzbid0IGhhdmUgXHJcbiAgICAgKiAgICAgICAgICB0aGUgOHRoIGJpdCBzZXQgKGEgYnl0ZSBsZXNzIHRoYW4gMHg4MCkuXHJcbiAgICAgKiBsZW4/ICAgLSBUaGUgbGVuZ3RoIG9mIHRoZSBkYXRhIGRlcGVuZHMgb24gc29tZSBjb2RlXHJcbiAgICAgKiAgICAgICAgICBcclxuICAgICAqXHJcbiAgICAgKiBUaGUgTWlkaSBmaWxlcyBiZWdpbnMgd2l0aCB0aGUgbWFpbiBNaWRpIGhlYWRlclxyXG4gICAgICogdTQgPSBUaGUgZm91ciBhc2NpaSBjaGFyYWN0ZXJzICdNVGhkJ1xyXG4gICAgICogdTQgPSBUaGUgbGVuZ3RoIG9mIHRoZSBNVGhkIGhlYWRlciA9IDYgYnl0ZXNcclxuICAgICAqIHUyID0gMCBpZiB0aGUgZmlsZSBjb250YWlucyBhIHNpbmdsZSB0cmFja1xyXG4gICAgICogICAgICAxIGlmIHRoZSBmaWxlIGNvbnRhaW5zIG9uZSBvciBtb3JlIHNpbXVsdGFuZW91cyB0cmFja3NcclxuICAgICAqICAgICAgMiBpZiB0aGUgZmlsZSBjb250YWlucyBvbmUgb3IgbW9yZSBpbmRlcGVuZGVudCB0cmFja3NcclxuICAgICAqIHUyID0gbnVtYmVyIG9mIHRyYWNrc1xyXG4gICAgICogdTIgPSBpZiA+ICAwLCB0aGUgbnVtYmVyIG9mIHB1bHNlcyBwZXIgcXVhcnRlciBub3RlXHJcbiAgICAgKiAgICAgIGlmIDw9IDAsIHRoZW4gPz8/XHJcbiAgICAgKlxyXG4gICAgICogTmV4dCBjb21lIHRoZSBpbmRpdmlkdWFsIE1pZGkgdHJhY2tzLiAgVGhlIHRvdGFsIG51bWJlciBvZiBNaWRpXHJcbiAgICAgKiB0cmFja3Mgd2FzIGdpdmVuIGFib3ZlLCBpbiB0aGUgTVRoZCBoZWFkZXIuICBFYWNoIHRyYWNrIHN0YXJ0c1xyXG4gICAgICogd2l0aCBhIGhlYWRlcjpcclxuICAgICAqXHJcbiAgICAgKiB1NCA9IFRoZSBmb3VyIGFzY2lpIGNoYXJhY3RlcnMgJ01UcmsnXHJcbiAgICAgKiB1NCA9IEFtb3VudCBvZiB0cmFjayBkYXRhLCBpbiBieXRlcy5cclxuICAgICAqIFxyXG4gICAgICogVGhlIHRyYWNrIGRhdGEgY29uc2lzdHMgb2YgYSBzZXJpZXMgb2YgTWlkaSBldmVudHMuICBFYWNoIE1pZGkgZXZlbnRcclxuICAgICAqIGhhcyB0aGUgZm9sbG93aW5nIGZvcm1hdDpcclxuICAgICAqXHJcbiAgICAgKiB2YXJsZW4gIC0gVGhlIHRpbWUgYmV0d2VlbiB0aGUgcHJldmlvdXMgZXZlbnQgYW5kIHRoaXMgZXZlbnQsIG1lYXN1cmVkXHJcbiAgICAgKiAgICAgICAgICAgaW4gXCJwdWxzZXNcIi4gIFRoZSBudW1iZXIgb2YgcHVsc2VzIHBlciBxdWFydGVyIG5vdGUgaXMgZ2l2ZW5cclxuICAgICAqICAgICAgICAgICBpbiB0aGUgTVRoZCBoZWFkZXIuXHJcbiAgICAgKiB1MSAgICAgIC0gVGhlIEV2ZW50IGNvZGUsIGFsd2F5cyBiZXR3ZWUgMHg4MCBhbmQgMHhGRlxyXG4gICAgICogbGVuPyAgICAtIFRoZSBldmVudCBkYXRhLiAgVGhlIGxlbmd0aCBvZiB0aGlzIGRhdGEgaXMgZGV0ZXJtaW5lZCBieSB0aGVcclxuICAgICAqICAgICAgICAgICBldmVudCBjb2RlLiAgVGhlIGZpcnN0IGJ5dGUgb2YgdGhlIGV2ZW50IGRhdGEgaXMgYWx3YXlzIDwgMHg4MC5cclxuICAgICAqXHJcbiAgICAgKiBUaGUgZXZlbnQgY29kZSBpcyBvcHRpb25hbC4gIElmIHRoZSBldmVudCBjb2RlIGlzIG1pc3NpbmcsIHRoZW4gaXRcclxuICAgICAqIGRlZmF1bHRzIHRvIHRoZSBwcmV2aW91cyBldmVudCBjb2RlLiAgRm9yIGV4YW1wbGU6XHJcbiAgICAgKlxyXG4gICAgICogICB2YXJsZW4sIGV2ZW50Y29kZTEsIGV2ZW50ZGF0YSxcclxuICAgICAqICAgdmFybGVuLCBldmVudGNvZGUyLCBldmVudGRhdGEsXHJcbiAgICAgKiAgIHZhcmxlbiwgZXZlbnRkYXRhLCAgLy8gZXZlbnRjb2RlIGlzIGV2ZW50Y29kZTJcclxuICAgICAqICAgdmFybGVuLCBldmVudGRhdGEsICAvLyBldmVudGNvZGUgaXMgZXZlbnRjb2RlMlxyXG4gICAgICogICB2YXJsZW4sIGV2ZW50Y29kZTMsIGV2ZW50ZGF0YSxcclxuICAgICAqICAgLi4uLlxyXG4gICAgICpcclxuICAgICAqICAgSG93IGRvIHlvdSBrbm93IGlmIHRoZSBldmVudGNvZGUgaXMgdGhlcmUgb3IgbWlzc2luZz8gV2VsbDpcclxuICAgICAqICAgLSBBbGwgZXZlbnQgY29kZXMgYXJlIGJldHdlZW4gMHg4MCBhbmQgMHhGRlxyXG4gICAgICogICAtIFRoZSBmaXJzdCBieXRlIG9mIGV2ZW50ZGF0YSBpcyBhbHdheXMgbGVzcyB0aGFuIDB4ODAuXHJcbiAgICAgKiAgIFNvLCBhZnRlciB0aGUgdmFybGVuIGRlbHRhIHRpbWUsIGlmIHRoZSBuZXh0IGJ5dGUgaXMgYmV0d2VlbiAweDgwXHJcbiAgICAgKiAgIGFuZCAweEZGLCBpdHMgYW4gZXZlbnQgY29kZS4gIE90aGVyd2lzZSwgaXRzIGV2ZW50IGRhdGEuXHJcbiAgICAgKlxyXG4gICAgICogVGhlIEV2ZW50IGNvZGVzIGFuZCBldmVudCBkYXRhIGZvciBlYWNoIGV2ZW50IGNvZGUgYXJlIHNob3duIGJlbG93LlxyXG4gICAgICpcclxuICAgICAqIENvZGU6ICB1MSAtIDB4ODAgdGhydSAweDhGIC0gTm90ZSBPZmYgZXZlbnQuXHJcbiAgICAgKiAgICAgICAgICAgICAweDgwIGlzIGZvciBjaGFubmVsIDEsIDB4OEYgaXMgZm9yIGNoYW5uZWwgMTYuXHJcbiAgICAgKiBEYXRhOiAgdTEgLSBUaGUgbm90ZSBudW1iZXIsIDAtMTI3LiAgTWlkZGxlIEMgaXMgNjAgKDB4M0MpXHJcbiAgICAgKiAgICAgICAgdTEgLSBUaGUgbm90ZSB2ZWxvY2l0eS4gIFRoaXMgc2hvdWxkIGJlIDBcclxuICAgICAqIFxyXG4gICAgICogQ29kZTogIHUxIC0gMHg5MCB0aHJ1IDB4OUYgLSBOb3RlIE9uIGV2ZW50LlxyXG4gICAgICogICAgICAgICAgICAgMHg5MCBpcyBmb3IgY2hhbm5lbCAxLCAweDlGIGlzIGZvciBjaGFubmVsIDE2LlxyXG4gICAgICogRGF0YTogIHUxIC0gVGhlIG5vdGUgbnVtYmVyLCAwLTEyNy4gIE1pZGRsZSBDIGlzIDYwICgweDNDKVxyXG4gICAgICogICAgICAgIHUxIC0gVGhlIG5vdGUgdmVsb2NpdHksIGZyb20gMCAobm8gc291bmQpIHRvIDEyNyAobG91ZCkuXHJcbiAgICAgKiAgICAgICAgICAgICBBIHZhbHVlIG9mIDAgaXMgZXF1aXZhbGVudCB0byBhIE5vdGUgT2ZmLlxyXG4gICAgICpcclxuICAgICAqIENvZGU6ICB1MSAtIDB4QTAgdGhydSAweEFGIC0gS2V5IFByZXNzdXJlXHJcbiAgICAgKiBEYXRhOiAgdTEgLSBUaGUgbm90ZSBudW1iZXIsIDAtMTI3LlxyXG4gICAgICogICAgICAgIHUxIC0gVGhlIHByZXNzdXJlLlxyXG4gICAgICpcclxuICAgICAqIENvZGU6ICB1MSAtIDB4QjAgdGhydSAweEJGIC0gQ29udHJvbCBDaGFuZ2VcclxuICAgICAqIERhdGE6ICB1MSAtIFRoZSBjb250cm9sbGVyIG51bWJlclxyXG4gICAgICogICAgICAgIHUxIC0gVGhlIHZhbHVlXHJcbiAgICAgKlxyXG4gICAgICogQ29kZTogIHUxIC0gMHhDMCB0aHJ1IDB4Q0YgLSBQcm9ncmFtIENoYW5nZVxyXG4gICAgICogRGF0YTogIHUxIC0gVGhlIHByb2dyYW0gbnVtYmVyLlxyXG4gICAgICpcclxuICAgICAqIENvZGU6ICB1MSAtIDB4RDAgdGhydSAweERGIC0gQ2hhbm5lbCBQcmVzc3VyZVxyXG4gICAgICogICAgICAgIHUxIC0gVGhlIHByZXNzdXJlLlxyXG4gICAgICpcclxuICAgICAqIENvZGU6ICB1MSAtIDB4RTAgdGhydSAweEVGIC0gUGl0Y2ggQmVuZFxyXG4gICAgICogRGF0YTogIHUyIC0gU29tZSBkYXRhXHJcbiAgICAgKlxyXG4gICAgICogQ29kZTogIHUxICAgICAtIDB4RkYgLSBNZXRhIEV2ZW50XHJcbiAgICAgKiBEYXRhOiAgdTEgICAgIC0gTWV0YWNvZGVcclxuICAgICAqICAgICAgICB2YXJsZW4gLSBMZW5ndGggb2YgbWV0YSBldmVudFxyXG4gICAgICogICAgICAgIHUxW3Zhcmxlbl0gLSBNZXRhIGV2ZW50IGRhdGEuXHJcbiAgICAgKlxyXG4gICAgICpcclxuICAgICAqIFRoZSBNZXRhIEV2ZW50IGNvZGVzIGFyZSBsaXN0ZWQgYmVsb3c6XHJcbiAgICAgKlxyXG4gICAgICogTWV0YWNvZGU6IHUxICAgICAgICAgLSAweDAgIFNlcXVlbmNlIE51bWJlclxyXG4gICAgICogICAgICAgICAgIHZhcmxlbiAgICAgLSAwIG9yIDJcclxuICAgICAqICAgICAgICAgICB1MVt2YXJsZW5dIC0gU2VxdWVuY2UgbnVtYmVyXHJcbiAgICAgKlxyXG4gICAgICogTWV0YWNvZGU6IHUxICAgICAgICAgLSAweDEgIFRleHRcclxuICAgICAqICAgICAgICAgICB2YXJsZW4gICAgIC0gTGVuZ3RoIG9mIHRleHRcclxuICAgICAqICAgICAgICAgICB1MVt2YXJsZW5dIC0gVGV4dFxyXG4gICAgICpcclxuICAgICAqIE1ldGFjb2RlOiB1MSAgICAgICAgIC0gMHgyICBDb3B5cmlnaHRcclxuICAgICAqICAgICAgICAgICB2YXJsZW4gICAgIC0gTGVuZ3RoIG9mIHRleHRcclxuICAgICAqICAgICAgICAgICB1MVt2YXJsZW5dIC0gVGV4dFxyXG4gICAgICpcclxuICAgICAqIE1ldGFjb2RlOiB1MSAgICAgICAgIC0gMHgzICBUcmFjayBOYW1lXHJcbiAgICAgKiAgICAgICAgICAgdmFybGVuICAgICAtIExlbmd0aCBvZiBuYW1lXHJcbiAgICAgKiAgICAgICAgICAgdTFbdmFybGVuXSAtIFRyYWNrIE5hbWVcclxuICAgICAqXHJcbiAgICAgKiBNZXRhY29kZTogdTEgICAgICAgICAtIDB4NTggIFRpbWUgU2lnbmF0dXJlXHJcbiAgICAgKiAgICAgICAgICAgdmFybGVuICAgICAtIDQgXHJcbiAgICAgKiAgICAgICAgICAgdTEgICAgICAgICAtIG51bWVyYXRvclxyXG4gICAgICogICAgICAgICAgIHUxICAgICAgICAgLSBsb2cyKGRlbm9taW5hdG9yKVxyXG4gICAgICogICAgICAgICAgIHUxICAgICAgICAgLSBjbG9ja3MgaW4gbWV0cm9ub21lIGNsaWNrXHJcbiAgICAgKiAgICAgICAgICAgdTEgICAgICAgICAtIDMybmQgbm90ZXMgaW4gcXVhcnRlciBub3RlICh1c3VhbGx5IDgpXHJcbiAgICAgKlxyXG4gICAgICogTWV0YWNvZGU6IHUxICAgICAgICAgLSAweDU5ICBLZXkgU2lnbmF0dXJlXHJcbiAgICAgKiAgICAgICAgICAgdmFybGVuICAgICAtIDJcclxuICAgICAqICAgICAgICAgICB1MSAgICAgICAgIC0gaWYgPj0gMCwgdGhlbiBudW1iZXIgb2Ygc2hhcnBzXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgIGlmIDwgMCwgdGhlbiBudW1iZXIgb2YgZmxhdHMgKiAtMVxyXG4gICAgICogICAgICAgICAgIHUxICAgICAgICAgLSAwIGlmIG1ham9yIGtleVxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAxIGlmIG1pbm9yIGtleVxyXG4gICAgICpcclxuICAgICAqIE1ldGFjb2RlOiB1MSAgICAgICAgIC0gMHg1MSAgVGVtcG9cclxuICAgICAqICAgICAgICAgICB2YXJsZW4gICAgIC0gMyAgXHJcbiAgICAgKiAgICAgICAgICAgdTMgICAgICAgICAtIHF1YXJ0ZXIgbm90ZSBsZW5ndGggaW4gbWljcm9zZWNvbmRzXHJcbiAgICAgKi9cclxuXHJcblxyXG4gICAgLyoqIEBjbGFzcyBNaWRpRmlsZVxyXG4gICAgICpcclxuICAgICAqIFRoZSBNaWRpRmlsZSBjbGFzcyBjb250YWlucyB0aGUgcGFyc2VkIGRhdGEgZnJvbSB0aGUgTWlkaSBGaWxlLlxyXG4gICAgICogSXQgY29udGFpbnM6XHJcbiAgICAgKiAtIEFsbCB0aGUgdHJhY2tzIGluIHRoZSBtaWRpIGZpbGUsIGluY2x1ZGluZyBhbGwgTWlkaU5vdGVzIHBlciB0cmFjay5cclxuICAgICAqIC0gVGhlIHRpbWUgc2lnbmF0dXJlIChlLmcuIDQvNCwgMy80LCA2LzgpXHJcbiAgICAgKiAtIFRoZSBudW1iZXIgb2YgcHVsc2VzIHBlciBxdWFydGVyIG5vdGUuXHJcbiAgICAgKiAtIFRoZSB0ZW1wbyAobnVtYmVyIG9mIG1pY3Jvc2Vjb25kcyBwZXIgcXVhcnRlciBub3RlKS5cclxuICAgICAqXHJcbiAgICAgKiBUaGUgY29uc3RydWN0b3IgdGFrZXMgYSBmaWxlbmFtZSBhcyBpbnB1dCwgYW5kIHVwb24gcmV0dXJuaW5nLFxyXG4gICAgICogY29udGFpbnMgdGhlIHBhcnNlZCBkYXRhIGZyb20gdGhlIG1pZGkgZmlsZS5cclxuICAgICAqXHJcbiAgICAgKiBUaGUgbWV0aG9kcyBSZWFkVHJhY2soKSBhbmQgUmVhZE1ldGFFdmVudCgpIGFyZSBoZWxwZXIgZnVuY3Rpb25zIGNhbGxlZFxyXG4gICAgICogYnkgdGhlIGNvbnN0cnVjdG9yIGR1cmluZyB0aGUgcGFyc2luZy5cclxuICAgICAqXHJcbiAgICAgKiBBZnRlciB0aGUgTWlkaUZpbGUgaXMgcGFyc2VkIGFuZCBjcmVhdGVkLCB0aGUgdXNlciBjYW4gcmV0cmlldmUgdGhlIFxyXG4gICAgICogdHJhY2tzIGFuZCBub3RlcyBieSB1c2luZyB0aGUgcHJvcGVydHkgVHJhY2tzIGFuZCBUcmFja3MuTm90ZXMuXHJcbiAgICAgKlxyXG4gICAgICogVGhlcmUgYXJlIHR3byBtZXRob2RzIGZvciBtb2RpZnlpbmcgdGhlIG1pZGkgZGF0YSBiYXNlZCBvbiB0aGUgbWVudVxyXG4gICAgICogb3B0aW9ucyBzZWxlY3RlZDpcclxuICAgICAqXHJcbiAgICAgKiAtIENoYW5nZU1pZGlOb3RlcygpXHJcbiAgICAgKiAgIEFwcGx5IHRoZSBtZW51IG9wdGlvbnMgdG8gdGhlIHBhcnNlZCBNaWRpRmlsZS4gIFRoaXMgdXNlcyB0aGUgaGVscGVyIGZ1bmN0aW9uczpcclxuICAgICAqICAgICBTcGxpdFRyYWNrKClcclxuICAgICAqICAgICBDb21iaW5lVG9Ud29UcmFja3MoKVxyXG4gICAgICogICAgIFNoaWZ0VGltZSgpXHJcbiAgICAgKiAgICAgVHJhbnNwb3NlKClcclxuICAgICAqICAgICBSb3VuZFN0YXJ0VGltZXMoKVxyXG4gICAgICogICAgIFJvdW5kRHVyYXRpb25zKClcclxuICAgICAqXHJcbiAgICAgKiAtIENoYW5nZVNvdW5kKClcclxuICAgICAqICAgQXBwbHkgdGhlIG1lbnUgb3B0aW9ucyB0byB0aGUgTUlESSBtdXNpYyBkYXRhLCBhbmQgc2F2ZSB0aGUgbW9kaWZpZWQgbWlkaSBkYXRhIFxyXG4gICAgICogICB0byBhIGZpbGUsIGZvciBwbGF5YmFjay4gXHJcbiAgICAgKiAgIFxyXG4gICAgICovXHJcblxyXG4gICAgcHVibGljIGNsYXNzIE1pZGlGaWxlXHJcbiAgICB7XHJcbiAgICAgICAgcHJpdmF0ZSBzdHJpbmcgZmlsZW5hbWU7ICAgICAgICAgIC8qKiBUaGUgTWlkaSBmaWxlIG5hbWUgKi9cclxuICAgICAgICBwcml2YXRlIExpc3Q8TWlkaUV2ZW50PltdIGV2ZW50czsgLyoqIFRoZSByYXcgTWlkaUV2ZW50cywgb25lIGxpc3QgcGVyIHRyYWNrICovXHJcbiAgICAgICAgcHJpdmF0ZSBMaXN0PE1pZGlUcmFjaz4gdHJhY2tzOyAgLyoqIFRoZSB0cmFja3Mgb2YgdGhlIG1pZGlmaWxlIHRoYXQgaGF2ZSBub3RlcyAqL1xyXG4gICAgICAgIHByaXZhdGUgdXNob3J0IHRyYWNrbW9kZTsgICAgICAgICAvKiogMCAoc2luZ2xlIHRyYWNrKSwgMSAoc2ltdWx0YW5lb3VzIHRyYWNrcykgMiAoaW5kZXBlbmRlbnQgdHJhY2tzKSAqL1xyXG4gICAgICAgIHByaXZhdGUgVGltZVNpZ25hdHVyZSB0aW1lc2lnOyAgICAvKiogVGhlIHRpbWUgc2lnbmF0dXJlICovXHJcbiAgICAgICAgcHJpdmF0ZSBpbnQgcXVhcnRlcm5vdGU7ICAgICAgICAgIC8qKiBUaGUgbnVtYmVyIG9mIHB1bHNlcyBwZXIgcXVhcnRlciBub3RlICovXHJcbiAgICAgICAgcHJpdmF0ZSBpbnQgdG90YWxwdWxzZXM7ICAgICAgICAgIC8qKiBUaGUgdG90YWwgbGVuZ3RoIG9mIHRoZSBzb25nLCBpbiBwdWxzZXMgKi9cclxuICAgICAgICBwcml2YXRlIGJvb2wgdHJhY2tQZXJDaGFubmVsOyAgICAgLyoqIFRydWUgaWYgd2UndmUgc3BsaXQgZWFjaCBjaGFubmVsIGludG8gYSB0cmFjayAqL1xyXG5cclxuICAgICAgICAvKiBUaGUgbGlzdCBvZiBNaWRpIEV2ZW50cyAqL1xyXG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgRXZlbnROb3RlT2ZmID0gMHg4MDtcclxuICAgICAgICBwdWJsaWMgY29uc3QgaW50IEV2ZW50Tm90ZU9uID0gMHg5MDtcclxuICAgICAgICBwdWJsaWMgY29uc3QgaW50IEV2ZW50S2V5UHJlc3N1cmUgPSAweEEwO1xyXG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgRXZlbnRDb250cm9sQ2hhbmdlID0gMHhCMDtcclxuICAgICAgICBwdWJsaWMgY29uc3QgaW50IEV2ZW50UHJvZ3JhbUNoYW5nZSA9IDB4QzA7XHJcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBFdmVudENoYW5uZWxQcmVzc3VyZSA9IDB4RDA7XHJcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBFdmVudFBpdGNoQmVuZCA9IDB4RTA7XHJcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBTeXNleEV2ZW50MSA9IDB4RjA7XHJcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBTeXNleEV2ZW50MiA9IDB4Rjc7XHJcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBNZXRhRXZlbnQgPSAweEZGO1xyXG5cclxuICAgICAgICAvKiBUaGUgbGlzdCBvZiBNZXRhIEV2ZW50cyAqL1xyXG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWV0YUV2ZW50U2VxdWVuY2UgPSAweDA7XHJcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBNZXRhRXZlbnRUZXh0ID0gMHgxO1xyXG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWV0YUV2ZW50Q29weXJpZ2h0ID0gMHgyO1xyXG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWV0YUV2ZW50U2VxdWVuY2VOYW1lID0gMHgzO1xyXG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWV0YUV2ZW50SW5zdHJ1bWVudCA9IDB4NDtcclxuICAgICAgICBwdWJsaWMgY29uc3QgaW50IE1ldGFFdmVudEx5cmljID0gMHg1O1xyXG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWV0YUV2ZW50TWFya2VyID0gMHg2O1xyXG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWV0YUV2ZW50RW5kT2ZUcmFjayA9IDB4MkY7XHJcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBNZXRhRXZlbnRUZW1wbyA9IDB4NTE7XHJcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBNZXRhRXZlbnRTTVBURU9mZnNldCA9IDB4NTQ7XHJcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBNZXRhRXZlbnRUaW1lU2lnbmF0dXJlID0gMHg1ODtcclxuICAgICAgICBwdWJsaWMgY29uc3QgaW50IE1ldGFFdmVudEtleVNpZ25hdHVyZSA9IDB4NTk7XHJcblxyXG4gICAgICAgIC8qIFRoZSBQcm9ncmFtIENoYW5nZSBldmVudCBnaXZlcyB0aGUgaW5zdHJ1bWVudCB0aGF0IHNob3VsZFxyXG4gICAgICAgICAqIGJlIHVzZWQgZm9yIGEgcGFydGljdWxhciBjaGFubmVsLiAgVGhlIGZvbGxvd2luZyB0YWJsZVxyXG4gICAgICAgICAqIG1hcHMgZWFjaCBpbnN0cnVtZW50IG51bWJlciAoMCB0aHJ1IDEyOCkgdG8gYW4gaW5zdHJ1bWVudFxyXG4gICAgICAgICAqIG5hbWUuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBzdHJpbmdbXSBJbnN0cnVtZW50cyA9IHtcclxuXHJcbiAgICAgICAgXCJBY291c3RpYyBHcmFuZCBQaWFub1wiLFxyXG4gICAgICAgIFwiQnJpZ2h0IEFjb3VzdGljIFBpYW5vXCIsXHJcbiAgICAgICAgXCJFbGVjdHJpYyBHcmFuZCBQaWFub1wiLFxyXG4gICAgICAgIFwiSG9ua3ktdG9uayBQaWFub1wiLFxyXG4gICAgICAgIFwiRWxlY3RyaWMgUGlhbm8gMVwiLFxyXG4gICAgICAgIFwiRWxlY3RyaWMgUGlhbm8gMlwiLFxyXG4gICAgICAgIFwiSGFycHNpY2hvcmRcIixcclxuICAgICAgICBcIkNsYXZpXCIsXHJcbiAgICAgICAgXCJDZWxlc3RhXCIsXHJcbiAgICAgICAgXCJHbG9ja2Vuc3BpZWxcIixcclxuICAgICAgICBcIk11c2ljIEJveFwiLFxyXG4gICAgICAgIFwiVmlicmFwaG9uZVwiLFxyXG4gICAgICAgIFwiTWFyaW1iYVwiLFxyXG4gICAgICAgIFwiWHlsb3Bob25lXCIsXHJcbiAgICAgICAgXCJUdWJ1bGFyIEJlbGxzXCIsXHJcbiAgICAgICAgXCJEdWxjaW1lclwiLFxyXG4gICAgICAgIFwiRHJhd2JhciBPcmdhblwiLFxyXG4gICAgICAgIFwiUGVyY3Vzc2l2ZSBPcmdhblwiLFxyXG4gICAgICAgIFwiUm9jayBPcmdhblwiLFxyXG4gICAgICAgIFwiQ2h1cmNoIE9yZ2FuXCIsXHJcbiAgICAgICAgXCJSZWVkIE9yZ2FuXCIsXHJcbiAgICAgICAgXCJBY2NvcmRpb25cIixcclxuICAgICAgICBcIkhhcm1vbmljYVwiLFxyXG4gICAgICAgIFwiVGFuZ28gQWNjb3JkaW9uXCIsXHJcbiAgICAgICAgXCJBY291c3RpYyBHdWl0YXIgKG55bG9uKVwiLFxyXG4gICAgICAgIFwiQWNvdXN0aWMgR3VpdGFyIChzdGVlbClcIixcclxuICAgICAgICBcIkVsZWN0cmljIEd1aXRhciAoamF6eilcIixcclxuICAgICAgICBcIkVsZWN0cmljIEd1aXRhciAoY2xlYW4pXCIsXHJcbiAgICAgICAgXCJFbGVjdHJpYyBHdWl0YXIgKG11dGVkKVwiLFxyXG4gICAgICAgIFwiT3ZlcmRyaXZlbiBHdWl0YXJcIixcclxuICAgICAgICBcIkRpc3RvcnRpb24gR3VpdGFyXCIsXHJcbiAgICAgICAgXCJHdWl0YXIgaGFybW9uaWNzXCIsXHJcbiAgICAgICAgXCJBY291c3RpYyBCYXNzXCIsXHJcbiAgICAgICAgXCJFbGVjdHJpYyBCYXNzIChmaW5nZXIpXCIsXHJcbiAgICAgICAgXCJFbGVjdHJpYyBCYXNzIChwaWNrKVwiLFxyXG4gICAgICAgIFwiRnJldGxlc3MgQmFzc1wiLFxyXG4gICAgICAgIFwiU2xhcCBCYXNzIDFcIixcclxuICAgICAgICBcIlNsYXAgQmFzcyAyXCIsXHJcbiAgICAgICAgXCJTeW50aCBCYXNzIDFcIixcclxuICAgICAgICBcIlN5bnRoIEJhc3MgMlwiLFxyXG4gICAgICAgIFwiVmlvbGluXCIsXHJcbiAgICAgICAgXCJWaW9sYVwiLFxyXG4gICAgICAgIFwiQ2VsbG9cIixcclxuICAgICAgICBcIkNvbnRyYWJhc3NcIixcclxuICAgICAgICBcIlRyZW1vbG8gU3RyaW5nc1wiLFxyXG4gICAgICAgIFwiUGl6emljYXRvIFN0cmluZ3NcIixcclxuICAgICAgICBcIk9yY2hlc3RyYWwgSGFycFwiLFxyXG4gICAgICAgIFwiVGltcGFuaVwiLFxyXG4gICAgICAgIFwiU3RyaW5nIEVuc2VtYmxlIDFcIixcclxuICAgICAgICBcIlN0cmluZyBFbnNlbWJsZSAyXCIsXHJcbiAgICAgICAgXCJTeW50aFN0cmluZ3MgMVwiLFxyXG4gICAgICAgIFwiU3ludGhTdHJpbmdzIDJcIixcclxuICAgICAgICBcIkNob2lyIEFhaHNcIixcclxuICAgICAgICBcIlZvaWNlIE9vaHNcIixcclxuICAgICAgICBcIlN5bnRoIFZvaWNlXCIsXHJcbiAgICAgICAgXCJPcmNoZXN0cmEgSGl0XCIsXHJcbiAgICAgICAgXCJUcnVtcGV0XCIsXHJcbiAgICAgICAgXCJUcm9tYm9uZVwiLFxyXG4gICAgICAgIFwiVHViYVwiLFxyXG4gICAgICAgIFwiTXV0ZWQgVHJ1bXBldFwiLFxyXG4gICAgICAgIFwiRnJlbmNoIEhvcm5cIixcclxuICAgICAgICBcIkJyYXNzIFNlY3Rpb25cIixcclxuICAgICAgICBcIlN5bnRoQnJhc3MgMVwiLFxyXG4gICAgICAgIFwiU3ludGhCcmFzcyAyXCIsXHJcbiAgICAgICAgXCJTb3ByYW5vIFNheFwiLFxyXG4gICAgICAgIFwiQWx0byBTYXhcIixcclxuICAgICAgICBcIlRlbm9yIFNheFwiLFxyXG4gICAgICAgIFwiQmFyaXRvbmUgU2F4XCIsXHJcbiAgICAgICAgXCJPYm9lXCIsXHJcbiAgICAgICAgXCJFbmdsaXNoIEhvcm5cIixcclxuICAgICAgICBcIkJhc3Nvb25cIixcclxuICAgICAgICBcIkNsYXJpbmV0XCIsXHJcbiAgICAgICAgXCJQaWNjb2xvXCIsXHJcbiAgICAgICAgXCJGbHV0ZVwiLFxyXG4gICAgICAgIFwiUmVjb3JkZXJcIixcclxuICAgICAgICBcIlBhbiBGbHV0ZVwiLFxyXG4gICAgICAgIFwiQmxvd24gQm90dGxlXCIsXHJcbiAgICAgICAgXCJTaGFrdWhhY2hpXCIsXHJcbiAgICAgICAgXCJXaGlzdGxlXCIsXHJcbiAgICAgICAgXCJPY2FyaW5hXCIsXHJcbiAgICAgICAgXCJMZWFkIDEgKHNxdWFyZSlcIixcclxuICAgICAgICBcIkxlYWQgMiAoc2F3dG9vdGgpXCIsXHJcbiAgICAgICAgXCJMZWFkIDMgKGNhbGxpb3BlKVwiLFxyXG4gICAgICAgIFwiTGVhZCA0IChjaGlmZilcIixcclxuICAgICAgICBcIkxlYWQgNSAoY2hhcmFuZylcIixcclxuICAgICAgICBcIkxlYWQgNiAodm9pY2UpXCIsXHJcbiAgICAgICAgXCJMZWFkIDcgKGZpZnRocylcIixcclxuICAgICAgICBcIkxlYWQgOCAoYmFzcyArIGxlYWQpXCIsXHJcbiAgICAgICAgXCJQYWQgMSAobmV3IGFnZSlcIixcclxuICAgICAgICBcIlBhZCAyICh3YXJtKVwiLFxyXG4gICAgICAgIFwiUGFkIDMgKHBvbHlzeW50aClcIixcclxuICAgICAgICBcIlBhZCA0IChjaG9pcilcIixcclxuICAgICAgICBcIlBhZCA1IChib3dlZClcIixcclxuICAgICAgICBcIlBhZCA2IChtZXRhbGxpYylcIixcclxuICAgICAgICBcIlBhZCA3IChoYWxvKVwiLFxyXG4gICAgICAgIFwiUGFkIDggKHN3ZWVwKVwiLFxyXG4gICAgICAgIFwiRlggMSAocmFpbilcIixcclxuICAgICAgICBcIkZYIDIgKHNvdW5kdHJhY2spXCIsXHJcbiAgICAgICAgXCJGWCAzIChjcnlzdGFsKVwiLFxyXG4gICAgICAgIFwiRlggNCAoYXRtb3NwaGVyZSlcIixcclxuICAgICAgICBcIkZYIDUgKGJyaWdodG5lc3MpXCIsXHJcbiAgICAgICAgXCJGWCA2IChnb2JsaW5zKVwiLFxyXG4gICAgICAgIFwiRlggNyAoZWNob2VzKVwiLFxyXG4gICAgICAgIFwiRlggOCAoc2NpLWZpKVwiLFxyXG4gICAgICAgIFwiU2l0YXJcIixcclxuICAgICAgICBcIkJhbmpvXCIsXHJcbiAgICAgICAgXCJTaGFtaXNlblwiLFxyXG4gICAgICAgIFwiS290b1wiLFxyXG4gICAgICAgIFwiS2FsaW1iYVwiLFxyXG4gICAgICAgIFwiQmFnIHBpcGVcIixcclxuICAgICAgICBcIkZpZGRsZVwiLFxyXG4gICAgICAgIFwiU2hhbmFpXCIsXHJcbiAgICAgICAgXCJUaW5rbGUgQmVsbFwiLFxyXG4gICAgICAgIFwiQWdvZ29cIixcclxuICAgICAgICBcIlN0ZWVsIERydW1zXCIsXHJcbiAgICAgICAgXCJXb29kYmxvY2tcIixcclxuICAgICAgICBcIlRhaWtvIERydW1cIixcclxuICAgICAgICBcIk1lbG9kaWMgVG9tXCIsXHJcbiAgICAgICAgXCJTeW50aCBEcnVtXCIsXHJcbiAgICAgICAgXCJSZXZlcnNlIEN5bWJhbFwiLFxyXG4gICAgICAgIFwiR3VpdGFyIEZyZXQgTm9pc2VcIixcclxuICAgICAgICBcIkJyZWF0aCBOb2lzZVwiLFxyXG4gICAgICAgIFwiU2Vhc2hvcmVcIixcclxuICAgICAgICBcIkJpcmQgVHdlZXRcIixcclxuICAgICAgICBcIlRlbGVwaG9uZSBSaW5nXCIsXHJcbiAgICAgICAgXCJIZWxpY29wdGVyXCIsXHJcbiAgICAgICAgXCJBcHBsYXVzZVwiLFxyXG4gICAgICAgIFwiR3Vuc2hvdFwiLFxyXG4gICAgICAgIFwiUGVyY3Vzc2lvblwiXHJcbiAgICB9O1xyXG4gICAgICAgIC8qIEVuZCBJbnN0cnVtZW50cyAqL1xyXG5cclxuICAgICAgICAvKiogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgTWlkaSBldmVudCAqL1xyXG4gICAgICAgIHByaXZhdGUgc3RyaW5nIEV2ZW50TmFtZShpbnQgZXYpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoZXYgPj0gRXZlbnROb3RlT2ZmICYmIGV2IDwgRXZlbnROb3RlT2ZmICsgMTYpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJOb3RlT2ZmXCI7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGV2ID49IEV2ZW50Tm90ZU9uICYmIGV2IDwgRXZlbnROb3RlT24gKyAxNilcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIk5vdGVPblwiO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChldiA+PSBFdmVudEtleVByZXNzdXJlICYmIGV2IDwgRXZlbnRLZXlQcmVzc3VyZSArIDE2KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiS2V5UHJlc3N1cmVcIjtcclxuICAgICAgICAgICAgZWxzZSBpZiAoZXYgPj0gRXZlbnRDb250cm9sQ2hhbmdlICYmIGV2IDwgRXZlbnRDb250cm9sQ2hhbmdlICsgMTYpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJDb250cm9sQ2hhbmdlXCI7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGV2ID49IEV2ZW50UHJvZ3JhbUNoYW5nZSAmJiBldiA8IEV2ZW50UHJvZ3JhbUNoYW5nZSArIDE2KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiUHJvZ3JhbUNoYW5nZVwiO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChldiA+PSBFdmVudENoYW5uZWxQcmVzc3VyZSAmJiBldiA8IEV2ZW50Q2hhbm5lbFByZXNzdXJlICsgMTYpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJDaGFubmVsUHJlc3N1cmVcIjtcclxuICAgICAgICAgICAgZWxzZSBpZiAoZXYgPj0gRXZlbnRQaXRjaEJlbmQgJiYgZXYgPCBFdmVudFBpdGNoQmVuZCArIDE2KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiUGl0Y2hCZW5kXCI7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGV2ID09IE1ldGFFdmVudClcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIk1ldGFFdmVudFwiO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChldiA9PSBTeXNleEV2ZW50MSB8fCBldiA9PSBTeXNleEV2ZW50MilcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIlN5c2V4RXZlbnRcIjtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiVW5rbm93blwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIG1ldGEtZXZlbnQgKi9cclxuICAgICAgICBwcml2YXRlIHN0cmluZyBNZXRhTmFtZShpbnQgZXYpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoZXYgPT0gTWV0YUV2ZW50U2VxdWVuY2UpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJNZXRhRXZlbnRTZXF1ZW5jZVwiO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChldiA9PSBNZXRhRXZlbnRUZXh0KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiTWV0YUV2ZW50VGV4dFwiO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChldiA9PSBNZXRhRXZlbnRDb3B5cmlnaHQpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJNZXRhRXZlbnRDb3B5cmlnaHRcIjtcclxuICAgICAgICAgICAgZWxzZSBpZiAoZXYgPT0gTWV0YUV2ZW50U2VxdWVuY2VOYW1lKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiTWV0YUV2ZW50U2VxdWVuY2VOYW1lXCI7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGV2ID09IE1ldGFFdmVudEluc3RydW1lbnQpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJNZXRhRXZlbnRJbnN0cnVtZW50XCI7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGV2ID09IE1ldGFFdmVudEx5cmljKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiTWV0YUV2ZW50THlyaWNcIjtcclxuICAgICAgICAgICAgZWxzZSBpZiAoZXYgPT0gTWV0YUV2ZW50TWFya2VyKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiTWV0YUV2ZW50TWFya2VyXCI7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGV2ID09IE1ldGFFdmVudEVuZE9mVHJhY2spXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJNZXRhRXZlbnRFbmRPZlRyYWNrXCI7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGV2ID09IE1ldGFFdmVudFRlbXBvKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiTWV0YUV2ZW50VGVtcG9cIjtcclxuICAgICAgICAgICAgZWxzZSBpZiAoZXYgPT0gTWV0YUV2ZW50U01QVEVPZmZzZXQpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJNZXRhRXZlbnRTTVBURU9mZnNldFwiO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChldiA9PSBNZXRhRXZlbnRUaW1lU2lnbmF0dXJlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiTWV0YUV2ZW50VGltZVNpZ25hdHVyZVwiO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChldiA9PSBNZXRhRXZlbnRLZXlTaWduYXR1cmUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJNZXRhRXZlbnRLZXlTaWduYXR1cmVcIjtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiVW5rbm93blwiO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qKiBHZXQgdGhlIGxpc3Qgb2YgdHJhY2tzICovXHJcbiAgICAgICAgcHVibGljIExpc3Q8TWlkaVRyYWNrPiBUcmFja3NcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdldCB7IHJldHVybiB0cmFja3M7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBHZXQgdGhlIHRpbWUgc2lnbmF0dXJlICovXHJcbiAgICAgICAgcHVibGljIFRpbWVTaWduYXR1cmUgVGltZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIHRpbWVzaWc7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBHZXQgdGhlIGZpbGUgbmFtZSAqL1xyXG4gICAgICAgIHB1YmxpYyBzdHJpbmcgRmlsZU5hbWVcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdldCB7IHJldHVybiBmaWxlbmFtZTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEdldCB0aGUgdG90YWwgbGVuZ3RoIChpbiBwdWxzZXMpIG9mIHRoZSBzb25nICovXHJcbiAgICAgICAgcHVibGljIGludCBUb3RhbFB1bHNlc1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIHRvdGFscHVsc2VzOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGJ5dGVbXSBQYXJzZVJpZmZEYXRhKGJ5dGVbXSBkYXRhKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHJpZmZGaWxlID0gUmlmZlBhcnNlci5QYXJzZUJ5dGVBcnJheShkYXRhKTtcclxuICAgICAgICAgICAgaWYgKHJpZmZGaWxlLkZpbGVJbmZvLkZpbGVUeXBlICE9IFwiUk1JRFwiKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aGlsZSAocmlmZkZpbGUuUmVhZCgoZ2xvYmFsOjpNaWRpU2hlZXRNdXNpYy5Qcm9jZXNzRWxlbWVudCkoKHR5cGUsIGlzTGlzdCwgY2h1bmspID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICghaXNMaXN0ICYmIHR5cGUuVG9Mb3dlcigpID09IFwiZGF0YVwiKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSBjaHVuay5HZXREYXRhKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKSkgO1xyXG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBDcmVhdGUgYSBuZXcgTWlkaUZpbGUgZnJvbSB0aGUgYnl0ZVtdLiAqL1xyXG4gICAgICAgIHB1YmxpYyBNaWRpRmlsZShieXRlW10gZGF0YSwgc3RyaW5nIHRpdGxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3RyaW5nIGhlYWRlcjtcclxuICAgICAgICAgICAgaWYgKFJpZmZQYXJzZXIuSXNSaWZmRmlsZShkYXRhLCBvdXQgaGVhZGVyKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZGF0YSA9IFBhcnNlUmlmZkRhdGEoZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIE1pZGlGaWxlUmVhZGVyIGZpbGUgPSBuZXcgTWlkaUZpbGVSZWFkZXIoZGF0YSk7XHJcbiAgICAgICAgICAgIGlmICh0aXRsZSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgdGl0bGUgPSBcIlwiO1xyXG4gICAgICAgICAgICBwYXJzZShmaWxlLCB0aXRsZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogUGFyc2UgdGhlIGdpdmVuIE1pZGkgZmlsZSwgYW5kIHJldHVybiBhbiBpbnN0YW5jZSBvZiB0aGlzIE1pZGlGaWxlXHJcbiAgICAgICAgICogY2xhc3MuICBBZnRlciByZWFkaW5nIHRoZSBtaWRpIGZpbGUsIHRoaXMgb2JqZWN0IHdpbGwgY29udGFpbjpcclxuICAgICAgICAgKiAtIFRoZSByYXcgbGlzdCBvZiBtaWRpIGV2ZW50c1xyXG4gICAgICAgICAqIC0gVGhlIFRpbWUgU2lnbmF0dXJlIG9mIHRoZSBzb25nXHJcbiAgICAgICAgICogLSBBbGwgdGhlIHRyYWNrcyBpbiB0aGUgc29uZyB3aGljaCBjb250YWluIG5vdGVzLiBcclxuICAgICAgICAgKiAtIFRoZSBudW1iZXIsIHN0YXJ0dGltZSwgYW5kIGR1cmF0aW9uIG9mIGVhY2ggbm90ZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwdWJsaWMgdm9pZCBwYXJzZShNaWRpRmlsZVJlYWRlciBmaWxlLCBzdHJpbmcgZmlsZW5hbWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzdHJpbmcgaWQ7XHJcbiAgICAgICAgICAgIGludCBsZW47XHJcblxyXG4gICAgICAgICAgICB0aGlzLmZpbGVuYW1lID0gZmlsZW5hbWU7XHJcbiAgICAgICAgICAgIHRyYWNrcyA9IG5ldyBMaXN0PE1pZGlUcmFjaz4oKTtcclxuICAgICAgICAgICAgdHJhY2tQZXJDaGFubmVsID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBpZCA9IGZpbGUuUmVhZEFzY2lpKDQpO1xyXG4gICAgICAgICAgICBpZiAoaWQgIT0gXCJNVGhkXCIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNaWRpRmlsZUV4Y2VwdGlvbihcIkRvZXNuJ3Qgc3RhcnQgd2l0aCBNVGhkXCIsIDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxlbiA9IGZpbGUuUmVhZEludCgpO1xyXG4gICAgICAgICAgICBpZiAobGVuICE9IDYpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNaWRpRmlsZUV4Y2VwdGlvbihcIkJhZCBNVGhkIGhlYWRlclwiLCA0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0cmFja21vZGUgPSBmaWxlLlJlYWRTaG9ydCgpO1xyXG4gICAgICAgICAgICBpbnQgbnVtX3RyYWNrcyA9IGZpbGUuUmVhZFNob3J0KCk7XHJcbiAgICAgICAgICAgIHF1YXJ0ZXJub3RlID0gZmlsZS5SZWFkU2hvcnQoKTtcclxuXHJcbiAgICAgICAgICAgIGV2ZW50cyA9IG5ldyBMaXN0PE1pZGlFdmVudD5bbnVtX3RyYWNrc107XHJcbiAgICAgICAgICAgIGZvciAoaW50IHRyYWNrbnVtID0gMDsgdHJhY2tudW0gPCBudW1fdHJhY2tzOyB0cmFja251bSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBldmVudHNbdHJhY2tudW1dID0gUmVhZFRyYWNrKGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgTWlkaVRyYWNrIHRyYWNrID0gbmV3IE1pZGlUcmFjayhldmVudHNbdHJhY2tudW1dLCB0cmFja251bSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodHJhY2suTm90ZXMuQ291bnQgPiAwIHx8IHRyYWNrLkx5cmljcyAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyYWNrcy5BZGQodHJhY2spO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvKiBHZXQgdGhlIGxlbmd0aCBvZiB0aGUgc29uZyBpbiBwdWxzZXMgKi9cclxuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaVRyYWNrIHRyYWNrIGluIHRyYWNrcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgTWlkaU5vdGUgbGFzdCA9IHRyYWNrLk5vdGVzW3RyYWNrLk5vdGVzLkNvdW50IC0gMV07XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50b3RhbHB1bHNlcyA8IGxhc3QuU3RhcnRUaW1lICsgbGFzdC5EdXJhdGlvbilcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvdGFscHVsc2VzID0gbGFzdC5TdGFydFRpbWUgKyBsYXN0LkR1cmF0aW9uO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvKiBJZiB3ZSBvbmx5IGhhdmUgb25lIHRyYWNrIHdpdGggbXVsdGlwbGUgY2hhbm5lbHMsIHRoZW4gdHJlYXRcclxuICAgICAgICAgICAgICogZWFjaCBjaGFubmVsIGFzIGEgc2VwYXJhdGUgdHJhY2suXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBpZiAodHJhY2tzLkNvdW50ID09IDEgJiYgSGFzTXVsdGlwbGVDaGFubmVscyh0cmFja3NbMF0pKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0cmFja3MgPSBTcGxpdENoYW5uZWxzKHRyYWNrc1swXSwgZXZlbnRzW3RyYWNrc1swXS5OdW1iZXJdKTtcclxuICAgICAgICAgICAgICAgIHRyYWNrUGVyQ2hhbm5lbCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIENoZWNrU3RhcnRUaW1lcyh0cmFja3MpO1xyXG5cclxuICAgICAgICAgICAgLyogRGV0ZXJtaW5lIHRoZSB0aW1lIHNpZ25hdHVyZSAqL1xyXG4gICAgICAgICAgICBpbnQgdGVtcG8gPSAwO1xyXG4gICAgICAgICAgICBpbnQgbnVtZXIgPSAwO1xyXG4gICAgICAgICAgICBpbnQgZGVub20gPSAwO1xyXG4gICAgICAgICAgICBmb3JlYWNoIChMaXN0PE1pZGlFdmVudD4gbGlzdCBpbiBldmVudHMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlFdmVudCBtZXZlbnQgaW4gbGlzdClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWV2ZW50Lk1ldGFldmVudCA9PSBNZXRhRXZlbnRUZW1wbyAmJiB0ZW1wbyA9PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcG8gPSBtZXZlbnQuVGVtcG87XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXZlbnQuTWV0YWV2ZW50ID09IE1ldGFFdmVudFRpbWVTaWduYXR1cmUgJiYgbnVtZXIgPT0gMClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyID0gbWV2ZW50Lk51bWVyYXRvcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVub20gPSBtZXZlbnQuRGVub21pbmF0b3I7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0ZW1wbyA9PSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbyA9IDUwMDAwMDsgLyogNTAwLDAwMCBtaWNyb3NlY29uZHMgPSAwLjA1IHNlYyAqL1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChudW1lciA9PSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBudW1lciA9IDQ7IGRlbm9tID0gNDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aW1lc2lnID0gbmV3IFRpbWVTaWduYXR1cmUobnVtZXIsIGRlbm9tLCBxdWFydGVybm90ZSwgdGVtcG8pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIFBhcnNlIGEgc2luZ2xlIE1pZGkgdHJhY2sgaW50byBhIGxpc3Qgb2YgTWlkaUV2ZW50cy5cclxuICAgICAgICAgKiBFbnRlcmluZyB0aGlzIGZ1bmN0aW9uLCB0aGUgZmlsZSBvZmZzZXQgc2hvdWxkIGJlIGF0IHRoZSBzdGFydCBvZlxyXG4gICAgICAgICAqIHRoZSBNVHJrIGhlYWRlci4gIFVwb24gZXhpdGluZywgdGhlIGZpbGUgb2Zmc2V0IHNob3VsZCBiZSBhdCB0aGVcclxuICAgICAgICAgKiBzdGFydCBvZiB0aGUgbmV4dCBNVHJrIGhlYWRlci5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwcml2YXRlIExpc3Q8TWlkaUV2ZW50PiBSZWFkVHJhY2soTWlkaUZpbGVSZWFkZXIgZmlsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIExpc3Q8TWlkaUV2ZW50PiByZXN1bHQgPSBuZXcgTGlzdDxNaWRpRXZlbnQ+KDIwKTtcclxuICAgICAgICAgICAgaW50IHN0YXJ0dGltZSA9IDA7XHJcbiAgICAgICAgICAgIHN0cmluZyBpZCA9IGZpbGUuUmVhZEFzY2lpKDQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGlkICE9IFwiTVRya1wiKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWlkaUZpbGVFeGNlcHRpb24oXCJCYWQgTVRyayBoZWFkZXJcIiwgZmlsZS5HZXRPZmZzZXQoKSAtIDQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGludCB0cmFja2xlbiA9IGZpbGUuUmVhZEludCgpO1xyXG4gICAgICAgICAgICBpbnQgdHJhY2tlbmQgPSB0cmFja2xlbiArIGZpbGUuR2V0T2Zmc2V0KCk7XHJcblxyXG4gICAgICAgICAgICBpbnQgZXZlbnRmbGFnID0gMDtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChmaWxlLkdldE9mZnNldCgpIDwgdHJhY2tlbmQpXHJcbiAgICAgICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgbWlkaSBmaWxlIGlzIHRydW5jYXRlZCBoZXJlLCB3ZSBjYW4gc3RpbGwgcmVjb3Zlci5cclxuICAgICAgICAgICAgICAgIC8vIEp1c3QgcmV0dXJuIHdoYXQgd2UndmUgcGFyc2VkIHNvIGZhci5cclxuXHJcbiAgICAgICAgICAgICAgICBpbnQgc3RhcnRvZmZzZXQsIGRlbHRhdGltZTtcclxuICAgICAgICAgICAgICAgIGJ5dGUgcGVla2V2ZW50O1xyXG4gICAgICAgICAgICAgICAgdHJ5XHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRvZmZzZXQgPSBmaWxlLkdldE9mZnNldCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbHRhdGltZSA9IGZpbGUuUmVhZFZhcmxlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0dGltZSArPSBkZWx0YXRpbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgcGVla2V2ZW50ID0gZmlsZS5QZWVrKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoTWlkaUZpbGVFeGNlcHRpb24pXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBNaWRpRXZlbnQgbWV2ZW50ID0gbmV3IE1pZGlFdmVudCgpO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LkFkZChtZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgbWV2ZW50LkRlbHRhVGltZSA9IGRlbHRhdGltZTtcclxuICAgICAgICAgICAgICAgIG1ldmVudC5TdGFydFRpbWUgPSBzdGFydHRpbWU7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHBlZWtldmVudCA+PSBFdmVudE5vdGVPZmYpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50Lkhhc0V2ZW50ZmxhZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRmbGFnID0gZmlsZS5SZWFkQnl0ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIENvbnNvbGUuV3JpdGVMaW5lKFwib2Zmc2V0IHswfTogZXZlbnQgezF9IHsyfSBzdGFydCB7M30gZGVsdGEgezR9XCIsIFxyXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgc3RhcnRvZmZzZXQsIGV2ZW50ZmxhZywgRXZlbnROYW1lKGV2ZW50ZmxhZyksIFxyXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgc3RhcnR0aW1lLCBtZXZlbnQuRGVsdGFUaW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRmbGFnID49IEV2ZW50Tm90ZU9uICYmIGV2ZW50ZmxhZyA8IEV2ZW50Tm90ZU9uICsgMTYpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkV2ZW50RmxhZyA9IEV2ZW50Tm90ZU9uO1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5DaGFubmVsID0gKGJ5dGUpKGV2ZW50ZmxhZyAtIEV2ZW50Tm90ZU9uKTtcclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuTm90ZW51bWJlciA9IGZpbGUuUmVhZEJ5dGUoKTtcclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuVmVsb2NpdHkgPSBmaWxlLlJlYWRCeXRlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChldmVudGZsYWcgPj0gRXZlbnROb3RlT2ZmICYmIGV2ZW50ZmxhZyA8IEV2ZW50Tm90ZU9mZiArIDE2KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPSBFdmVudE5vdGVPZmY7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkNoYW5uZWwgPSAoYnl0ZSkoZXZlbnRmbGFnIC0gRXZlbnROb3RlT2ZmKTtcclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuTm90ZW51bWJlciA9IGZpbGUuUmVhZEJ5dGUoKTtcclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuVmVsb2NpdHkgPSBmaWxlLlJlYWRCeXRlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChldmVudGZsYWcgPj0gRXZlbnRLZXlQcmVzc3VyZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRmbGFnIDwgRXZlbnRLZXlQcmVzc3VyZSArIDE2KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPSBFdmVudEtleVByZXNzdXJlO1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5DaGFubmVsID0gKGJ5dGUpKGV2ZW50ZmxhZyAtIEV2ZW50S2V5UHJlc3N1cmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5Ob3RlbnVtYmVyID0gZmlsZS5SZWFkQnl0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5LZXlQcmVzc3VyZSA9IGZpbGUuUmVhZEJ5dGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGV2ZW50ZmxhZyA+PSBFdmVudENvbnRyb2xDaGFuZ2UgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50ZmxhZyA8IEV2ZW50Q29udHJvbENoYW5nZSArIDE2KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPSBFdmVudENvbnRyb2xDaGFuZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkNoYW5uZWwgPSAoYnl0ZSkoZXZlbnRmbGFnIC0gRXZlbnRDb250cm9sQ2hhbmdlKTtcclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuQ29udHJvbE51bSA9IGZpbGUuUmVhZEJ5dGUoKTtcclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuQ29udHJvbFZhbHVlID0gZmlsZS5SZWFkQnl0ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZXZlbnRmbGFnID49IEV2ZW50UHJvZ3JhbUNoYW5nZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRmbGFnIDwgRXZlbnRQcm9ncmFtQ2hhbmdlICsgMTYpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkV2ZW50RmxhZyA9IEV2ZW50UHJvZ3JhbUNoYW5nZTtcclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuQ2hhbm5lbCA9IChieXRlKShldmVudGZsYWcgLSBFdmVudFByb2dyYW1DaGFuZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5JbnN0cnVtZW50ID0gZmlsZS5SZWFkQnl0ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZXZlbnRmbGFnID49IEV2ZW50Q2hhbm5lbFByZXNzdXJlICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBldmVudGZsYWcgPCBFdmVudENoYW5uZWxQcmVzc3VyZSArIDE2KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPSBFdmVudENoYW5uZWxQcmVzc3VyZTtcclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuQ2hhbm5lbCA9IChieXRlKShldmVudGZsYWcgLSBFdmVudENoYW5uZWxQcmVzc3VyZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkNoYW5QcmVzc3VyZSA9IGZpbGUuUmVhZEJ5dGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGV2ZW50ZmxhZyA+PSBFdmVudFBpdGNoQmVuZCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRmbGFnIDwgRXZlbnRQaXRjaEJlbmQgKyAxNilcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuRXZlbnRGbGFnID0gRXZlbnRQaXRjaEJlbmQ7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkNoYW5uZWwgPSAoYnl0ZSkoZXZlbnRmbGFnIC0gRXZlbnRQaXRjaEJlbmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5QaXRjaEJlbmQgPSBmaWxlLlJlYWRTaG9ydCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZXZlbnRmbGFnID09IFN5c2V4RXZlbnQxKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPSBTeXNleEV2ZW50MTtcclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuTWV0YWxlbmd0aCA9IGZpbGUuUmVhZFZhcmxlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5WYWx1ZSA9IGZpbGUuUmVhZEJ5dGVzKG1ldmVudC5NZXRhbGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGV2ZW50ZmxhZyA9PSBTeXNleEV2ZW50MilcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuRXZlbnRGbGFnID0gU3lzZXhFdmVudDI7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50Lk1ldGFsZW5ndGggPSBmaWxlLlJlYWRWYXJsZW4oKTtcclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuVmFsdWUgPSBmaWxlLlJlYWRCeXRlcyhtZXZlbnQuTWV0YWxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChldmVudGZsYWcgPT0gTWV0YUV2ZW50KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPSBNZXRhRXZlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50Lk1ldGFldmVudCA9IGZpbGUuUmVhZEJ5dGUoKTtcclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuTWV0YWxlbmd0aCA9IGZpbGUuUmVhZFZhcmxlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5WYWx1ZSA9IGZpbGUuUmVhZEJ5dGVzKG1ldmVudC5NZXRhbGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWV2ZW50Lk1ldGFldmVudCA9PSBNZXRhRXZlbnRUaW1lU2lnbmF0dXJlKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1ldmVudC5NZXRhbGVuZ3RoIDwgMilcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhyb3cgbmV3IE1pZGlGaWxlRXhjZXB0aW9uKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gIFwiTWV0YSBFdmVudCBUaW1lIFNpZ25hdHVyZSBsZW4gPT0gXCIgKyBtZXZlbnQuTWV0YWxlbmd0aCAgKyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICBcIiAhPSA0XCIsIGZpbGUuR2V0T2Zmc2V0KCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV2ZW50Lk51bWVyYXRvciA9IChieXRlKTA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXZlbnQuRGVub21pbmF0b3IgPSAoYnl0ZSk0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1ldmVudC5NZXRhbGVuZ3RoID49IDIgJiYgbWV2ZW50Lk1ldGFsZW5ndGggPCA0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXZlbnQuTnVtZXJhdG9yID0gKGJ5dGUpbWV2ZW50LlZhbHVlWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkRlbm9taW5hdG9yID0gKGJ5dGUpU3lzdGVtLk1hdGguUG93KDIsIG1ldmVudC5WYWx1ZVsxXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXZlbnQuTnVtZXJhdG9yID0gKGJ5dGUpbWV2ZW50LlZhbHVlWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkRlbm9taW5hdG9yID0gKGJ5dGUpU3lzdGVtLk1hdGguUG93KDIsIG1ldmVudC5WYWx1ZVsxXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobWV2ZW50Lk1ldGFldmVudCA9PSBNZXRhRXZlbnRUZW1wbylcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtZXZlbnQuTWV0YWxlbmd0aCAhPSAzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWlkaUZpbGVFeGNlcHRpb24oXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiTWV0YSBFdmVudCBUZW1wbyBsZW4gPT0gXCIgKyBtZXZlbnQuTWV0YWxlbmd0aCArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiICE9IDNcIiwgZmlsZS5HZXRPZmZzZXQoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV2ZW50LlRlbXBvID0gKChtZXZlbnQuVmFsdWVbMF0gPDwgMTYpIHwgKG1ldmVudC5WYWx1ZVsxXSA8PCA4KSB8IG1ldmVudC5WYWx1ZVsyXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1ldmVudC5NZXRhZXZlbnQgPT0gTWV0YUV2ZW50RW5kT2ZUcmFjaylcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGJyZWFrOyAgKi9cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1pZGlGaWxlRXhjZXB0aW9uKFwiVW5rbm93biBldmVudCBcIiArIG1ldmVudC5FdmVudEZsYWcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLkdldE9mZnNldCgpIC0gMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogUmV0dXJuIHRydWUgaWYgdGhpcyB0cmFjayBjb250YWlucyBtdWx0aXBsZSBjaGFubmVscy5cclxuICAgICAgICAgKiBJZiBhIE1pZGlGaWxlIGNvbnRhaW5zIG9ubHkgb25lIHRyYWNrLCBhbmQgaXQgaGFzIG11bHRpcGxlIGNoYW5uZWxzLFxyXG4gICAgICAgICAqIHRoZW4gd2UgdHJlYXQgZWFjaCBjaGFubmVsIGFzIGEgc2VwYXJhdGUgdHJhY2suXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc3RhdGljIGJvb2wgSGFzTXVsdGlwbGVDaGFubmVscyhNaWRpVHJhY2sgdHJhY2spXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnQgY2hhbm5lbCA9IHRyYWNrLk5vdGVzWzBdLkNoYW5uZWw7XHJcbiAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlOb3RlIG5vdGUgaW4gdHJhY2suTm90ZXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChub3RlLkNoYW5uZWwgIT0gY2hhbm5lbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogV3JpdGUgYSB2YXJpYWJsZSBsZW5ndGggbnVtYmVyIHRvIHRoZSBidWZmZXIgYXQgdGhlIGdpdmVuIG9mZnNldC5cclxuICAgICAgICAgKiBSZXR1cm4gdGhlIG51bWJlciBvZiBieXRlcyB3cml0dGVuLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHN0YXRpYyBpbnQgVmFybGVuVG9CeXRlcyhpbnQgbnVtLCBieXRlW10gYnVmLCBpbnQgb2Zmc2V0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnl0ZSBiMSA9IChieXRlKSgobnVtID4+IDIxKSAmIDB4N0YpO1xyXG4gICAgICAgICAgICBieXRlIGIyID0gKGJ5dGUpKChudW0gPj4gMTQpICYgMHg3Rik7XHJcbiAgICAgICAgICAgIGJ5dGUgYjMgPSAoYnl0ZSkoKG51bSA+PiA3KSAmIDB4N0YpO1xyXG4gICAgICAgICAgICBieXRlIGI0ID0gKGJ5dGUpKG51bSAmIDB4N0YpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGIxID4gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnVmW29mZnNldF0gPSAoYnl0ZSkoYjEgfCAweDgwKTtcclxuICAgICAgICAgICAgICAgIGJ1ZltvZmZzZXQgKyAxXSA9IChieXRlKShiMiB8IDB4ODApO1xyXG4gICAgICAgICAgICAgICAgYnVmW29mZnNldCArIDJdID0gKGJ5dGUpKGIzIHwgMHg4MCk7XHJcbiAgICAgICAgICAgICAgICBidWZbb2Zmc2V0ICsgM10gPSBiNDtcclxuICAgICAgICAgICAgICAgIHJldHVybiA0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGIyID4gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnVmW29mZnNldF0gPSAoYnl0ZSkoYjIgfCAweDgwKTtcclxuICAgICAgICAgICAgICAgIGJ1ZltvZmZzZXQgKyAxXSA9IChieXRlKShiMyB8IDB4ODApO1xyXG4gICAgICAgICAgICAgICAgYnVmW29mZnNldCArIDJdID0gYjQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChiMyA+IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJ1ZltvZmZzZXRdID0gKGJ5dGUpKGIzIHwgMHg4MCk7XHJcbiAgICAgICAgICAgICAgICBidWZbb2Zmc2V0ICsgMV0gPSBiNDtcclxuICAgICAgICAgICAgICAgIHJldHVybiAyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnVmW29mZnNldF0gPSBiNDtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogV3JpdGUgYSA0LWJ5dGUgaW50ZWdlciB0byBkYXRhW29mZnNldCA6IG9mZnNldCs0XSAqL1xyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIHZvaWQgSW50VG9CeXRlcyhpbnQgdmFsdWUsIGJ5dGVbXSBkYXRhLCBpbnQgb2Zmc2V0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YVtvZmZzZXRdID0gKGJ5dGUpKCh2YWx1ZSA+PiAyNCkgJiAweEZGKTtcclxuICAgICAgICAgICAgZGF0YVtvZmZzZXQgKyAxXSA9IChieXRlKSgodmFsdWUgPj4gMTYpICYgMHhGRik7XHJcbiAgICAgICAgICAgIGRhdGFbb2Zmc2V0ICsgMl0gPSAoYnl0ZSkoKHZhbHVlID4+IDgpICYgMHhGRik7XHJcbiAgICAgICAgICAgIGRhdGFbb2Zmc2V0ICsgM10gPSAoYnl0ZSkodmFsdWUgJiAweEZGKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBDYWxjdWxhdGUgdGhlIHRyYWNrIGxlbmd0aCAoaW4gYnl0ZXMpIGdpdmVuIGEgbGlzdCBvZiBNaWRpIGV2ZW50cyAqL1xyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIGludCBHZXRUcmFja0xlbmd0aChMaXN0PE1pZGlFdmVudD4gZXZlbnRzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW50IGxlbiA9IDA7XHJcbiAgICAgICAgICAgIGJ5dGVbXSBidWYgPSBuZXcgYnl0ZVsxMDI0XTtcclxuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaUV2ZW50IG1ldmVudCBpbiBldmVudHMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxlbiArPSBWYXJsZW5Ub0J5dGVzKG1ldmVudC5EZWx0YVRpbWUsIGJ1ZiwgMCk7XHJcbiAgICAgICAgICAgICAgICBsZW4gKz0gMTsgIC8qIGZvciBldmVudGZsYWcgKi9cclxuICAgICAgICAgICAgICAgIHN3aXRjaCAobWV2ZW50LkV2ZW50RmxhZylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIEV2ZW50Tm90ZU9uOiBsZW4gKz0gMjsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBFdmVudE5vdGVPZmY6IGxlbiArPSAyOyBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIEV2ZW50S2V5UHJlc3N1cmU6IGxlbiArPSAyOyBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIEV2ZW50Q29udHJvbENoYW5nZTogbGVuICs9IDI7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRXZlbnRQcm9ncmFtQ2hhbmdlOiBsZW4gKz0gMTsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBFdmVudENoYW5uZWxQcmVzc3VyZTogbGVuICs9IDE7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRXZlbnRQaXRjaEJlbmQ6IGxlbiArPSAyOyBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTeXNleEV2ZW50MTpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFN5c2V4RXZlbnQyOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW4gKz0gVmFybGVuVG9CeXRlcyhtZXZlbnQuTWV0YWxlbmd0aCwgYnVmLCAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuICs9IG1ldmVudC5NZXRhbGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIE1ldGFFdmVudDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuICs9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbiArPSBWYXJsZW5Ub0J5dGVzKG1ldmVudC5NZXRhbGVuZ3RoLCBidWYsIDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW4gKz0gbWV2ZW50Lk1ldGFsZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBsZW47XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLyoqIFdyaXRlIHRoZSBnaXZlbiBsaXN0IG9mIE1pZGkgZXZlbnRzIHRvIGEgc3RyZWFtL2ZpbGUuXHJcbiAgICAgICAgICogIFRoaXMgbWV0aG9kIGlzIHVzZWQgZm9yIHNvdW5kIHBsYXliYWNrLCBmb3IgY3JlYXRpbmcgbmV3IE1pZGkgZmlsZXNcclxuICAgICAgICAgKiAgd2l0aCB0aGUgdGVtcG8sIHRyYW5zcG9zZSwgZXRjIGNoYW5nZWQuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAgUmV0dXJuIHRydWUgb24gc3VjY2VzcywgYW5kIGZhbHNlIG9uIGVycm9yLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIGJvb2xcclxuICAgICAgICBXcml0ZUV2ZW50cyhTdHJlYW0gZmlsZSwgTGlzdDxNaWRpRXZlbnQ+W10gZXZlbnRzLCBpbnQgdHJhY2ttb2RlLCBpbnQgcXVhcnRlcilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRyeVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBieXRlW10gYnVmID0gbmV3IGJ5dGVbNjU1MzZdO1xyXG5cclxuICAgICAgICAgICAgICAgIC8qIFdyaXRlIHRoZSBNVGhkLCBsZW4gPSA2LCB0cmFjayBtb2RlLCBudW1iZXIgdHJhY2tzLCBxdWFydGVyIG5vdGUgKi9cclxuICAgICAgICAgICAgICAgIGZpbGUuV3JpdGUoQVNDSUlFbmNvZGluZy5BU0NJSS5HZXRCeXRlcyhcIk1UaGRcIiksIDAsIDQpO1xyXG4gICAgICAgICAgICAgICAgSW50VG9CeXRlcyg2LCBidWYsIDApO1xyXG4gICAgICAgICAgICAgICAgZmlsZS5Xcml0ZShidWYsIDAsIDQpO1xyXG4gICAgICAgICAgICAgICAgYnVmWzBdID0gKGJ5dGUpKHRyYWNrbW9kZSA+PiA4KTtcclxuICAgICAgICAgICAgICAgIGJ1ZlsxXSA9IChieXRlKSh0cmFja21vZGUgJiAweEZGKTtcclxuICAgICAgICAgICAgICAgIGZpbGUuV3JpdGUoYnVmLCAwLCAyKTtcclxuICAgICAgICAgICAgICAgIGJ1ZlswXSA9IDA7XHJcbiAgICAgICAgICAgICAgICBidWZbMV0gPSAoYnl0ZSlldmVudHMuTGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZmlsZS5Xcml0ZShidWYsIDAsIDIpO1xyXG4gICAgICAgICAgICAgICAgYnVmWzBdID0gKGJ5dGUpKHF1YXJ0ZXIgPj4gOCk7XHJcbiAgICAgICAgICAgICAgICBidWZbMV0gPSAoYnl0ZSkocXVhcnRlciAmIDB4RkYpO1xyXG4gICAgICAgICAgICAgICAgZmlsZS5Xcml0ZShidWYsIDAsIDIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvcmVhY2ggKExpc3Q8TWlkaUV2ZW50PiBsaXN0IGluIGV2ZW50cylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAvKiBXcml0ZSB0aGUgTVRyayBoZWFkZXIgYW5kIHRyYWNrIGxlbmd0aCAqL1xyXG4gICAgICAgICAgICAgICAgICAgIGZpbGUuV3JpdGUoQVNDSUlFbmNvZGluZy5BU0NJSS5HZXRCeXRlcyhcIk1UcmtcIiksIDAsIDQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGludCBsZW4gPSBHZXRUcmFja0xlbmd0aChsaXN0KTtcclxuICAgICAgICAgICAgICAgICAgICBJbnRUb0J5dGVzKGxlbiwgYnVmLCAwKTtcclxuICAgICAgICAgICAgICAgICAgICBmaWxlLldyaXRlKGJ1ZiwgMCwgNCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlFdmVudCBtZXZlbnQgaW4gbGlzdClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGludCB2YXJsZW4gPSBWYXJsZW5Ub0J5dGVzKG1ldmVudC5EZWx0YVRpbWUsIGJ1ZiwgMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuV3JpdGUoYnVmLCAwLCB2YXJsZW4pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gU3lzZXhFdmVudDEgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPT0gU3lzZXhFdmVudDIgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPT0gTWV0YUV2ZW50KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbMF0gPSBtZXZlbnQuRXZlbnRGbGFnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmWzBdID0gKGJ5dGUpKG1ldmVudC5FdmVudEZsYWcgKyBtZXZlbnQuQ2hhbm5lbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5Xcml0ZShidWYsIDAsIDEpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gRXZlbnROb3RlT24pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlswXSA9IG1ldmVudC5Ob3RlbnVtYmVyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmWzFdID0gbWV2ZW50LlZlbG9jaXR5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5Xcml0ZShidWYsIDAsIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gRXZlbnROb3RlT2ZmKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbMF0gPSBtZXZlbnQuTm90ZW51bWJlcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlsxXSA9IG1ldmVudC5WZWxvY2l0eTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuV3JpdGUoYnVmLCAwLCAyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChtZXZlbnQuRXZlbnRGbGFnID09IEV2ZW50S2V5UHJlc3N1cmUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlswXSA9IG1ldmVudC5Ob3RlbnVtYmVyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmWzFdID0gbWV2ZW50LktleVByZXNzdXJlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5Xcml0ZShidWYsIDAsIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gRXZlbnRDb250cm9sQ2hhbmdlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbMF0gPSBtZXZlbnQuQ29udHJvbE51bTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlsxXSA9IG1ldmVudC5Db250cm9sVmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLldyaXRlKGJ1ZiwgMCwgMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobWV2ZW50LkV2ZW50RmxhZyA9PSBFdmVudFByb2dyYW1DaGFuZ2UpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlswXSA9IG1ldmVudC5JbnN0cnVtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5Xcml0ZShidWYsIDAsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gRXZlbnRDaGFubmVsUHJlc3N1cmUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlswXSA9IG1ldmVudC5DaGFuUHJlc3N1cmU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLldyaXRlKGJ1ZiwgMCwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobWV2ZW50LkV2ZW50RmxhZyA9PSBFdmVudFBpdGNoQmVuZClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmWzBdID0gKGJ5dGUpKG1ldmVudC5QaXRjaEJlbmQgPj4gOCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbMV0gPSAoYnl0ZSkobWV2ZW50LlBpdGNoQmVuZCAmIDB4RkYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5Xcml0ZShidWYsIDAsIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gU3lzZXhFdmVudDEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludCBvZmZzZXQgPSBWYXJsZW5Ub0J5dGVzKG1ldmVudC5NZXRhbGVuZ3RoLCBidWYsIDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXkuQ29weShtZXZlbnQuVmFsdWUsIDAsIGJ1Ziwgb2Zmc2V0LCBtZXZlbnQuVmFsdWUuTGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuV3JpdGUoYnVmLCAwLCBvZmZzZXQgKyBtZXZlbnQuVmFsdWUuTGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChtZXZlbnQuRXZlbnRGbGFnID09IFN5c2V4RXZlbnQyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnQgb2Zmc2V0ID0gVmFybGVuVG9CeXRlcyhtZXZlbnQuTWV0YWxlbmd0aCwgYnVmLCAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFycmF5LkNvcHkobWV2ZW50LlZhbHVlLCAwLCBidWYsIG9mZnNldCwgbWV2ZW50LlZhbHVlLkxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLldyaXRlKGJ1ZiwgMCwgb2Zmc2V0ICsgbWV2ZW50LlZhbHVlLkxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobWV2ZW50LkV2ZW50RmxhZyA9PSBNZXRhRXZlbnQgJiYgbWV2ZW50Lk1ldGFldmVudCA9PSBNZXRhRXZlbnRUZW1wbylcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmWzBdID0gbWV2ZW50Lk1ldGFldmVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlsxXSA9IDM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbMl0gPSAoYnl0ZSkoKG1ldmVudC5UZW1wbyA+PiAxNikgJiAweEZGKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlszXSA9IChieXRlKSgobWV2ZW50LlRlbXBvID4+IDgpICYgMHhGRik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbNF0gPSAoYnl0ZSkobWV2ZW50LlRlbXBvICYgMHhGRik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLldyaXRlKGJ1ZiwgMCwgNSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobWV2ZW50LkV2ZW50RmxhZyA9PSBNZXRhRXZlbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlswXSA9IG1ldmVudC5NZXRhZXZlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnQgb2Zmc2V0ID0gVmFybGVuVG9CeXRlcyhtZXZlbnQuTWV0YWxlbmd0aCwgYnVmLCAxKSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5Db3B5KG1ldmVudC5WYWx1ZSwgMCwgYnVmLCBvZmZzZXQsIG1ldmVudC5WYWx1ZS5MZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5Xcml0ZShidWYsIDAsIG9mZnNldCArIG1ldmVudC5WYWx1ZS5MZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZmlsZS5DbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKElPRXhjZXB0aW9uKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvKiogQ2xvbmUgdGhlIGxpc3Qgb2YgTWlkaUV2ZW50cyAqL1xyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIExpc3Q8TWlkaUV2ZW50PltdIENsb25lTWlkaUV2ZW50cyhMaXN0PE1pZGlFdmVudD5bXSBvcmlnbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIExpc3Q8TWlkaUV2ZW50PltdIG5ld2xpc3QgPSBuZXcgTGlzdDxNaWRpRXZlbnQ+W29yaWdsaXN0Lkxlbmd0aF07XHJcbiAgICAgICAgICAgIGZvciAoaW50IHRyYWNrbnVtID0gMDsgdHJhY2tudW0gPCBvcmlnbGlzdC5MZW5ndGg7IHRyYWNrbnVtKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIExpc3Q8TWlkaUV2ZW50PiBvcmlnZXZlbnRzID0gb3JpZ2xpc3RbdHJhY2tudW1dO1xyXG4gICAgICAgICAgICAgICAgTGlzdDxNaWRpRXZlbnQ+IG5ld2V2ZW50cyA9IG5ldyBMaXN0PE1pZGlFdmVudD4ob3JpZ2V2ZW50cy5Db3VudCk7XHJcbiAgICAgICAgICAgICAgICBuZXdsaXN0W3RyYWNrbnVtXSA9IG5ld2V2ZW50cztcclxuICAgICAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlFdmVudCBtZXZlbnQgaW4gb3JpZ2V2ZW50cylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXdldmVudHMuQWRkKG1ldmVudC5DbG9uZSgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbmV3bGlzdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBDcmVhdGUgYSBuZXcgTWlkaSB0ZW1wbyBldmVudCwgd2l0aCB0aGUgZ2l2ZW4gdGVtcG8gICovXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgTWlkaUV2ZW50IENyZWF0ZVRlbXBvRXZlbnQoaW50IHRlbXBvKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgTWlkaUV2ZW50IG1ldmVudCA9IG5ldyBNaWRpRXZlbnQoKTtcclxuICAgICAgICAgICAgbWV2ZW50LkRlbHRhVGltZSA9IDA7XHJcbiAgICAgICAgICAgIG1ldmVudC5TdGFydFRpbWUgPSAwO1xyXG4gICAgICAgICAgICBtZXZlbnQuSGFzRXZlbnRmbGFnID0gdHJ1ZTtcclxuICAgICAgICAgICAgbWV2ZW50LkV2ZW50RmxhZyA9IE1ldGFFdmVudDtcclxuICAgICAgICAgICAgbWV2ZW50Lk1ldGFldmVudCA9IE1ldGFFdmVudFRlbXBvO1xyXG4gICAgICAgICAgICBtZXZlbnQuTWV0YWxlbmd0aCA9IDM7XHJcbiAgICAgICAgICAgIG1ldmVudC5UZW1wbyA9IHRlbXBvO1xyXG4gICAgICAgICAgICByZXR1cm4gbWV2ZW50O1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qKiBTZWFyY2ggdGhlIGV2ZW50cyBmb3IgYSBDb250cm9sQ2hhbmdlIGV2ZW50IHdpdGggdGhlIHNhbWVcclxuICAgICAgICAgKiAgY2hhbm5lbCBhbmQgY29udHJvbCBudW1iZXIuICBJZiBhIG1hdGNoaW5nIGV2ZW50IGlzIGZvdW5kLFxyXG4gICAgICAgICAqICAgdXBkYXRlIHRoZSBjb250cm9sIHZhbHVlLiAgRWxzZSwgYWRkIGEgbmV3IENvbnRyb2xDaGFuZ2UgZXZlbnQuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgdm9pZFxyXG4gICAgICAgIFVwZGF0ZUNvbnRyb2xDaGFuZ2UoTGlzdDxNaWRpRXZlbnQ+IG5ld2V2ZW50cywgTWlkaUV2ZW50IGNoYW5nZUV2ZW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaUV2ZW50IG1ldmVudCBpbiBuZXdldmVudHMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICgobWV2ZW50LkV2ZW50RmxhZyA9PSBjaGFuZ2VFdmVudC5FdmVudEZsYWcpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgKG1ldmVudC5DaGFubmVsID09IGNoYW5nZUV2ZW50LkNoYW5uZWwpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgKG1ldmVudC5Db250cm9sTnVtID09IGNoYW5nZUV2ZW50LkNvbnRyb2xOdW0pKVxyXG4gICAgICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuQ29udHJvbFZhbHVlID0gY2hhbmdlRXZlbnQuQ29udHJvbFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBuZXdldmVudHMuQWRkKGNoYW5nZUV2ZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBTdGFydCB0aGUgTWlkaSBtdXNpYyBhdCB0aGUgZ2l2ZW4gcGF1c2UgdGltZSAoaW4gcHVsc2VzKS5cclxuICAgICAgICAgKiAgUmVtb3ZlIGFueSBOb3RlT24vTm90ZU9mZiBldmVudHMgdGhhdCBvY2N1ciBiZWZvcmUgdGhlIHBhdXNlIHRpbWUuXHJcbiAgICAgICAgICogIEZvciBvdGhlciBldmVudHMsIGNoYW5nZSB0aGUgZGVsdGEtdGltZSB0byAwIGlmIHRoZXkgb2NjdXJcclxuICAgICAgICAgKiAgYmVmb3JlIHRoZSBwYXVzZSB0aW1lLiAgUmV0dXJuIHRoZSBtb2RpZmllZCBNaWRpIEV2ZW50cy5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyBMaXN0PE1pZGlFdmVudD5bXVxyXG4gICAgICAgIFN0YXJ0QXRQYXVzZVRpbWUoTGlzdDxNaWRpRXZlbnQ+W10gbGlzdCwgaW50IHBhdXNlVGltZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIExpc3Q8TWlkaUV2ZW50PltdIG5ld2xpc3QgPSBuZXcgTGlzdDxNaWRpRXZlbnQ+W2xpc3QuTGVuZ3RoXTtcclxuICAgICAgICAgICAgZm9yIChpbnQgdHJhY2tudW0gPSAwOyB0cmFja251bSA8IGxpc3QuTGVuZ3RoOyB0cmFja251bSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBMaXN0PE1pZGlFdmVudD4gZXZlbnRzID0gbGlzdFt0cmFja251bV07XHJcbiAgICAgICAgICAgICAgICBMaXN0PE1pZGlFdmVudD4gbmV3ZXZlbnRzID0gbmV3IExpc3Q8TWlkaUV2ZW50PihldmVudHMuQ291bnQpO1xyXG4gICAgICAgICAgICAgICAgbmV3bGlzdFt0cmFja251bV0gPSBuZXdldmVudHM7XHJcblxyXG4gICAgICAgICAgICAgICAgYm9vbCBmb3VuZEV2ZW50QWZ0ZXJQYXVzZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgZm9yZWFjaCAoTWlkaUV2ZW50IG1ldmVudCBpbiBldmVudHMpXHJcbiAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXZlbnQuU3RhcnRUaW1lIDwgcGF1c2VUaW1lKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gRXZlbnROb3RlT24gfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPT0gRXZlbnROb3RlT2ZmKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2tpcCBOb3RlT24vTm90ZU9mZiBldmVudCAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gRXZlbnRDb250cm9sQ2hhbmdlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXZlbnQuRGVsdGFUaW1lID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFVwZGF0ZUNvbnRyb2xDaGFuZ2UobmV3ZXZlbnRzLCBtZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkRlbHRhVGltZSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdldmVudHMuQWRkKG1ldmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIWZvdW5kRXZlbnRBZnRlclBhdXNlKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkRlbHRhVGltZSA9IChtZXZlbnQuU3RhcnRUaW1lIC0gcGF1c2VUaW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3ZXZlbnRzLkFkZChtZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZEV2ZW50QWZ0ZXJQYXVzZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld2V2ZW50cy5BZGQobWV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG5ld2xpc3Q7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLyoqIFdyaXRlIHRoaXMgTWlkaSBmaWxlIHRvIHRoZSBnaXZlbiBmaWxlbmFtZS5cclxuICAgICAgICAgKiBJZiBvcHRpb25zIGlzIG5vdCBudWxsLCBhcHBseSB0aG9zZSBvcHRpb25zIHRvIHRoZSBtaWRpIGV2ZW50c1xyXG4gICAgICAgICAqIGJlZm9yZSBwZXJmb3JtaW5nIHRoZSB3cml0ZS5cclxuICAgICAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgZmlsZSB3YXMgc2F2ZWQgc3VjY2Vzc2Z1bGx5LCBlbHNlIGZhbHNlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHB1YmxpYyBib29sIENoYW5nZVNvdW5kKHN0cmluZyBkZXN0ZmlsZSwgTWlkaU9wdGlvbnMgb3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBXcml0ZShkZXN0ZmlsZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYm9vbCBXcml0ZShzdHJpbmcgZGVzdGZpbGUsIE1pZGlPcHRpb25zIG9wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0cnlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgRmlsZVN0cmVhbSBzdHJlYW07XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0gPSBuZXcgRmlsZVN0cmVhbShkZXN0ZmlsZSwgRmlsZU1vZGUuQ3JlYXRlKTtcclxuICAgICAgICAgICAgICAgIGJvb2wgcmVzdWx0ID0gV3JpdGUoc3RyZWFtLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS5DbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoSU9FeGNlcHRpb24pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIFdyaXRlIHRoaXMgTWlkaSBmaWxlIHRvIHRoZSBnaXZlbiBzdHJlYW0uXHJcbiAgICAgICAgICogSWYgb3B0aW9ucyBpcyBub3QgbnVsbCwgYXBwbHkgdGhvc2Ugb3B0aW9ucyB0byB0aGUgbWlkaSBldmVudHNcclxuICAgICAgICAgKiBiZWZvcmUgcGVyZm9ybWluZyB0aGUgd3JpdGUuXHJcbiAgICAgICAgICogUmV0dXJuIHRydWUgaWYgdGhlIGZpbGUgd2FzIHNhdmVkIHN1Y2Nlc3NmdWxseSwgZWxzZSBmYWxzZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwdWJsaWMgYm9vbCBXcml0ZShTdHJlYW0gc3RyZWFtLCBNaWRpT3B0aW9ucyBvcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgTGlzdDxNaWRpRXZlbnQ+W10gbmV3ZXZlbnRzID0gZXZlbnRzO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucyAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuZXdldmVudHMgPSBBcHBseU9wdGlvbnNUb0V2ZW50cyhvcHRpb25zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gV3JpdGVFdmVudHMoc3RyZWFtLCBuZXdldmVudHMsIHRyYWNrbW9kZSwgcXVhcnRlcm5vdGUpO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qIEFwcGx5IHRoZSBmb2xsb3dpbmcgc291bmQgb3B0aW9ucyB0byB0aGUgbWlkaSBldmVudHM6XHJcbiAgICAgICAgICogLSBUaGUgdGVtcG8gKHRoZSBtaWNyb3NlY29uZHMgcGVyIHB1bHNlKVxyXG4gICAgICAgICAqIC0gVGhlIGluc3RydW1lbnRzIHBlciB0cmFja1xyXG4gICAgICAgICAqIC0gVGhlIG5vdGUgbnVtYmVyICh0cmFuc3Bvc2UgdmFsdWUpXHJcbiAgICAgICAgICogLSBUaGUgdHJhY2tzIHRvIGluY2x1ZGVcclxuICAgICAgICAgKiBSZXR1cm4gdGhlIG1vZGlmaWVkIGxpc3Qgb2YgbWlkaSBldmVudHMuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHJpdmF0ZSBMaXN0PE1pZGlFdmVudD5bXVxyXG4gICAgICAgIEFwcGx5T3B0aW9uc1RvRXZlbnRzKE1pZGlPcHRpb25zIG9wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnQgaTtcclxuICAgICAgICAgICAgaWYgKHRyYWNrUGVyQ2hhbm5lbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEFwcGx5T3B0aW9uc1BlckNoYW5uZWwob3B0aW9ucyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8qIEEgbWlkaWZpbGUgY2FuIGNvbnRhaW4gdHJhY2tzIHdpdGggbm90ZXMgYW5kIHRyYWNrcyB3aXRob3V0IG5vdGVzLlxyXG4gICAgICAgICAgICAgKiBUaGUgb3B0aW9ucy50cmFja3MgYW5kIG9wdGlvbnMuaW5zdHJ1bWVudHMgYXJlIGZvciB0cmFja3Mgd2l0aCBub3Rlcy5cclxuICAgICAgICAgICAgICogU28gdGhlIHRyYWNrIG51bWJlcnMgaW4gJ29wdGlvbnMnIG1heSBub3QgbWF0Y2ggY29ycmVjdGx5IGlmIHRoZVxyXG4gICAgICAgICAgICAgKiBtaWRpIGZpbGUgaGFzIHRyYWNrcyB3aXRob3V0IG5vdGVzLiBSZS1jb21wdXRlIHRoZSBpbnN0cnVtZW50cywgYW5kIFxyXG4gICAgICAgICAgICAgKiB0cmFja3MgdG8ga2VlcC5cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGludCBudW1fdHJhY2tzID0gZXZlbnRzLkxlbmd0aDtcclxuICAgICAgICAgICAgaW50W10gaW5zdHJ1bWVudHMgPSBuZXcgaW50W251bV90cmFja3NdO1xyXG4gICAgICAgICAgICBib29sW10ga2VlcHRyYWNrcyA9IG5ldyBib29sW251bV90cmFja3NdO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbnVtX3RyYWNrczsgaSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpbnN0cnVtZW50c1tpXSA9IDA7XHJcbiAgICAgICAgICAgICAgICBrZWVwdHJhY2tzW2ldID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKGludCB0cmFja251bSA9IDA7IHRyYWNrbnVtIDwgdHJhY2tzLkNvdW50OyB0cmFja251bSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBNaWRpVHJhY2sgdHJhY2sgPSB0cmFja3NbdHJhY2tudW1dO1xyXG4gICAgICAgICAgICAgICAgaW50IHJlYWx0cmFjayA9IHRyYWNrLk51bWJlcjtcclxuICAgICAgICAgICAgICAgIGluc3RydW1lbnRzW3JlYWx0cmFja10gPSBvcHRpb25zLmluc3RydW1lbnRzW3RyYWNrbnVtXTtcclxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm11dGVbdHJhY2tudW1dID09IHRydWUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAga2VlcHRyYWNrc1tyZWFsdHJhY2tdID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIExpc3Q8TWlkaUV2ZW50PltdIG5ld2V2ZW50cyA9IENsb25lTWlkaUV2ZW50cyhldmVudHMpO1xyXG5cclxuICAgICAgICAgICAgLyogU2V0IHRoZSB0ZW1wbyBhdCB0aGUgYmVnaW5uaW5nIG9mIGVhY2ggdHJhY2sgKi9cclxuICAgICAgICAgICAgZm9yIChpbnQgdHJhY2tudW0gPSAwOyB0cmFja251bSA8IG5ld2V2ZW50cy5MZW5ndGg7IHRyYWNrbnVtKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIE1pZGlFdmVudCBtZXZlbnQgPSBDcmVhdGVUZW1wb0V2ZW50KG9wdGlvbnMudGVtcG8pO1xyXG4gICAgICAgICAgICAgICAgbmV3ZXZlbnRzW3RyYWNrbnVtXS5JbnNlcnQoMCwgbWV2ZW50KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLyogQ2hhbmdlIHRoZSBub3RlIG51bWJlciAodHJhbnNwb3NlKSwgaW5zdHJ1bWVudCwgYW5kIHRlbXBvICovXHJcbiAgICAgICAgICAgIGZvciAoaW50IHRyYWNrbnVtID0gMDsgdHJhY2tudW0gPCBuZXdldmVudHMuTGVuZ3RoOyB0cmFja251bSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3JlYWNoIChNaWRpRXZlbnQgbWV2ZW50IGluIG5ld2V2ZW50c1t0cmFja251bV0pXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW50IG51bSA9IG1ldmVudC5Ob3RlbnVtYmVyICsgb3B0aW9ucy50cmFuc3Bvc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG51bSA8IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG51bSA+IDEyNylcclxuICAgICAgICAgICAgICAgICAgICAgICAgbnVtID0gMTI3O1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5Ob3RlbnVtYmVyID0gKGJ5dGUpbnVtO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy51c2VEZWZhdWx0SW5zdHJ1bWVudHMpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXZlbnQuSW5zdHJ1bWVudCA9IChieXRlKWluc3RydW1lbnRzW3RyYWNrbnVtXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LlRlbXBvID0gb3B0aW9ucy50ZW1wbztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMucGF1c2VUaW1lICE9IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5ld2V2ZW50cyA9IFN0YXJ0QXRQYXVzZVRpbWUobmV3ZXZlbnRzLCBvcHRpb25zLnBhdXNlVGltZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8qIENoYW5nZSB0aGUgdHJhY2tzIHRvIGluY2x1ZGUgKi9cclxuICAgICAgICAgICAgaW50IGNvdW50ID0gMDtcclxuICAgICAgICAgICAgZm9yIChpbnQgdHJhY2tudW0gPSAwOyB0cmFja251bSA8IGtlZXB0cmFja3MuTGVuZ3RoOyB0cmFja251bSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoa2VlcHRyYWNrc1t0cmFja251bV0pXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY291bnQrKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBMaXN0PE1pZGlFdmVudD5bXSByZXN1bHQgPSBuZXcgTGlzdDxNaWRpRXZlbnQ+W2NvdW50XTtcclxuICAgICAgICAgICAgaSA9IDA7XHJcbiAgICAgICAgICAgIGZvciAoaW50IHRyYWNrbnVtID0gMDsgdHJhY2tudW0gPCBrZWVwdHJhY2tzLkxlbmd0aDsgdHJhY2tudW0rKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKGtlZXB0cmFja3NbdHJhY2tudW1dKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtpXSA9IG5ld2V2ZW50c1t0cmFja251bV07XHJcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiBBcHBseSB0aGUgZm9sbG93aW5nIHNvdW5kIG9wdGlvbnMgdG8gdGhlIG1pZGkgZXZlbnRzOlxyXG4gICAgICAgICAqIC0gVGhlIHRlbXBvICh0aGUgbWljcm9zZWNvbmRzIHBlciBwdWxzZSlcclxuICAgICAgICAgKiAtIFRoZSBpbnN0cnVtZW50cyBwZXIgdHJhY2tcclxuICAgICAgICAgKiAtIFRoZSBub3RlIG51bWJlciAodHJhbnNwb3NlIHZhbHVlKVxyXG4gICAgICAgICAqIC0gVGhlIHRyYWNrcyB0byBpbmNsdWRlXHJcbiAgICAgICAgICogUmV0dXJuIHRoZSBtb2RpZmllZCBsaXN0IG9mIG1pZGkgZXZlbnRzLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogVGhpcyBNaWRpIGZpbGUgb25seSBoYXMgb25lIGFjdHVhbCB0cmFjaywgYnV0IHdlJ3ZlIHNwbGl0IHRoYXRcclxuICAgICAgICAgKiBpbnRvIG11bHRpcGxlIGZha2UgdHJhY2tzLCBvbmUgcGVyIGNoYW5uZWwsIGFuZCBkaXNwbGF5ZWQgdGhhdFxyXG4gICAgICAgICAqIHRvIHRoZSBlbmQtdXNlci4gIFNvIGNoYW5naW5nIHRoZSBpbnN0cnVtZW50LCBhbmQgdHJhY2tzIHRvXHJcbiAgICAgICAgICogaW5jbHVkZSwgaXMgaW1wbGVtZW50ZWQgZGlmZmVyZW50bHkgdGhhbiBBcHBseU9wdGlvbnNUb0V2ZW50cygpLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogLSBXZSBjaGFuZ2UgdGhlIGluc3RydW1lbnQgYmFzZWQgb24gdGhlIGNoYW5uZWwsIG5vdCB0aGUgdHJhY2suXHJcbiAgICAgICAgICogLSBXZSBpbmNsdWRlL2V4Y2x1ZGUgY2hhbm5lbHMsIG5vdCB0cmFja3MuXHJcbiAgICAgICAgICogLSBXZSBleGNsdWRlIGEgY2hhbm5lbCBieSBzZXR0aW5nIHRoZSBub3RlIHZvbHVtZS92ZWxvY2l0eSB0byAwLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHByaXZhdGUgTGlzdDxNaWRpRXZlbnQ+W11cclxuICAgICAgICBBcHBseU9wdGlvbnNQZXJDaGFubmVsKE1pZGlPcHRpb25zIG9wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvKiBEZXRlcm1pbmUgd2hpY2ggY2hhbm5lbHMgdG8gaW5jbHVkZS9leGNsdWRlLlxyXG4gICAgICAgICAgICAgKiBBbHNvLCBkZXRlcm1pbmUgdGhlIGluc3RydW1lbnRzIGZvciBlYWNoIGNoYW5uZWwuXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBpbnRbXSBpbnN0cnVtZW50cyA9IG5ldyBpbnRbMTZdO1xyXG4gICAgICAgICAgICBib29sW10ga2VlcGNoYW5uZWwgPSBuZXcgYm9vbFsxNl07XHJcbiAgICAgICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgMTY7IGkrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaW5zdHJ1bWVudHNbaV0gPSAwO1xyXG4gICAgICAgICAgICAgICAga2VlcGNoYW5uZWxbaV0gPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAoaW50IHRyYWNrbnVtID0gMDsgdHJhY2tudW0gPCB0cmFja3MuQ291bnQ7IHRyYWNrbnVtKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIE1pZGlUcmFjayB0cmFjayA9IHRyYWNrc1t0cmFja251bV07XHJcbiAgICAgICAgICAgICAgICBpbnQgY2hhbm5lbCA9IHRyYWNrLk5vdGVzWzBdLkNoYW5uZWw7XHJcbiAgICAgICAgICAgICAgICBpbnN0cnVtZW50c1tjaGFubmVsXSA9IG9wdGlvbnMuaW5zdHJ1bWVudHNbdHJhY2tudW1dO1xyXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubXV0ZVt0cmFja251bV0gPT0gdHJ1ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBrZWVwY2hhbm5lbFtjaGFubmVsXSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBMaXN0PE1pZGlFdmVudD5bXSBuZXdldmVudHMgPSBDbG9uZU1pZGlFdmVudHMoZXZlbnRzKTtcclxuXHJcbiAgICAgICAgICAgIC8qIFNldCB0aGUgdGVtcG8gYXQgdGhlIGJlZ2lubmluZyBvZiBlYWNoIHRyYWNrICovXHJcbiAgICAgICAgICAgIGZvciAoaW50IHRyYWNrbnVtID0gMDsgdHJhY2tudW0gPCBuZXdldmVudHMuTGVuZ3RoOyB0cmFja251bSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBNaWRpRXZlbnQgbWV2ZW50ID0gQ3JlYXRlVGVtcG9FdmVudChvcHRpb25zLnRlbXBvKTtcclxuICAgICAgICAgICAgICAgIG5ld2V2ZW50c1t0cmFja251bV0uSW5zZXJ0KDAsIG1ldmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8qIENoYW5nZSB0aGUgbm90ZSBudW1iZXIgKHRyYW5zcG9zZSksIGluc3RydW1lbnQsIGFuZCB0ZW1wbyAqL1xyXG4gICAgICAgICAgICBmb3IgKGludCB0cmFja251bSA9IDA7IHRyYWNrbnVtIDwgbmV3ZXZlbnRzLkxlbmd0aDsgdHJhY2tudW0rKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yZWFjaCAoTWlkaUV2ZW50IG1ldmVudCBpbiBuZXdldmVudHNbdHJhY2tudW1dKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGludCBudW0gPSBtZXZlbnQuTm90ZW51bWJlciArIG9wdGlvbnMudHJhbnNwb3NlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChudW0gPCAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBudW0gPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChudW0gPiAxMjcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bSA9IDEyNztcclxuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuTm90ZW51bWJlciA9IChieXRlKW51bTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWtlZXBjaGFubmVsW21ldmVudC5DaGFubmVsXSlcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldmVudC5WZWxvY2l0eSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy51c2VEZWZhdWx0SW5zdHJ1bWVudHMpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXZlbnQuSW5zdHJ1bWVudCA9IChieXRlKWluc3RydW1lbnRzW21ldmVudC5DaGFubmVsXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LlRlbXBvID0gb3B0aW9ucy50ZW1wbztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5wYXVzZVRpbWUgIT0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmV3ZXZlbnRzID0gU3RhcnRBdFBhdXNlVGltZShuZXdldmVudHMsIG9wdGlvbnMucGF1c2VUaW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbmV3ZXZlbnRzO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qKiBBcHBseSB0aGUgZ2l2ZW4gc2hlZXQgbXVzaWMgb3B0aW9ucyB0byB0aGUgTWlkaU5vdGVzLlxyXG4gICAgICAgICAqICBSZXR1cm4gdGhlIG1pZGkgdHJhY2tzIHdpdGggdGhlIGNoYW5nZXMgYXBwbGllZC5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwdWJsaWMgTGlzdDxNaWRpVHJhY2s+IENoYW5nZU1pZGlOb3RlcyhNaWRpT3B0aW9ucyBvcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgTGlzdDxNaWRpVHJhY2s+IG5ld3RyYWNrcyA9IG5ldyBMaXN0PE1pZGlUcmFjaz4oKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAoaW50IHRyYWNrID0gMDsgdHJhY2sgPCB0cmFja3MuQ291bnQ7IHRyYWNrKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnRyYWNrc1t0cmFja10pXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3dHJhY2tzLkFkZCh0cmFja3NbdHJhY2tdLkNsb25lKCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvKiBUbyBtYWtlIHRoZSBzaGVldCBtdXNpYyBsb29rIG5pY2VyLCB3ZSByb3VuZCB0aGUgc3RhcnQgdGltZXNcclxuICAgICAgICAgICAgICogc28gdGhhdCBub3RlcyBjbG9zZSB0b2dldGhlciBhcHBlYXIgYXMgYSBzaW5nbGUgY2hvcmQuICBXZVxyXG4gICAgICAgICAgICAgKiBhbHNvIGV4dGVuZCB0aGUgbm90ZSBkdXJhdGlvbnMsIHNvIHRoYXQgd2UgaGF2ZSBsb25nZXIgbm90ZXNcclxuICAgICAgICAgICAgICogYW5kIGZld2VyIHJlc3Qgc3ltYm9scy5cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFRpbWVTaWduYXR1cmUgdGltZSA9IHRpbWVzaWc7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnRpbWUgIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGltZSA9IG9wdGlvbnMudGltZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBNaWRpRmlsZS5Sb3VuZFN0YXJ0VGltZXMobmV3dHJhY2tzLCBvcHRpb25zLmNvbWJpbmVJbnRlcnZhbCwgdGltZXNpZyk7XHJcbiAgICAgICAgICAgIE1pZGlGaWxlLlJvdW5kRHVyYXRpb25zKG5ld3RyYWNrcywgdGltZS5RdWFydGVyKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnR3b1N0YWZmcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmV3dHJhY2tzID0gTWlkaUZpbGUuQ29tYmluZVRvVHdvVHJhY2tzKG5ld3RyYWNrcywgdGltZXNpZy5NZWFzdXJlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zaGlmdHRpbWUgIT0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgTWlkaUZpbGUuU2hpZnRUaW1lKG5ld3RyYWNrcywgb3B0aW9ucy5zaGlmdHRpbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnRyYW5zcG9zZSAhPSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBNaWRpRmlsZS5UcmFuc3Bvc2UobmV3dHJhY2tzLCBvcHRpb25zLnRyYW5zcG9zZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuZXd0cmFja3M7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLyoqIFNoaWZ0IHRoZSBzdGFydHRpbWUgb2YgdGhlIG5vdGVzIGJ5IHRoZSBnaXZlbiBhbW91bnQuXHJcbiAgICAgICAgICogVGhpcyBpcyB1c2VkIGJ5IHRoZSBTaGlmdCBOb3RlcyBtZW51IHRvIHNoaWZ0IG5vdGVzIGxlZnQvcmlnaHQuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkXHJcbiAgICAgICAgU2hpZnRUaW1lKExpc3Q8TWlkaVRyYWNrPiB0cmFja3MsIGludCBhbW91bnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3JlYWNoIChNaWRpVHJhY2sgdHJhY2sgaW4gdHJhY2tzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3JlYWNoIChNaWRpTm90ZSBub3RlIGluIHRyYWNrLk5vdGVzKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vdGUuU3RhcnRUaW1lICs9IGFtb3VudDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIFNoaWZ0IHRoZSBub3RlIGtleXMgdXAvZG93biBieSB0aGUgZ2l2ZW4gYW1vdW50ICovXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkXHJcbiAgICAgICAgVHJhbnNwb3NlKExpc3Q8TWlkaVRyYWNrPiB0cmFja3MsIGludCBhbW91bnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3JlYWNoIChNaWRpVHJhY2sgdHJhY2sgaW4gdHJhY2tzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3JlYWNoIChNaWRpTm90ZSBub3RlIGluIHRyYWNrLk5vdGVzKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vdGUuTnVtYmVyICs9IGFtb3VudDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobm90ZS5OdW1iZXIgPCAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm90ZS5OdW1iZXIgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qIEZpbmQgdGhlIGhpZ2hlc3QgYW5kIGxvd2VzdCBub3RlcyB0aGF0IG92ZXJsYXAgdGhpcyBpbnRlcnZhbCAoc3RhcnR0aW1lIHRvIGVuZHRpbWUpLlxyXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgYnkgU3BsaXRUcmFjayB0byBkZXRlcm1pbmUgd2hpY2ggc3RhZmYgKHRvcCBvciBib3R0b20pIGEgbm90ZVxyXG4gICAgICAgICAqIHNob3VsZCBnbyB0by5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEZvciBtb3JlIGFjY3VyYXRlIFNwbGl0VHJhY2soKSByZXN1bHRzLCB3ZSBsaW1pdCB0aGUgaW50ZXJ2YWwvZHVyYXRpb24gb2YgdGhpcyBub3RlIFxyXG4gICAgICAgICAqIChhbmQgb3RoZXIgbm90ZXMpIHRvIG9uZSBtZWFzdXJlLiBXZSBjYXJlIG9ubHkgYWJvdXQgaGlnaC9sb3cgbm90ZXMgdGhhdCBhcmVcclxuICAgICAgICAgKiByZWFzb25hYmx5IGNsb3NlIHRvIHRoaXMgbm90ZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyB2b2lkXHJcbiAgICAgICAgRmluZEhpZ2hMb3dOb3RlcyhMaXN0PE1pZGlOb3RlPiBub3RlcywgaW50IG1lYXN1cmVsZW4sIGludCBzdGFydGluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgaW50IHN0YXJ0dGltZSwgaW50IGVuZHRpbWUsIHJlZiBpbnQgaGlnaCwgcmVmIGludCBsb3cpXHJcbiAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgaW50IGkgPSBzdGFydGluZGV4O1xyXG4gICAgICAgICAgICBpZiAoc3RhcnR0aW1lICsgbWVhc3VyZWxlbiA8IGVuZHRpbWUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGVuZHRpbWUgPSBzdGFydHRpbWUgKyBtZWFzdXJlbGVuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAoaSA8IG5vdGVzLkNvdW50ICYmIG5vdGVzW2ldLlN0YXJ0VGltZSA8IGVuZHRpbWUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChub3Rlc1tpXS5FbmRUaW1lIDwgc3RhcnR0aW1lKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChub3Rlc1tpXS5TdGFydFRpbWUgKyBtZWFzdXJlbGVuIDwgc3RhcnR0aW1lKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChoaWdoIDwgbm90ZXNbaV0uTnVtYmVyKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGhpZ2ggPSBub3Rlc1tpXS5OdW1iZXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobG93ID4gbm90ZXNbaV0uTnVtYmVyKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvdyA9IG5vdGVzW2ldLk51bWJlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyogRmluZCB0aGUgaGlnaGVzdCBhbmQgbG93ZXN0IG5vdGVzIHRoYXQgc3RhcnQgYXQgdGhpcyBleGFjdCBzdGFydCB0aW1lICovXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgdm9pZFxyXG4gICAgICAgIEZpbmRFeGFjdEhpZ2hMb3dOb3RlcyhMaXN0PE1pZGlOb3RlPiBub3RlcywgaW50IHN0YXJ0aW5kZXgsIGludCBzdGFydHRpbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZiBpbnQgaGlnaCwgcmVmIGludCBsb3cpXHJcbiAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgaW50IGkgPSBzdGFydGluZGV4O1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKG5vdGVzW2ldLlN0YXJ0VGltZSA8IHN0YXJ0dGltZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAoaSA8IG5vdGVzLkNvdW50ICYmIG5vdGVzW2ldLlN0YXJ0VGltZSA9PSBzdGFydHRpbWUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChoaWdoIDwgbm90ZXNbaV0uTnVtYmVyKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGhpZ2ggPSBub3Rlc1tpXS5OdW1iZXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobG93ID4gbm90ZXNbaV0uTnVtYmVyKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvdyA9IG5vdGVzW2ldLk51bWJlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG5cclxuICAgICAgICAvKiBTcGxpdCB0aGUgZ2l2ZW4gTWlkaVRyYWNrIGludG8gdHdvIHRyYWNrcywgdG9wIGFuZCBib3R0b20uXHJcbiAgICAgICAgICogVGhlIGhpZ2hlc3Qgbm90ZXMgd2lsbCBnbyBpbnRvIHRvcCwgdGhlIGxvd2VzdCBpbnRvIGJvdHRvbS5cclxuICAgICAgICAgKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gc3BsaXQgcGlhbm8gc29uZ3MgaW50byBsZWZ0LWhhbmQgKGJvdHRvbSlcclxuICAgICAgICAgKiBhbmQgcmlnaHQtaGFuZCAodG9wKSB0cmFja3MuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBMaXN0PE1pZGlUcmFjaz4gU3BsaXRUcmFjayhNaWRpVHJhY2sgdHJhY2ssIGludCBtZWFzdXJlbGVuKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgTGlzdDxNaWRpTm90ZT4gbm90ZXMgPSB0cmFjay5Ob3RlcztcclxuICAgICAgICAgICAgaW50IGNvdW50ID0gbm90ZXMuQ291bnQ7XHJcblxyXG4gICAgICAgICAgICBNaWRpVHJhY2sgdG9wID0gbmV3IE1pZGlUcmFjaygxKTtcclxuICAgICAgICAgICAgTWlkaVRyYWNrIGJvdHRvbSA9IG5ldyBNaWRpVHJhY2soMik7XHJcbiAgICAgICAgICAgIExpc3Q8TWlkaVRyYWNrPiByZXN1bHQgPSBuZXcgTGlzdDxNaWRpVHJhY2s+KDIpO1xyXG4gICAgICAgICAgICByZXN1bHQuQWRkKHRvcCk7IHJlc3VsdC5BZGQoYm90dG9tKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjb3VudCA9PSAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICAgICAgICAgIGludCBwcmV2aGlnaCA9IDc2OyAvKiBFNSwgdG9wIG9mIHRyZWJsZSBzdGFmZiAqL1xyXG4gICAgICAgICAgICBpbnQgcHJldmxvdyA9IDQ1OyAvKiBBMywgYm90dG9tIG9mIGJhc3Mgc3RhZmYgKi9cclxuICAgICAgICAgICAgaW50IHN0YXJ0aW5kZXggPSAwO1xyXG5cclxuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaU5vdGUgbm90ZSBpbiBub3RlcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaW50IGhpZ2gsIGxvdywgaGlnaEV4YWN0LCBsb3dFeGFjdDtcclxuXHJcbiAgICAgICAgICAgICAgICBpbnQgbnVtYmVyID0gbm90ZS5OdW1iZXI7XHJcbiAgICAgICAgICAgICAgICBoaWdoID0gbG93ID0gaGlnaEV4YWN0ID0gbG93RXhhY3QgPSBudW1iZXI7XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKG5vdGVzW3N0YXJ0aW5kZXhdLkVuZFRpbWUgPCBub3RlLlN0YXJ0VGltZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFydGluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLyogSSd2ZSB0cmllZCBzZXZlcmFsIGFsZ29yaXRobXMgZm9yIHNwbGl0dGluZyBhIHRyYWNrIGluIHR3byxcclxuICAgICAgICAgICAgICAgICAqIGFuZCB0aGUgb25lIGJlbG93IHNlZW1zIHRvIHdvcmsgdGhlIGJlc3Q6XHJcbiAgICAgICAgICAgICAgICAgKiAtIElmIHRoaXMgbm90ZSBpcyBtb3JlIHRoYW4gYW4gb2N0YXZlIGZyb20gdGhlIGhpZ2gvbG93IG5vdGVzXHJcbiAgICAgICAgICAgICAgICAgKiAgICh0aGF0IHN0YXJ0IGV4YWN0bHkgYXQgdGhpcyBzdGFydCB0aW1lKSwgY2hvb3NlIHRoZSBjbG9zZXN0IG9uZS5cclxuICAgICAgICAgICAgICAgICAqIC0gSWYgdGhpcyBub3RlIGlzIG1vcmUgdGhhbiBhbiBvY3RhdmUgZnJvbSB0aGUgaGlnaC9sb3cgbm90ZXNcclxuICAgICAgICAgICAgICAgICAqICAgKGluIHRoaXMgbm90ZSdzIHRpbWUgZHVyYXRpb24pLCBjaG9vc2UgdGhlIGNsb3Nlc3Qgb25lLlxyXG4gICAgICAgICAgICAgICAgICogLSBJZiB0aGUgaGlnaCBhbmQgbG93IG5vdGVzICh0aGF0IHN0YXJ0IGV4YWN0bHkgYXQgdGhpcyBzdGFydHRpbWUpXHJcbiAgICAgICAgICAgICAgICAgKiAgIGFyZSBtb3JlIHRoYW4gYW4gb2N0YXZlIGFwYXJ0LCBjaG9vc2UgdGhlIGNsb3Nlc3Qgbm90ZS5cclxuICAgICAgICAgICAgICAgICAqIC0gSWYgdGhlIGhpZ2ggYW5kIGxvdyBub3RlcyAodGhhdCBvdmVybGFwIHRoaXMgc3RhcnR0aW1lKVxyXG4gICAgICAgICAgICAgICAgICogICBhcmUgbW9yZSB0aGFuIGFuIG9jdGF2ZSBhcGFydCwgY2hvb3NlIHRoZSBjbG9zZXN0IG5vdGUuXHJcbiAgICAgICAgICAgICAgICAgKiAtIEVsc2UsIGxvb2sgYXQgdGhlIHByZXZpb3VzIGhpZ2gvbG93IG5vdGVzIHRoYXQgd2VyZSBtb3JlIHRoYW4gYW4gXHJcbiAgICAgICAgICAgICAgICAgKiAgIG9jdGF2ZSBhcGFydC4gIENob29zZSB0aGUgY2xvc2VzZXQgbm90ZS5cclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgRmluZEhpZ2hMb3dOb3Rlcyhub3RlcywgbWVhc3VyZWxlbiwgc3RhcnRpbmRleCwgbm90ZS5TdGFydFRpbWUsIG5vdGUuRW5kVGltZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmIGhpZ2gsIHJlZiBsb3cpO1xyXG4gICAgICAgICAgICAgICAgRmluZEV4YWN0SGlnaExvd05vdGVzKG5vdGVzLCBzdGFydGluZGV4LCBub3RlLlN0YXJ0VGltZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWYgaGlnaEV4YWN0LCByZWYgbG93RXhhY3QpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChoaWdoRXhhY3QgLSBudW1iZXIgPiAxMiB8fCBudW1iZXIgLSBsb3dFeGFjdCA+IDEyKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChoaWdoRXhhY3QgLSBudW1iZXIgPD0gbnVtYmVyIC0gbG93RXhhY3QpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3AuQWRkTm90ZShub3RlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm90dG9tLkFkZE5vdGUobm90ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaGlnaCAtIG51bWJlciA+IDEyIHx8IG51bWJlciAtIGxvdyA+IDEyKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChoaWdoIC0gbnVtYmVyIDw9IG51bWJlciAtIGxvdylcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcC5BZGROb3RlKG5vdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3R0b20uQWRkTm90ZShub3RlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChoaWdoRXhhY3QgLSBsb3dFeGFjdCA+IDEyKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChoaWdoRXhhY3QgLSBudW1iZXIgPD0gbnVtYmVyIC0gbG93RXhhY3QpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3AuQWRkTm90ZShub3RlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm90dG9tLkFkZE5vdGUobm90ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaGlnaCAtIGxvdyA+IDEyKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChoaWdoIC0gbnVtYmVyIDw9IG51bWJlciAtIGxvdylcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcC5BZGROb3RlKG5vdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3R0b20uQWRkTm90ZShub3RlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZXZoaWdoIC0gbnVtYmVyIDw9IG51bWJlciAtIHByZXZsb3cpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3AuQWRkTm90ZShub3RlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm90dG9tLkFkZE5vdGUobm90ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8qIFRoZSBwcmV2aGlnaC9wcmV2bG93IGFyZSBzZXQgdG8gdGhlIGxhc3QgaGlnaC9sb3dcclxuICAgICAgICAgICAgICAgICAqIHRoYXQgYXJlIG1vcmUgdGhhbiBhbiBvY3RhdmUgYXBhcnQuXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIGlmIChoaWdoIC0gbG93ID4gMTIpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJldmhpZ2ggPSBoaWdoO1xyXG4gICAgICAgICAgICAgICAgICAgIHByZXZsb3cgPSBsb3c7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRvcC5Ob3Rlcy5Tb3J0KHRyYWNrLk5vdGVzWzBdKTtcclxuICAgICAgICAgICAgYm90dG9tLk5vdGVzLlNvcnQodHJhY2suTm90ZXNbMF0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvKiogQ29tYmluZSB0aGUgbm90ZXMgaW4gdGhlIGdpdmVuIHRyYWNrcyBpbnRvIGEgc2luZ2xlIE1pZGlUcmFjay4gXHJcbiAgICAgICAgICogIFRoZSBpbmRpdmlkdWFsIHRyYWNrcyBhcmUgYWxyZWFkeSBzb3J0ZWQuICBUbyBtZXJnZSB0aGVtLCB3ZVxyXG4gICAgICAgICAqICB1c2UgYSBtZXJnZXNvcnQtbGlrZSBhbGdvcml0aG0uXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBNaWRpVHJhY2sgQ29tYmluZVRvU2luZ2xlVHJhY2soTGlzdDxNaWRpVHJhY2s+IHRyYWNrcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8qIEFkZCBhbGwgbm90ZXMgaW50byBvbmUgdHJhY2sgKi9cclxuICAgICAgICAgICAgTWlkaVRyYWNrIHJlc3VsdCA9IG5ldyBNaWRpVHJhY2soMSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodHJhY2tzLkNvdW50ID09IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAodHJhY2tzLkNvdW50ID09IDEpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIE1pZGlUcmFjayB0cmFjayA9IHRyYWNrc1swXTtcclxuICAgICAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlOb3RlIG5vdGUgaW4gdHJhY2suTm90ZXMpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LkFkZE5vdGUobm90ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpbnRbXSBub3RlaW5kZXggPSBuZXcgaW50WzY0XTtcclxuICAgICAgICAgICAgaW50W10gbm90ZWNvdW50ID0gbmV3IGludFs2NF07XHJcblxyXG4gICAgICAgICAgICBmb3IgKGludCB0cmFja251bSA9IDA7IHRyYWNrbnVtIDwgdHJhY2tzLkNvdW50OyB0cmFja251bSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBub3RlaW5kZXhbdHJhY2tudW1dID0gMDtcclxuICAgICAgICAgICAgICAgIG5vdGVjb3VudFt0cmFja251bV0gPSB0cmFja3NbdHJhY2tudW1dLk5vdGVzLkNvdW50O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIE1pZGlOb3RlIHByZXZub3RlID0gbnVsbDtcclxuICAgICAgICAgICAgd2hpbGUgKHRydWUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIE1pZGlOb3RlIGxvd2VzdG5vdGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgaW50IGxvd2VzdFRyYWNrID0gLTE7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGludCB0cmFja251bSA9IDA7IHRyYWNrbnVtIDwgdHJhY2tzLkNvdW50OyB0cmFja251bSsrKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIE1pZGlUcmFjayB0cmFjayA9IHRyYWNrc1t0cmFja251bV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdGVpbmRleFt0cmFja251bV0gPj0gbm90ZWNvdW50W3RyYWNrbnVtXSlcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBNaWRpTm90ZSBub3RlID0gdHJhY2suTm90ZXNbbm90ZWluZGV4W3RyYWNrbnVtXV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvd2VzdG5vdGUgPT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VzdG5vdGUgPSBub3RlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb3dlc3RUcmFjayA9IHRyYWNrbnVtO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChub3RlLlN0YXJ0VGltZSA8IGxvd2VzdG5vdGUuU3RhcnRUaW1lKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXN0bm90ZSA9IG5vdGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VzdFRyYWNrID0gdHJhY2tudW07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5vdGUuU3RhcnRUaW1lID09IGxvd2VzdG5vdGUuU3RhcnRUaW1lICYmIG5vdGUuTnVtYmVyIDwgbG93ZXN0bm90ZS5OdW1iZXIpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb3dlc3Rub3RlID0gbm90ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXN0VHJhY2sgPSB0cmFja251bTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobG93ZXN0bm90ZSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIC8qIFdlJ3ZlIGZpbmlzaGVkIHRoZSBtZXJnZSAqL1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbm90ZWluZGV4W2xvd2VzdFRyYWNrXSsrO1xyXG4gICAgICAgICAgICAgICAgaWYgKChwcmV2bm90ZSAhPSBudWxsKSAmJiAocHJldm5vdGUuU3RhcnRUaW1lID09IGxvd2VzdG5vdGUuU3RhcnRUaW1lKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgIChwcmV2bm90ZS5OdW1iZXIgPT0gbG93ZXN0bm90ZS5OdW1iZXIpKVxyXG4gICAgICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvKiBEb24ndCBhZGQgZHVwbGljYXRlIG5vdGVzLCB3aXRoIHRoZSBzYW1lIHN0YXJ0IHRpbWUgYW5kIG51bWJlciAqL1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb3dlc3Rub3RlLkR1cmF0aW9uID4gcHJldm5vdGUuRHVyYXRpb24pXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2bm90ZS5EdXJhdGlvbiA9IGxvd2VzdG5vdGUuRHVyYXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5BZGROb3RlKGxvd2VzdG5vdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHByZXZub3RlID0gbG93ZXN0bm90ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvKiogQ29tYmluZSB0aGUgbm90ZXMgaW4gYWxsIHRoZSB0cmFja3MgZ2l2ZW4gaW50byB0d28gTWlkaVRyYWNrcyxcclxuICAgICAgICAgKiBhbmQgcmV0dXJuIHRoZW0uXHJcbiAgICAgICAgICogXHJcbiAgICAgICAgICogVGhpcyBmdW5jdGlvbiBpcyBpbnRlbmRlZCBmb3IgcGlhbm8gc29uZ3MsIHdoZW4gd2Ugd2FudCB0byBkaXNwbGF5XHJcbiAgICAgICAgICogYSBsZWZ0LWhhbmQgdHJhY2sgYW5kIGEgcmlnaHQtaGFuZCB0cmFjay4gIFRoZSBsb3dlciBub3RlcyBnbyBpbnRvIFxyXG4gICAgICAgICAqIHRoZSBsZWZ0LWhhbmQgdHJhY2ssIGFuZCB0aGUgaGlnaGVyIG5vdGVzIGdvIGludG8gdGhlIHJpZ2h0IGhhbmQgXHJcbiAgICAgICAgICogdHJhY2suXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBMaXN0PE1pZGlUcmFjaz4gQ29tYmluZVRvVHdvVHJhY2tzKExpc3Q8TWlkaVRyYWNrPiB0cmFja3MsIGludCBtZWFzdXJlbGVuKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgTWlkaVRyYWNrIHNpbmdsZSA9IENvbWJpbmVUb1NpbmdsZVRyYWNrKHRyYWNrcyk7XHJcbiAgICAgICAgICAgIExpc3Q8TWlkaVRyYWNrPiByZXN1bHQgPSBTcGxpdFRyYWNrKHNpbmdsZSwgbWVhc3VyZWxlbik7XHJcblxyXG4gICAgICAgICAgICBMaXN0PE1pZGlFdmVudD4gbHlyaWNzID0gbmV3IExpc3Q8TWlkaUV2ZW50PigpO1xyXG4gICAgICAgICAgICBmb3JlYWNoIChNaWRpVHJhY2sgdHJhY2sgaW4gdHJhY2tzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHJhY2suTHlyaWNzICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbHlyaWNzLkFkZFJhbmdlKHRyYWNrLkx5cmljcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGx5cmljcy5Db3VudCA+IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGx5cmljcy5Tb3J0KGx5cmljc1swXSk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRbMF0uTHlyaWNzID0gbHlyaWNzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qKiBDaGVjayB0aGF0IHRoZSBNaWRpTm90ZSBzdGFydCB0aW1lcyBhcmUgaW4gaW5jcmVhc2luZyBvcmRlci5cclxuICAgICAgICAgKiBUaGlzIGlzIGZvciBkZWJ1Z2dpbmcgcHVycG9zZXMuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgdm9pZCBDaGVja1N0YXJ0VGltZXMoTGlzdDxNaWRpVHJhY2s+IHRyYWNrcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlUcmFjayB0cmFjayBpbiB0cmFja3MpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGludCBwcmV2dGltZSA9IC0xO1xyXG4gICAgICAgICAgICAgICAgZm9yZWFjaCAoTWlkaU5vdGUgbm90ZSBpbiB0cmFjay5Ob3RlcylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobm90ZS5TdGFydFRpbWUgPCBwcmV2dGltZSlcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeXN0ZW0uQXJndW1lbnRFeGNlcHRpb24oXCJzdGFydCB0aW1lcyBub3QgaW4gaW5jcmVhc2luZyBvcmRlclwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcHJldnRpbWUgPSBub3RlLlN0YXJ0VGltZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qKiBJbiBNaWRpIEZpbGVzLCB0aW1lIGlzIG1lYXN1cmVkIGluIHB1bHNlcy4gIE5vdGVzIHRoYXQgaGF2ZVxyXG4gICAgICAgICAqIHB1bHNlIHRpbWVzIHRoYXQgYXJlIGNsb3NlIHRvZ2V0aGVyIChsaWtlIHdpdGhpbiAxMCBwdWxzZXMpXHJcbiAgICAgICAgICogd2lsbCBzb3VuZCBsaWtlIHRoZXkncmUgdGhlIHNhbWUgY2hvcmQuICBXZSB3YW50IHRvIGRyYXdcclxuICAgICAgICAgKiB0aGVzZSBub3RlcyBhcyBhIHNpbmdsZSBjaG9yZCwgaXQgbWFrZXMgdGhlIHNoZWV0IG11c2ljIG11Y2hcclxuICAgICAgICAgKiBlYXNpZXIgdG8gcmVhZC4gIFdlIGRvbid0IHdhbnQgdG8gZHJhdyBub3RlcyB0aGF0IGFyZSBjbG9zZVxyXG4gICAgICAgICAqIHRvZ2V0aGVyIGFzIHR3byBzZXBhcmF0ZSBjaG9yZHMuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBUaGUgU3ltYm9sU3BhY2luZyBjbGFzcyBvbmx5IGFsaWducyBub3RlcyB0aGF0IGhhdmUgZXhhY3RseSB0aGUgc2FtZVxyXG4gICAgICAgICAqIHN0YXJ0IHRpbWVzLiAgTm90ZXMgd2l0aCBzbGlnaHRseSBkaWZmZXJlbnQgc3RhcnQgdGltZXMgd2lsbFxyXG4gICAgICAgICAqIGFwcGVhciBpbiBzZXBhcmF0ZSB2ZXJ0aWNhbCBjb2x1bW5zLiAgVGhpcyBpc24ndCB3aGF0IHdlIHdhbnQuXHJcbiAgICAgICAgICogV2Ugd2FudCB0byBhbGlnbiBub3RlcyB3aXRoIGFwcHJveGltYXRlbHkgdGhlIHNhbWUgc3RhcnQgdGltZXMuXHJcbiAgICAgICAgICogU28sIHRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byBhc3NpZ24gdGhlIHNhbWUgc3RhcnR0aW1lIGZvciBub3Rlc1xyXG4gICAgICAgICAqIHRoYXQgYXJlIGNsb3NlIHRvZ2V0aGVyICh0aW1ld2lzZSkuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkXHJcbiAgICAgICAgUm91bmRTdGFydFRpbWVzKExpc3Q8TWlkaVRyYWNrPiB0cmFja3MsIGludCBtaWxsaXNlYywgVGltZVNpZ25hdHVyZSB0aW1lKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLyogR2V0IGFsbCB0aGUgc3RhcnR0aW1lcyBpbiBhbGwgdHJhY2tzLCBpbiBzb3J0ZWQgb3JkZXIgKi9cclxuICAgICAgICAgICAgTGlzdDxpbnQ+IHN0YXJ0dGltZXMgPSBuZXcgTGlzdDxpbnQ+KCk7XHJcbiAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlUcmFjayB0cmFjayBpbiB0cmFja3MpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlOb3RlIG5vdGUgaW4gdHJhY2suTm90ZXMpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnR0aW1lcy5BZGQobm90ZS5TdGFydFRpbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0YXJ0dGltZXMuU29ydCgpO1xyXG5cclxuICAgICAgICAgICAgLyogTm90ZXMgd2l0aGluIFwibWlsbGlzZWNcIiBtaWxsaXNlY29uZHMgYXBhcnQgd2lsbCBiZSBjb21iaW5lZC4gKi9cclxuICAgICAgICAgICAgaW50IGludGVydmFsID0gdGltZS5RdWFydGVyICogbWlsbGlzZWMgKiAxMDAwIC8gdGltZS5UZW1wbztcclxuXHJcbiAgICAgICAgICAgIC8qIElmIHR3byBzdGFydHRpbWVzIGFyZSB3aXRoaW4gaW50ZXJ2YWwgbWlsbGlzZWMsIG1ha2UgdGhlbSB0aGUgc2FtZSAqL1xyXG4gICAgICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IHN0YXJ0dGltZXMuQ291bnQgLSAxOyBpKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChzdGFydHRpbWVzW2kgKyAxXSAtIHN0YXJ0dGltZXNbaV0gPD0gaW50ZXJ2YWwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnR0aW1lc1tpICsgMV0gPSBzdGFydHRpbWVzW2ldO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBDaGVja1N0YXJ0VGltZXModHJhY2tzKTtcclxuXHJcbiAgICAgICAgICAgIC8qIEFkanVzdCB0aGUgbm90ZSBzdGFydHRpbWVzLCBzbyB0aGF0IGl0IG1hdGNoZXMgb25lIG9mIHRoZSBzdGFydHRpbWVzIHZhbHVlcyAqL1xyXG4gICAgICAgICAgICBmb3JlYWNoIChNaWRpVHJhY2sgdHJhY2sgaW4gdHJhY2tzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpbnQgaSA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yZWFjaCAoTWlkaU5vdGUgbm90ZSBpbiB0cmFjay5Ob3RlcylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IHN0YXJ0dGltZXMuQ291bnQgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90ZS5TdGFydFRpbWUgLSBpbnRlcnZhbCA+IHN0YXJ0dGltZXNbaV0pXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAobm90ZS5TdGFydFRpbWUgPiBzdGFydHRpbWVzW2ldICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vdGUuU3RhcnRUaW1lIC0gc3RhcnR0aW1lc1tpXSA8PSBpbnRlcnZhbClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub3RlLlN0YXJ0VGltZSA9IHN0YXJ0dGltZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdHJhY2suTm90ZXMuU29ydCh0cmFjay5Ob3Rlc1swXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvKiogV2Ugd2FudCBub3RlIGR1cmF0aW9ucyB0byBzcGFuIHVwIHRvIHRoZSBuZXh0IG5vdGUgaW4gZ2VuZXJhbC5cclxuICAgICAgICAgKiBUaGUgc2hlZXQgbXVzaWMgbG9va3MgbmljZXIgdGhhdCB3YXkuICBJbiBjb250cmFzdCwgc2hlZXQgbXVzaWNcclxuICAgICAgICAgKiB3aXRoIGxvdHMgb2YgMTZ0aC8zMm5kIG5vdGVzIHNlcGFyYXRlZCBieSBzbWFsbCByZXN0cyBkb2Vzbid0XHJcbiAgICAgICAgICogbG9vayBhcyBuaWNlLiAgSGF2aW5nIG5pY2UgbG9va2luZyBzaGVldCBtdXNpYyBpcyBtb3JlIGltcG9ydGFudFxyXG4gICAgICAgICAqIHRoYW4gZmFpdGhmdWxseSByZXByZXNlbnRpbmcgdGhlIE1pZGkgRmlsZSBkYXRhLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogVGhlcmVmb3JlLCB0aGlzIGZ1bmN0aW9uIHJvdW5kcyB0aGUgZHVyYXRpb24gb2YgTWlkaU5vdGVzIHVwIHRvXHJcbiAgICAgICAgICogdGhlIG5leHQgbm90ZSB3aGVyZSBwb3NzaWJsZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWRcclxuICAgICAgICBSb3VuZER1cmF0aW9ucyhMaXN0PE1pZGlUcmFjaz4gdHJhY2tzLCBpbnQgcXVhcnRlcm5vdGUpXHJcbiAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaVRyYWNrIHRyYWNrIGluIHRyYWNrcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgTWlkaU5vdGUgcHJldk5vdGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCB0cmFjay5Ob3Rlcy5Db3VudCAtIDE7IGkrKylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBNaWRpTm90ZSBub3RlMSA9IHRyYWNrLk5vdGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmV2Tm90ZSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldk5vdGUgPSBub3RlMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8qIEdldCB0aGUgbmV4dCBub3RlIHRoYXQgaGFzIGEgZGlmZmVyZW50IHN0YXJ0IHRpbWUgKi9cclxuICAgICAgICAgICAgICAgICAgICBNaWRpTm90ZSBub3RlMiA9IG5vdGUxO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaW50IGogPSBpICsgMTsgaiA8IHRyYWNrLk5vdGVzLkNvdW50OyBqKyspXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBub3RlMiA9IHRyYWNrLk5vdGVzW2pdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm90ZTEuU3RhcnRUaW1lIDwgbm90ZTIuU3RhcnRUaW1lKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpbnQgbWF4ZHVyYXRpb24gPSBub3RlMi5TdGFydFRpbWUgLSBub3RlMS5TdGFydFRpbWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGludCBkdXIgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChxdWFydGVybm90ZSA8PSBtYXhkdXJhdGlvbilcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHVyID0gcXVhcnRlcm5vdGU7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocXVhcnRlcm5vdGUgLyAyIDw9IG1heGR1cmF0aW9uKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXIgPSBxdWFydGVybm90ZSAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocXVhcnRlcm5vdGUgLyAzIDw9IG1heGR1cmF0aW9uKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXIgPSBxdWFydGVybm90ZSAvIDM7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocXVhcnRlcm5vdGUgLyA0IDw9IG1heGR1cmF0aW9uKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXIgPSBxdWFydGVybm90ZSAvIDQ7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZHVyIDwgbm90ZTEuRHVyYXRpb24pXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXIgPSBub3RlMS5EdXJhdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8qIFNwZWNpYWwgY2FzZTogSWYgdGhlIHByZXZpb3VzIG5vdGUncyBkdXJhdGlvblxyXG4gICAgICAgICAgICAgICAgICAgICAqIG1hdGNoZXMgdGhpcyBub3RlJ3MgZHVyYXRpb24sIHdlIGNhbiBtYWtlIGEgbm90ZXBhaXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICogU28gZG9uJ3QgZXhwYW5kIHRoZSBkdXJhdGlvbiBpbiB0aGF0IGNhc2UuXHJcbiAgICAgICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKChwcmV2Tm90ZS5TdGFydFRpbWUgKyBwcmV2Tm90ZS5EdXJhdGlvbiA9PSBub3RlMS5TdGFydFRpbWUpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChwcmV2Tm90ZS5EdXJhdGlvbiA9PSBub3RlMS5EdXJhdGlvbikpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZHVyID0gbm90ZTEuRHVyYXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIG5vdGUxLkR1cmF0aW9uID0gZHVyO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmFjay5Ob3Rlc1tpICsgMV0uU3RhcnRUaW1lICE9IG5vdGUxLlN0YXJ0VGltZSlcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZOb3RlID0gbm90ZTE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogU3BsaXQgdGhlIGdpdmVuIHRyYWNrIGludG8gbXVsdGlwbGUgdHJhY2tzLCBzZXBhcmF0aW5nIGVhY2hcclxuICAgICAgICAgKiBjaGFubmVsIGludG8gYSBzZXBhcmF0ZSB0cmFjay5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyBMaXN0PE1pZGlUcmFjaz5cclxuICAgICAgICBTcGxpdENoYW5uZWxzKE1pZGlUcmFjayBvcmlndHJhY2ssIExpc3Q8TWlkaUV2ZW50PiBldmVudHMpXHJcbiAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgLyogRmluZCB0aGUgaW5zdHJ1bWVudCB1c2VkIGZvciBlYWNoIGNoYW5uZWwgKi9cclxuICAgICAgICAgICAgaW50W10gY2hhbm5lbEluc3RydW1lbnRzID0gbmV3IGludFsxNl07XHJcbiAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlFdmVudCBtZXZlbnQgaW4gZXZlbnRzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAobWV2ZW50LkV2ZW50RmxhZyA9PSBFdmVudFByb2dyYW1DaGFuZ2UpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbm5lbEluc3RydW1lbnRzW21ldmVudC5DaGFubmVsXSA9IG1ldmVudC5JbnN0cnVtZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNoYW5uZWxJbnN0cnVtZW50c1s5XSA9IDEyODsgLyogQ2hhbm5lbCA5ID0gUGVyY3Vzc2lvbiAqL1xyXG5cclxuICAgICAgICAgICAgTGlzdDxNaWRpVHJhY2s+IHJlc3VsdCA9IG5ldyBMaXN0PE1pZGlUcmFjaz4oKTtcclxuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaU5vdGUgbm90ZSBpbiBvcmlndHJhY2suTm90ZXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJvb2wgZm91bmRjaGFubmVsID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBmb3JlYWNoIChNaWRpVHJhY2sgdHJhY2sgaW4gcmVzdWx0KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChub3RlLkNoYW5uZWwgPT0gdHJhY2suTm90ZXNbMF0uQ2hhbm5lbClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kY2hhbm5lbCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYWNrLkFkZE5vdGUobm90ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZGNoYW5uZWwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgTWlkaVRyYWNrIHRyYWNrID0gbmV3IE1pZGlUcmFjayhyZXN1bHQuQ291bnQgKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICB0cmFjay5BZGROb3RlKG5vdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRyYWNrLkluc3RydW1lbnQgPSBjaGFubmVsSW5zdHJ1bWVudHNbbm90ZS5DaGFubmVsXTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQuQWRkKHRyYWNrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAob3JpZ3RyYWNrLkx5cmljcyAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3JlYWNoIChNaWRpRXZlbnQgbHlyaWNFdmVudCBpbiBvcmlndHJhY2suTHlyaWNzKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlUcmFjayB0cmFjayBpbiByZXN1bHQpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobHlyaWNFdmVudC5DaGFubmVsID09IHRyYWNrLk5vdGVzWzBdLkNoYW5uZWwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYWNrLkFkZEx5cmljKGx5cmljRXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLyoqIEd1ZXNzIHRoZSBtZWFzdXJlIGxlbmd0aC4gIFdlIGFzc3VtZSB0aGF0IHRoZSBtZWFzdXJlXHJcbiAgICAgICAgICogbGVuZ3RoIG11c3QgYmUgYmV0d2VlbiAwLjUgc2Vjb25kcyBhbmQgNCBzZWNvbmRzLlxyXG4gICAgICAgICAqIFRha2UgYWxsIHRoZSBub3RlIHN0YXJ0IHRpbWVzIHRoYXQgZmFsbCBiZXR3ZWVuIDAuNSBhbmQgXHJcbiAgICAgICAgICogNCBzZWNvbmRzLCBhbmQgcmV0dXJuIHRoZSBzdGFydHRpbWVzLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHB1YmxpYyBMaXN0PGludD5cclxuICAgICAgICBHdWVzc01lYXN1cmVMZW5ndGgoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgTGlzdDxpbnQ+IHJlc3VsdCA9IG5ldyBMaXN0PGludD4oKTtcclxuXHJcbiAgICAgICAgICAgIGludCBwdWxzZXNfcGVyX3NlY29uZCA9IChpbnQpKDEwMDAwMDAuMCAvIHRpbWVzaWcuVGVtcG8gKiB0aW1lc2lnLlF1YXJ0ZXIpO1xyXG4gICAgICAgICAgICBpbnQgbWlubWVhc3VyZSA9IHB1bHNlc19wZXJfc2Vjb25kIC8gMjsgIC8qIFRoZSBtaW5pbXVtIG1lYXN1cmUgbGVuZ3RoIGluIHB1bHNlcyAqL1xyXG4gICAgICAgICAgICBpbnQgbWF4bWVhc3VyZSA9IHB1bHNlc19wZXJfc2Vjb25kICogNDsgIC8qIFRoZSBtYXhpbXVtIG1lYXN1cmUgbGVuZ3RoIGluIHB1bHNlcyAqL1xyXG5cclxuICAgICAgICAgICAgLyogR2V0IHRoZSBzdGFydCB0aW1lIG9mIHRoZSBmaXJzdCBub3RlIGluIHRoZSBtaWRpIGZpbGUuICovXHJcbiAgICAgICAgICAgIGludCBmaXJzdG5vdGUgPSB0aW1lc2lnLk1lYXN1cmUgKiA1O1xyXG4gICAgICAgICAgICBmb3JlYWNoIChNaWRpVHJhY2sgdHJhY2sgaW4gdHJhY2tzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3Rub3RlID4gdHJhY2suTm90ZXNbMF0uU3RhcnRUaW1lKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0bm90ZSA9IHRyYWNrLk5vdGVzWzBdLlN0YXJ0VGltZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLyogaW50ZXJ2YWwgPSAwLjA2IHNlY29uZHMsIGNvbnZlcnRlZCBpbnRvIHB1bHNlcyAqL1xyXG4gICAgICAgICAgICBpbnQgaW50ZXJ2YWwgPSB0aW1lc2lnLlF1YXJ0ZXIgKiA2MDAwMCAvIHRpbWVzaWcuVGVtcG87XHJcblxyXG4gICAgICAgICAgICBmb3JlYWNoIChNaWRpVHJhY2sgdHJhY2sgaW4gdHJhY2tzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpbnQgcHJldnRpbWUgPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yZWFjaCAoTWlkaU5vdGUgbm90ZSBpbiB0cmFjay5Ob3RlcylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobm90ZS5TdGFydFRpbWUgLSBwcmV2dGltZSA8PSBpbnRlcnZhbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHByZXZ0aW1lID0gbm90ZS5TdGFydFRpbWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGludCB0aW1lX2Zyb21fZmlyc3Rub3RlID0gbm90ZS5TdGFydFRpbWUgLSBmaXJzdG5vdGU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8qIFJvdW5kIHRoZSB0aW1lIGRvd24gdG8gYSBtdWx0aXBsZSBvZiA0ICovXHJcbiAgICAgICAgICAgICAgICAgICAgdGltZV9mcm9tX2ZpcnN0bm90ZSA9IHRpbWVfZnJvbV9maXJzdG5vdGUgLyA0ICogNDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGltZV9mcm9tX2ZpcnN0bm90ZSA8IG1pbm1lYXN1cmUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aW1lX2Zyb21fZmlyc3Rub3RlID4gbWF4bWVhc3VyZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVzdWx0LkNvbnRhaW5zKHRpbWVfZnJvbV9maXJzdG5vdGUpKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LkFkZCh0aW1lX2Zyb21fZmlyc3Rub3RlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzdWx0LlNvcnQoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBSZXR1cm4gdGhlIGxhc3Qgc3RhcnQgdGltZSAqL1xyXG4gICAgICAgIHB1YmxpYyBpbnQgRW5kVGltZSgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnQgbGFzdFN0YXJ0ID0gMDtcclxuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaVRyYWNrIHRyYWNrIGluIHRyYWNrcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRyYWNrLk5vdGVzLkNvdW50ID09IDApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpbnQgbGFzdCA9IHRyYWNrLk5vdGVzW3RyYWNrLk5vdGVzLkNvdW50IC0gMV0uU3RhcnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgbGFzdFN0YXJ0ID0gTWF0aC5NYXgobGFzdCwgbGFzdFN0YXJ0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbGFzdFN0YXJ0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIFJldHVybiB0cnVlIGlmIHRoaXMgbWlkaSBmaWxlIGhhcyBseXJpY3MgKi9cclxuICAgICAgICBwdWJsaWMgYm9vbCBIYXNMeXJpY3MoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaVRyYWNrIHRyYWNrIGluIHRyYWNrcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRyYWNrLkx5cmljcyAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBvdmVycmlkZSBzdHJpbmcgVG9TdHJpbmcoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3RyaW5nIHJlc3VsdCA9IFwiTWlkaSBGaWxlIHRyYWNrcz1cIiArIHRyYWNrcy5Db3VudCArIFwiIHF1YXJ0ZXI9XCIgKyBxdWFydGVybm90ZSArIFwiXFxuXCI7XHJcbiAgICAgICAgICAgIHJlc3VsdCArPSBUaW1lLlRvU3RyaW5nKCkgKyBcIlxcblwiO1xyXG4gICAgICAgICAgICBmb3JlYWNoIChNaWRpVHJhY2sgdHJhY2sgaW4gdHJhY2tzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gdHJhY2suVG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9ICAvKiBFbmQgY2xhc3MgTWlkaUZpbGUgKi9cclxuXHJcbn0gIC8qIEVuZCBuYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMgKi9cclxuXHJcbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMiBNYWRoYXYgVmFpZHlhbmF0aGFuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cblxudXNpbmcgU3lzdGVtO1xudXNpbmcgU3lzdGVtLklPO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG51c2luZyBTeXN0ZW0uVGV4dDtcblxuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xuXG4vKiogQGNsYXNzIE1pZGlGaWxlRXhjZXB0aW9uXG4gKiBBIE1pZGlGaWxlRXhjZXB0aW9uIGlzIHRocm93biB3aGVuIGFuIGVycm9yIG9jY3Vyc1xuICogd2hpbGUgcGFyc2luZyB0aGUgTWlkaSBGaWxlLiAgVGhlIGNvbnN0cnVjdG9yIHRha2VzXG4gKiB0aGUgZmlsZSBvZmZzZXQgKGluIGJ5dGVzKSB3aGVyZSB0aGUgZXJyb3Igb2NjdXJyZWQsXG4gKiBhbmQgYSBzdHJpbmcgZGVzY3JpYmluZyB0aGUgZXJyb3IuXG4gKi9cbnB1YmxpYyBjbGFzcyBNaWRpRmlsZUV4Y2VwdGlvbiA6IFN5c3RlbS5FeGNlcHRpb24ge1xuICAgIHB1YmxpYyBNaWRpRmlsZUV4Y2VwdGlvbiAoc3RyaW5nIHMsIGludCBvZmZzZXQpIDpcbiAgICAgICAgYmFzZShzICsgXCIgYXQgb2Zmc2V0IFwiICsgb2Zmc2V0KSB7XG4gICAgfVxufVxuXG59XG5cbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMiBNYWRoYXYgVmFpZHlhbmF0aGFuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cblxudXNpbmcgU3lzdGVtO1xudXNpbmcgU3lzdGVtLklPO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG51c2luZyBTeXN0ZW0uVGV4dDtcblxuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xuXG5cbi8qKiBAY2xhc3MgTWlkaUZpbGVSZWFkZXJcbiAqIFRoZSBNaWRpRmlsZVJlYWRlciBpcyB1c2VkIHRvIHJlYWQgbG93LWxldmVsIGJpbmFyeSBkYXRhIGZyb20gYSBmaWxlLlxuICogVGhpcyBjbGFzcyBjYW4gZG8gdGhlIGZvbGxvd2luZzpcbiAqXG4gKiAtIFBlZWsgYXQgdGhlIG5leHQgYnl0ZSBpbiB0aGUgZmlsZS5cbiAqIC0gUmVhZCBhIGJ5dGVcbiAqIC0gUmVhZCBhIDE2LWJpdCBiaWcgZW5kaWFuIHNob3J0XG4gKiAtIFJlYWQgYSAzMi1iaXQgYmlnIGVuZGlhbiBpbnRcbiAqIC0gUmVhZCBhIGZpeGVkIGxlbmd0aCBhc2NpaSBzdHJpbmcgKG5vdCBudWxsIHRlcm1pbmF0ZWQpXG4gKiAtIFJlYWQgYSBcInZhcmlhYmxlIGxlbmd0aFwiIGludGVnZXIuICBUaGUgZm9ybWF0IG9mIHRoZSB2YXJpYWJsZSBsZW5ndGhcbiAqICAgaW50IGlzIGRlc2NyaWJlZCBhdCB0aGUgdG9wIG9mIHRoaXMgZmlsZS5cbiAqIC0gU2tpcCBhaGVhZCBhIGdpdmVuIG51bWJlciBvZiBieXRlc1xuICogLSBSZXR1cm4gdGhlIGN1cnJlbnQgb2Zmc2V0LlxuICovXG5cbnB1YmxpYyBjbGFzcyBNaWRpRmlsZVJlYWRlciB7XG4gICAgcHJpdmF0ZSBieXRlW10gZGF0YTsgICAgICAgLyoqIFRoZSBlbnRpcmUgbWlkaSBmaWxlIGRhdGEgKi9cbiAgICBwcml2YXRlIGludCBwYXJzZV9vZmZzZXQ7ICAvKiogVGhlIGN1cnJlbnQgb2Zmc2V0IHdoaWxlIHBhcnNpbmcgKi9cblxuICAgIC8qKiBDcmVhdGUgYSBuZXcgTWlkaUZpbGVSZWFkZXIgZm9yIHRoZSBnaXZlbiBmaWxlbmFtZSAqL1xuICAgIC8vcHVibGljIE1pZGlGaWxlUmVhZGVyKHN0cmluZyBmaWxlbmFtZSkge1xuICAgIC8vICAgIEZpbGVJbmZvIGluZm8gPSBuZXcgRmlsZUluZm8oZmlsZW5hbWUpO1xuICAgIC8vICAgIGlmICghaW5mby5FeGlzdHMpIHtcbiAgICAvLyAgICAgICAgdGhyb3cgbmV3IE1pZGlGaWxlRXhjZXB0aW9uKFwiRmlsZSBcIiArIGZpbGVuYW1lICsgXCIgZG9lcyBub3QgZXhpc3RcIiwgMCk7XG4gICAgLy8gICAgfVxuICAgIC8vICAgIGlmIChpbmZvLkxlbmd0aCA9PSAwKSB7XG4gICAgLy8gICAgICAgIHRocm93IG5ldyBNaWRpRmlsZUV4Y2VwdGlvbihcIkZpbGUgXCIgKyBmaWxlbmFtZSArIFwiIGlzIGVtcHR5ICgwIGJ5dGVzKVwiLCAwKTtcbiAgICAvLyAgICB9XG4gICAgLy8gICAgRmlsZVN0cmVhbSBmaWxlID0gRmlsZS5PcGVuKGZpbGVuYW1lLCBGaWxlTW9kZS5PcGVuLCBcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRmlsZUFjY2Vzcy5SZWFkLCBGaWxlU2hhcmUuUmVhZCk7XG5cbiAgICAvLyAgICAvKiBSZWFkIHRoZSBlbnRpcmUgZmlsZSBpbnRvIG1lbW9yeSAqL1xuICAgIC8vICAgIGRhdGEgPSBuZXcgYnl0ZVsgaW5mby5MZW5ndGggXTtcbiAgICAvLyAgICBpbnQgb2Zmc2V0ID0gMDtcbiAgICAvLyAgICBpbnQgbGVuID0gKGludClpbmZvLkxlbmd0aDtcbiAgICAvLyAgICB3aGlsZSAodHJ1ZSkge1xuICAgIC8vICAgICAgICBpZiAob2Zmc2V0ID09IGluZm8uTGVuZ3RoKVxuICAgIC8vICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgIGludCBuID0gZmlsZS5SZWFkKGRhdGEsIG9mZnNldCwgKGludCkoaW5mby5MZW5ndGggLSBvZmZzZXQpKTtcbiAgICAvLyAgICAgICAgaWYgKG4gPD0gMClcbiAgICAvLyAgICAgICAgICAgIGJyZWFrO1xuICAgIC8vICAgICAgICBvZmZzZXQgKz0gbjtcbiAgICAvLyAgICB9XG4gICAgLy8gICAgcGFyc2Vfb2Zmc2V0ID0gMDtcbiAgICAvLyAgICBmaWxlLkNsb3NlKCk7XG4gICAgLy99XG5cbiAgICAvKiogQ3JlYXRlIGEgbmV3IE1pZGlGaWxlUmVhZGVyIGZyb20gdGhlIGdpdmVuIGRhdGEgKi9cbiAgICBwdWJsaWMgTWlkaUZpbGVSZWFkZXIoYnl0ZVtdIGJ5dGVzKSB7XG4gICAgICAgIGRhdGEgPSBieXRlcztcbiAgICAgICAgcGFyc2Vfb2Zmc2V0ID0gMDtcbiAgICB9XG5cbiAgICAvKiogQ2hlY2sgdGhhdCB0aGUgZ2l2ZW4gbnVtYmVyIG9mIGJ5dGVzIGRvZXNuJ3QgZXhjZWVkIHRoZSBmaWxlIHNpemUgKi9cbiAgICBwcml2YXRlIHZvaWQgY2hlY2tSZWFkKGludCBhbW91bnQpIHtcbiAgICAgICAgaWYgKHBhcnNlX29mZnNldCArIGFtb3VudCA+IGRhdGEuTGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWlkaUZpbGVFeGNlcHRpb24oXCJGaWxlIGlzIHRydW5jYXRlZFwiLCBwYXJzZV9vZmZzZXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIFJlYWQgdGhlIG5leHQgYnl0ZSBpbiB0aGUgZmlsZSwgYnV0IGRvbid0IGluY3JlbWVudCB0aGUgcGFyc2Ugb2Zmc2V0ICovXG4gICAgcHVibGljIGJ5dGUgUGVlaygpIHtcbiAgICAgICAgY2hlY2tSZWFkKDEpO1xuICAgICAgICByZXR1cm4gZGF0YVtwYXJzZV9vZmZzZXRdO1xuICAgIH1cblxuICAgIC8qKiBSZWFkIGEgYnl0ZSBmcm9tIHRoZSBmaWxlICovXG4gICAgcHVibGljIGJ5dGUgUmVhZEJ5dGUoKSB7IFxuICAgICAgICBjaGVja1JlYWQoMSk7XG4gICAgICAgIGJ5dGUgeCA9IGRhdGFbcGFyc2Vfb2Zmc2V0XTtcbiAgICAgICAgcGFyc2Vfb2Zmc2V0Kys7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cblxuICAgIC8qKiBSZWFkIHRoZSBnaXZlbiBudW1iZXIgb2YgYnl0ZXMgZnJvbSB0aGUgZmlsZSAqL1xuICAgIHB1YmxpYyBieXRlW10gUmVhZEJ5dGVzKGludCBhbW91bnQpIHtcbiAgICAgICAgY2hlY2tSZWFkKGFtb3VudCk7XG4gICAgICAgIGJ5dGVbXSByZXN1bHQgPSBuZXcgYnl0ZVthbW91bnRdO1xuICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IGFtb3VudDsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHRbaV0gPSBkYXRhW2kgKyBwYXJzZV9vZmZzZXRdO1xuICAgICAgICB9XG4gICAgICAgIHBhcnNlX29mZnNldCArPSBhbW91bnQ7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqIFJlYWQgYSAxNi1iaXQgc2hvcnQgZnJvbSB0aGUgZmlsZSAqL1xuICAgIHB1YmxpYyB1c2hvcnQgUmVhZFNob3J0KCkge1xuICAgICAgICBjaGVja1JlYWQoMik7XG4gICAgICAgIHVzaG9ydCB4ID0gKHVzaG9ydCkgKCAoZGF0YVtwYXJzZV9vZmZzZXRdIDw8IDgpIHwgZGF0YVtwYXJzZV9vZmZzZXQrMV0gKTtcbiAgICAgICAgcGFyc2Vfb2Zmc2V0ICs9IDI7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cblxuICAgIC8qKiBSZWFkIGEgMzItYml0IGludCBmcm9tIHRoZSBmaWxlICovXG4gICAgcHVibGljIGludCBSZWFkSW50KCkge1xuICAgICAgICBjaGVja1JlYWQoNCk7XG4gICAgICAgIGludCB4ID0gKGludCkoIChkYXRhW3BhcnNlX29mZnNldF0gPDwgMjQpIHwgKGRhdGFbcGFyc2Vfb2Zmc2V0KzFdIDw8IDE2KSB8XG4gICAgICAgICAgICAgICAgICAgICAgIChkYXRhW3BhcnNlX29mZnNldCsyXSA8PCA4KSB8IGRhdGFbcGFyc2Vfb2Zmc2V0KzNdICk7XG4gICAgICAgIHBhcnNlX29mZnNldCArPSA0O1xuICAgICAgICByZXR1cm4geDtcbiAgICB9XG5cbiAgICAvKiogUmVhZCBhbiBhc2NpaSBzdHJpbmcgd2l0aCB0aGUgZ2l2ZW4gbGVuZ3RoICovXG4gICAgcHVibGljIHN0cmluZyBSZWFkQXNjaWkoaW50IGxlbikge1xuICAgICAgICBjaGVja1JlYWQobGVuKTtcbiAgICAgICAgc3RyaW5nIHMgPSBBU0NJSUVuY29kaW5nLkFTQ0lJLkdldFN0cmluZyhkYXRhLCBwYXJzZV9vZmZzZXQsIGxlbik7XG4gICAgICAgIHBhcnNlX29mZnNldCArPSBsZW47XG4gICAgICAgIHJldHVybiBzO1xuICAgIH1cblxuICAgIC8qKiBSZWFkIGEgdmFyaWFibGUtbGVuZ3RoIGludGVnZXIgKDEgdG8gNCBieXRlcykuIFRoZSBpbnRlZ2VyIGVuZHNcbiAgICAgKiB3aGVuIHlvdSBlbmNvdW50ZXIgYSBieXRlIHRoYXQgZG9lc24ndCBoYXZlIHRoZSA4dGggYml0IHNldFxuICAgICAqIChhIGJ5dGUgbGVzcyB0aGFuIDB4ODApLlxuICAgICAqL1xuICAgIHB1YmxpYyBpbnQgUmVhZFZhcmxlbigpIHtcbiAgICAgICAgdWludCByZXN1bHQgPSAwO1xuICAgICAgICBieXRlIGI7XG5cbiAgICAgICAgYiA9IFJlYWRCeXRlKCk7XG4gICAgICAgIHJlc3VsdCA9ICh1aW50KShiICYgMHg3Zik7XG5cbiAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgICAgICAgIGlmICgoYiAmIDB4ODApICE9IDApIHtcbiAgICAgICAgICAgICAgICBiID0gUmVhZEJ5dGUoKTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAodWludCkoIChyZXN1bHQgPDwgNykgKyAoYiAmIDB4N2YpICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKGludClyZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqIFNraXAgb3ZlciB0aGUgZ2l2ZW4gbnVtYmVyIG9mIGJ5dGVzICovIFxuICAgIHB1YmxpYyB2b2lkIFNraXAoaW50IGFtb3VudCkge1xuICAgICAgICBjaGVja1JlYWQoYW1vdW50KTtcbiAgICAgICAgcGFyc2Vfb2Zmc2V0ICs9IGFtb3VudDtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHRoZSBjdXJyZW50IHBhcnNlIG9mZnNldCAqL1xuICAgIHB1YmxpYyBpbnQgR2V0T2Zmc2V0KCkge1xuICAgICAgICByZXR1cm4gcGFyc2Vfb2Zmc2V0O1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdGhlIHJhdyBtaWRpIGZpbGUgYnl0ZSBkYXRhICovXG4gICAgcHVibGljIGJ5dGVbXSBHZXREYXRhKCkge1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG59XG5cbn0gXG5cbiIsIi8qXHJcbiAqIENvcHlyaWdodCAoYykgMjAwNy0yMDEyIE1hZGhhdiBWYWlkeWFuYXRoYW5cclxuICpcclxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cclxuICpcclxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcbiAqL1xyXG5cclxudXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uSU87XHJcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xyXG51c2luZyBTeXN0ZW0uVGV4dDtcclxuXHJcblxyXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcclxue1xyXG5cclxuICAgIC8qKiBAY2xhc3MgTWlkaU5vdGVcclxuICAgICAqIEEgTWlkaU5vdGUgY29udGFpbnNcclxuICAgICAqXHJcbiAgICAgKiBzdGFydHRpbWUgLSBUaGUgdGltZSAobWVhc3VyZWQgaW4gcHVsc2VzKSB3aGVuIHRoZSBub3RlIGlzIHByZXNzZWQuXHJcbiAgICAgKiBjaGFubmVsICAgLSBUaGUgY2hhbm5lbCB0aGUgbm90ZSBpcyBmcm9tLiAgVGhpcyBpcyB1c2VkIHdoZW4gbWF0Y2hpbmdcclxuICAgICAqICAgICAgICAgICAgIE5vdGVPZmYgZXZlbnRzIHdpdGggdGhlIGNvcnJlc3BvbmRpbmcgTm90ZU9uIGV2ZW50LlxyXG4gICAgICogICAgICAgICAgICAgVGhlIGNoYW5uZWxzIGZvciB0aGUgTm90ZU9uIGFuZCBOb3RlT2ZmIGV2ZW50cyBtdXN0IGJlXHJcbiAgICAgKiAgICAgICAgICAgICB0aGUgc2FtZS5cclxuICAgICAqIG5vdGVudW1iZXIgLSBUaGUgbm90ZSBudW1iZXIsIGZyb20gMCB0byAxMjcuICBNaWRkbGUgQyBpcyA2MC5cclxuICAgICAqIGR1cmF0aW9uICAtIFRoZSB0aW1lIGR1cmF0aW9uIChtZWFzdXJlZCBpbiBwdWxzZXMpIGFmdGVyIHdoaWNoIHRoZSBcclxuICAgICAqICAgICAgICAgICAgIG5vdGUgaXMgcmVsZWFzZWQuXHJcbiAgICAgKlxyXG4gICAgICogQSBNaWRpTm90ZSBpcyBjcmVhdGVkIHdoZW4gd2UgZW5jb3VudGVyIGEgTm90ZU9mZiBldmVudC4gIFRoZSBkdXJhdGlvblxyXG4gICAgICogaXMgaW5pdGlhbGx5IHVua25vd24gKHNldCB0byAwKS4gIFdoZW4gdGhlIGNvcnJlc3BvbmRpbmcgTm90ZU9mZiBldmVudFxyXG4gICAgICogaXMgZm91bmQsIHRoZSBkdXJhdGlvbiBpcyBzZXQgYnkgdGhlIG1ldGhvZCBOb3RlT2ZmKCkuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBjbGFzcyBNaWRpTm90ZSA6IElDb21wYXJlcjxNaWRpTm90ZT5cclxuICAgIHtcclxuICAgICAgICBwcml2YXRlIGludCBpZDsgICAgICAgICAgLyoqIE5vdGUgSUQuIFRoaXMgY2FuIGJlIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBjbG9uZXMgYWZ0ZXIgY2FsbHMgc3VjaCBhcyBNaWRpRmlsZS5DaGFuZ2VNaWRpTm90ZXMgICovXHJcbiAgICAgICAgcHJpdmF0ZSBpbnQgc3RhcnR0aW1lOyAgIC8qKiBUaGUgc3RhcnQgdGltZSwgaW4gcHVsc2VzICovXHJcbiAgICAgICAgcHJpdmF0ZSBpbnQgY2hhbm5lbDsgICAgIC8qKiBUaGUgY2hhbm5lbCAqL1xyXG4gICAgICAgIHByaXZhdGUgaW50IG5vdGVudW1iZXI7ICAvKiogVGhlIG5vdGUsIGZyb20gMCB0byAxMjcuIE1pZGRsZSBDIGlzIDYwICovXHJcbiAgICAgICAgcHJpdmF0ZSBpbnQgZHVyYXRpb247ICAgIC8qKiBUaGUgZHVyYXRpb24sIGluIHB1bHNlcyAqL1xyXG4gICAgICAgIHByaXZhdGUgaW50IHZlbG9jaXR5OyAgICAvKiogVmVsb2NpdHkgb2YgdGhlIG5vdGUsIGZyb20gMCB0byAxMjcgKi9cclxuXHJcblxyXG4gICAgICAgIC8qIENyZWF0ZSBhIG5ldyBNaWRpTm90ZS4gIFRoaXMgaXMgY2FsbGVkIHdoZW4gYSBOb3RlT24gZXZlbnQgaXNcclxuICAgICAgICAgKiBlbmNvdW50ZXJlZCBpbiB0aGUgTWlkaUZpbGUuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHVibGljIE1pZGlOb3RlKGludCBpZCwgaW50IHN0YXJ0dGltZSwgaW50IGNoYW5uZWwsIGludCBub3RlbnVtYmVyLCBpbnQgZHVyYXRpb24sIGludCB2ZWxvY2l0eSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuaWQgPSBpZDtcclxuICAgICAgICAgICAgdGhpcy5zdGFydHRpbWUgPSBzdGFydHRpbWU7XHJcbiAgICAgICAgICAgIHRoaXMuY2hhbm5lbCA9IGNoYW5uZWw7XHJcbiAgICAgICAgICAgIHRoaXMubm90ZW51bWJlciA9IG5vdGVudW1iZXI7XHJcbiAgICAgICAgICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcclxuICAgICAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGludCBJZFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIGlkOyB9XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgcHVibGljIGludCBTdGFydFRpbWVcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdldCB7IHJldHVybiBzdGFydHRpbWU7IH1cclxuICAgICAgICAgICAgc2V0IHsgc3RhcnR0aW1lID0gdmFsdWU7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBpbnQgRW5kVGltZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIHN0YXJ0dGltZSArIGR1cmF0aW9uOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgaW50IENoYW5uZWxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdldCB7IHJldHVybiBjaGFubmVsOyB9XHJcbiAgICAgICAgICAgIHNldCB7IGNoYW5uZWwgPSB2YWx1ZTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGludCBOdW1iZXJcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdldCB7IHJldHVybiBub3RlbnVtYmVyOyB9XHJcbiAgICAgICAgICAgIHNldCB7IG5vdGVudW1iZXIgPSB2YWx1ZTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGludCBEdXJhdGlvblxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIGR1cmF0aW9uOyB9XHJcbiAgICAgICAgICAgIHNldCB7IGR1cmF0aW9uID0gdmFsdWU7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBpbnQgVmVsb2NpdHlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdldCB7IHJldHVybiB2ZWxvY2l0eTsgfVxyXG4gICAgICAgICAgICBzZXQgeyB2ZWxvY2l0eSA9IHZhbHVlOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiBBIE5vdGVPZmYgZXZlbnQgb2NjdXJzIGZvciB0aGlzIG5vdGUgYXQgdGhlIGdpdmVuIHRpbWUuXHJcbiAgICAgICAgICogQ2FsY3VsYXRlIHRoZSBub3RlIGR1cmF0aW9uIGJhc2VkIG9uIHRoZSBub3Rlb2ZmIGV2ZW50LlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHB1YmxpYyB2b2lkIE5vdGVPZmYoaW50IGVuZHRpbWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkdXJhdGlvbiA9IGVuZHRpbWUgLSBzdGFydHRpbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogQ29tcGFyZSB0d28gTWlkaU5vdGVzIGJhc2VkIG9uIHRoZWlyIHN0YXJ0IHRpbWVzLlxyXG4gICAgICAgICAqICBJZiB0aGUgc3RhcnQgdGltZXMgYXJlIGVxdWFsLCBjb21wYXJlIGJ5IHRoZWlyIG51bWJlcnMuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHVibGljIGludCBDb21wYXJlKE1pZGlOb3RlIHgsIE1pZGlOb3RlIHkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoeC5TdGFydFRpbWUgPT0geS5TdGFydFRpbWUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4geC5OdW1iZXIgLSB5Lk51bWJlcjtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHguU3RhcnRUaW1lIC0geS5TdGFydFRpbWU7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgcHVibGljIE1pZGlOb3RlIENsb25lKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWlkaU5vdGUoaWQsIHN0YXJ0dGltZSwgY2hhbm5lbCwgbm90ZW51bWJlciwgZHVyYXRpb24sIHZlbG9jaXR5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBvdmVycmlkZVxyXG4gICAgICAgIHN0cmluZyBUb1N0cmluZygpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzdHJpbmdbXSBzY2FsZSA9IHsgXCJBXCIsIFwiQSNcIiwgXCJCXCIsIFwiQ1wiLCBcIkMjXCIsIFwiRFwiLCBcIkQjXCIsIFwiRVwiLCBcIkZcIiwgXCJGI1wiLCBcIkdcIiwgXCJHI1wiIH07XHJcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmcuRm9ybWF0KFwiTWlkaU5vdGUgY2hhbm5lbD17MH0gbnVtYmVyPXsxfSB7Mn0gc3RhcnQ9ezN9IGR1cmF0aW9uPXs0fVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFubmVsLCBub3RlbnVtYmVyLCBzY2FsZVsobm90ZW51bWJlciArIDMpICUgMTJdLCBzdGFydHRpbWUsIGR1cmF0aW9uKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcblxyXG59ICAvKiBFbmQgbmFtZXNwYWNlIE1pZGlTaGVldE11c2ljICovXHJcblxyXG4iLCIvKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMyBNYWRoYXYgVmFpZHlhbmF0aGFuXHJcbiAqXHJcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXHJcbiAqXHJcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG4gKi9cclxuXHJcbnVzaW5nIFN5c3RlbTtcclxudXNpbmcgU3lzdGVtLklPO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcblxyXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xyXG5cclxuLyoqIEBjbGFzcyBNaWRpT3B0aW9uc1xyXG4gKlxyXG4gKiBUaGUgTWlkaU9wdGlvbnMgY2xhc3MgY29udGFpbnMgdGhlIGF2YWlsYWJsZSBvcHRpb25zIGZvclxyXG4gKiBtb2RpZnlpbmcgdGhlIHNoZWV0IG11c2ljIGFuZCBzb3VuZC4gIFRoZXNlIG9wdGlvbnMgYXJlXHJcbiAqIGNvbGxlY3RlZCBmcm9tIHRoZSBtZW51L2RpYWxvZyBzZXR0aW5ncywgYW5kIHRoZW4gYXJlIHBhc3NlZFxyXG4gKiB0byB0aGUgU2hlZXRNdXNpYyBhbmQgTWlkaVBsYXllciBjbGFzc2VzLlxyXG4gKi9cclxucHVibGljIGNsYXNzIE1pZGlPcHRpb25zIHtcclxuXHJcbiAgICAvLyBUaGUgcG9zc2libGUgdmFsdWVzIGZvciBzaG93Tm90ZUxldHRlcnNcclxuICAgIHB1YmxpYyBjb25zdCBpbnQgTm90ZU5hbWVOb25lICAgICAgICAgICA9IDA7XHJcbiAgICBwdWJsaWMgY29uc3QgaW50IE5vdGVOYW1lTGV0dGVyICAgICAgICAgPSAxO1xyXG4gICAgcHVibGljIGNvbnN0IGludCBOb3RlTmFtZUZpeGVkRG9SZU1pICAgID0gMjtcclxuICAgIHB1YmxpYyBjb25zdCBpbnQgTm90ZU5hbWVNb3ZhYmxlRG9SZU1pICA9IDM7XHJcbiAgICBwdWJsaWMgY29uc3QgaW50IE5vdGVOYW1lRml4ZWROdW1iZXIgICAgPSA0O1xyXG4gICAgcHVibGljIGNvbnN0IGludCBOb3RlTmFtZU1vdmFibGVOdW1iZXIgID0gNTtcclxuXHJcbiAgICAvLyBTaGVldCBNdXNpYyBPcHRpb25zXHJcbiAgICBwdWJsaWMgc3RyaW5nIGZpbGVuYW1lOyAgICAgICAvKiogVGhlIGZ1bGwgTWlkaSBmaWxlbmFtZSAqL1xyXG4gICAgcHVibGljIHN0cmluZyB0aXRsZTsgICAgICAgICAgLyoqIFRoZSBNaWRpIHNvbmcgdGl0bGUgKi9cclxuICAgIHB1YmxpYyBib29sW10gdHJhY2tzOyAgICAgICAgIC8qKiBXaGljaCB0cmFja3MgdG8gZGlzcGxheSAodHJ1ZSA9IGRpc3BsYXkpICovXHJcbiAgICBwdWJsaWMgYm9vbCBzY3JvbGxWZXJ0OyAgICAgICAvKiogV2hldGhlciB0byBzY3JvbGwgdmVydGljYWxseSBvciBob3Jpem9udGFsbHkgKi9cclxuICAgIHB1YmxpYyBib29sIGxhcmdlTm90ZVNpemU7ICAgIC8qKiBEaXNwbGF5IGxhcmdlIG9yIHNtYWxsIG5vdGUgc2l6ZXMgKi9cclxuICAgIHB1YmxpYyBib29sIHR3b1N0YWZmczsgICAgICAgIC8qKiBDb21iaW5lIHRyYWNrcyBpbnRvIHR3byBzdGFmZnMgPyAqL1xyXG4gICAgcHVibGljIGludCBzaG93Tm90ZUxldHRlcnM7ICAgICAvKiogU2hvdyB0aGUgbmFtZSAoQSwgQSMsIGV0YykgbmV4dCB0byB0aGUgbm90ZXMgKi9cclxuICAgIHB1YmxpYyBib29sIHNob3dMeXJpY3M7ICAgICAgIC8qKiBTaG93IHRoZSBseXJpY3MgdW5kZXIgZWFjaCBub3RlICovXHJcbiAgICBwdWJsaWMgYm9vbCBzaG93TWVhc3VyZXM7ICAgICAvKiogU2hvdyB0aGUgbWVhc3VyZSBudW1iZXJzIGZvciBlYWNoIHN0YWZmICovXHJcbiAgICBwdWJsaWMgaW50IHNoaWZ0dGltZTsgICAgICAgICAvKiogU2hpZnQgbm90ZSBzdGFydHRpbWVzIGJ5IHRoZSBnaXZlbiBhbW91bnQgKi9cclxuICAgIHB1YmxpYyBpbnQgdHJhbnNwb3NlOyAgICAgICAgIC8qKiBTaGlmdCBub3RlIGtleSB1cC9kb3duIGJ5IGdpdmVuIGFtb3VudCAqL1xyXG4gICAgcHVibGljIGludCBrZXk7ICAgICAgICAgICAgICAgLyoqIFVzZSB0aGUgZ2l2ZW4gS2V5U2lnbmF0dXJlIChub3Rlc2NhbGUpICovXHJcbiAgICBwdWJsaWMgVGltZVNpZ25hdHVyZSB0aW1lOyAgICAvKiogVXNlIHRoZSBnaXZlbiB0aW1lIHNpZ25hdHVyZSAqL1xyXG4gICAgcHVibGljIGludCBjb21iaW5lSW50ZXJ2YWw7ICAgLyoqIENvbWJpbmUgbm90ZXMgd2l0aGluIGdpdmVuIHRpbWUgaW50ZXJ2YWwgKG1zZWMpICovXHJcbiAgICBwdWJsaWMgQ29sb3JbXSBjb2xvcnM7ICAgICAgICAvKiogVGhlIG5vdGUgY29sb3JzIHRvIHVzZSAqL1xyXG4gICAgcHVibGljIENvbG9yIHNoYWRlQ29sb3I7ICAgICAgLyoqIFRoZSBjb2xvciB0byB1c2UgZm9yIHNoYWRpbmcuICovXHJcbiAgICBwdWJsaWMgQ29sb3Igc2hhZGUyQ29sb3I7ICAgICAvKiogVGhlIGNvbG9yIHRvIHVzZSBmb3Igc2hhZGluZyB0aGUgbGVmdCBoYW5kIHBpYW5vICovXHJcblxyXG4gICAgLy8gU291bmQgb3B0aW9uc1xyXG4gICAgcHVibGljIGJvb2wgW11tdXRlOyAgICAgICAgICAgIC8qKiBXaGljaCB0cmFja3MgdG8gbXV0ZSAodHJ1ZSA9IG11dGUpICovXHJcbiAgICBwdWJsaWMgaW50IHRlbXBvOyAgICAgICAgICAgICAgLyoqIFRoZSB0ZW1wbywgaW4gbWljcm9zZWNvbmRzIHBlciBxdWFydGVyIG5vdGUgKi9cclxuICAgIHB1YmxpYyBpbnQgcGF1c2VUaW1lOyAgICAgICAgICAvKiogU3RhcnQgdGhlIG1pZGkgbXVzaWMgYXQgdGhlIGdpdmVuIHBhdXNlIHRpbWUgKi9cclxuICAgIHB1YmxpYyBpbnRbXSBpbnN0cnVtZW50czsgICAgICAvKiogVGhlIGluc3RydW1lbnRzIHRvIHVzZSBwZXIgdHJhY2sgKi9cclxuICAgIHB1YmxpYyBib29sIHVzZURlZmF1bHRJbnN0cnVtZW50czsgIC8qKiBJZiB0cnVlLCBkb24ndCBjaGFuZ2UgaW5zdHJ1bWVudHMgKi9cclxuICAgIHB1YmxpYyBib29sIHBsYXlNZWFzdXJlc0luTG9vcDsgICAgIC8qKiBQbGF5IHRoZSBzZWxlY3RlZCBtZWFzdXJlcyBpbiBhIGxvb3AgKi9cclxuICAgIHB1YmxpYyBpbnQgcGxheU1lYXN1cmVzSW5Mb29wU3RhcnQ7IC8qKiBTdGFydCBtZWFzdXJlIHRvIHBsYXkgaW4gbG9vcCAqL1xyXG4gICAgcHVibGljIGludCBwbGF5TWVhc3VyZXNJbkxvb3BFbmQ7ICAgLyoqIEVuZCBtZWFzdXJlIHRvIHBsYXkgaW4gbG9vcCAqL1xyXG5cclxuXHJcbiAgICBwdWJsaWMgTWlkaU9wdGlvbnMoKSB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIE1pZGlPcHRpb25zKE1pZGlGaWxlIG1pZGlmaWxlKSB7XHJcbiAgICAgICAgZmlsZW5hbWUgPSBtaWRpZmlsZS5GaWxlTmFtZTtcclxuICAgICAgICB0aXRsZSA9IFBhdGguR2V0RmlsZU5hbWUobWlkaWZpbGUuRmlsZU5hbWUpO1xyXG4gICAgICAgIGludCBudW10cmFja3MgPSBtaWRpZmlsZS5UcmFja3MuQ291bnQ7XHJcbiAgICAgICAgdHJhY2tzID0gbmV3IGJvb2xbbnVtdHJhY2tzXTtcclxuICAgICAgICBtdXRlID0gIG5ldyBib29sW251bXRyYWNrc107XHJcbiAgICAgICAgaW5zdHJ1bWVudHMgPSBuZXcgaW50W251bXRyYWNrc107XHJcbiAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCB0cmFja3MuTGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdHJhY2tzW2ldID0gdHJ1ZTtcclxuICAgICAgICAgICAgbXV0ZVtpXSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpbnN0cnVtZW50c1tpXSA9IG1pZGlmaWxlLlRyYWNrc1tpXS5JbnN0cnVtZW50O1xyXG4gICAgICAgICAgICBpZiAobWlkaWZpbGUuVHJhY2tzW2ldLkluc3RydW1lbnROYW1lID09IFwiUGVyY3Vzc2lvblwiKSB7XHJcbiAgICAgICAgICAgICAgICB0cmFja3NbaV0gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIG11dGVbaV0gPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBcclxuICAgICAgICB1c2VEZWZhdWx0SW5zdHJ1bWVudHMgPSB0cnVlO1xyXG4gICAgICAgIHNjcm9sbFZlcnQgPSB0cnVlO1xyXG4gICAgICAgIGxhcmdlTm90ZVNpemUgPSBmYWxzZTtcclxuICAgICAgICBpZiAodHJhY2tzLkxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgIHR3b1N0YWZmcyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0d29TdGFmZnMgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2hvd05vdGVMZXR0ZXJzID0gTm90ZU5hbWVOb25lO1xyXG4gICAgICAgIHNob3dMeXJpY3MgPSB0cnVlO1xyXG4gICAgICAgIHNob3dNZWFzdXJlcyA9IGZhbHNlO1xyXG4gICAgICAgIHNoaWZ0dGltZSA9IDA7XHJcbiAgICAgICAgdHJhbnNwb3NlID0gMDtcclxuICAgICAgICBrZXkgPSAtMTtcclxuICAgICAgICB0aW1lID0gbWlkaWZpbGUuVGltZTtcclxuICAgICAgICBjb2xvcnMgPSBudWxsO1xyXG4gICAgICAgIHNoYWRlQ29sb3IgPSBDb2xvci5Gcm9tQXJnYigxMDAsIDUzLCAxMjMsIDI1NSk7XHJcbiAgICAgICAgc2hhZGUyQ29sb3IgPSBDb2xvci5Gcm9tUmdiKDgwLCAxMDAsIDI1MCk7XHJcbiAgICAgICAgY29tYmluZUludGVydmFsID0gNDA7XHJcbiAgICAgICAgdGVtcG8gPSBtaWRpZmlsZS5UaW1lLlRlbXBvO1xyXG4gICAgICAgIHBhdXNlVGltZSA9IDA7XHJcbiAgICAgICAgcGxheU1lYXN1cmVzSW5Mb29wID0gZmFsc2U7IFxyXG4gICAgICAgIHBsYXlNZWFzdXJlc0luTG9vcFN0YXJ0ID0gMDtcclxuICAgICAgICBwbGF5TWVhc3VyZXNJbkxvb3BFbmQgPSBtaWRpZmlsZS5FbmRUaW1lKCkgLyBtaWRpZmlsZS5UaW1lLk1lYXN1cmU7XHJcbiAgICB9XHJcblxyXG4gICAgLyogSm9pbiB0aGUgYXJyYXkgaW50byBhIGNvbW1hIHNlcGFyYXRlZCBzdHJpbmcgKi9cclxuICAgIHN0YXRpYyBzdHJpbmcgSm9pbihib29sW10gdmFsdWVzKSB7XHJcbiAgICAgICAgU3RyaW5nQnVpbGRlciByZXN1bHQgPSBuZXcgU3RyaW5nQnVpbGRlcigpO1xyXG4gICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgdmFsdWVzLkxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChpID4gMCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LkFwcGVuZChcIixcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzdWx0LkFwcGVuZCh2YWx1ZXNbaV0uVG9TdHJpbmcoKSk7IFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0LlRvU3RyaW5nKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHN0cmluZyBKb2luKGludFtdIHZhbHVlcykge1xyXG4gICAgICAgIFN0cmluZ0J1aWxkZXIgcmVzdWx0ID0gbmV3IFN0cmluZ0J1aWxkZXIoKTtcclxuICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IHZhbHVlcy5MZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoaSA+IDApIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5BcHBlbmQoXCIsXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc3VsdC5BcHBlbmQodmFsdWVzW2ldLlRvU3RyaW5nKCkpOyBcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5Ub1N0cmluZygpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBzdHJpbmcgSm9pbihDb2xvcltdIHZhbHVlcykge1xyXG4gICAgICAgIFN0cmluZ0J1aWxkZXIgcmVzdWx0ID0gbmV3IFN0cmluZ0J1aWxkZXIoKTtcclxuICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IHZhbHVlcy5MZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoaSA+IDApIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5BcHBlbmQoXCIsXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc3VsdC5BcHBlbmQoQ29sb3JUb1N0cmluZyh2YWx1ZXNbaV0pKTsgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQuVG9TdHJpbmcoKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgc3RyaW5nIENvbG9yVG9TdHJpbmcoQ29sb3IgYykge1xyXG4gICAgICAgIHJldHVybiBcIlwiICsgYy5SICsgXCIgXCIgKyBjLkcgKyBcIiBcIiArIGMuQjtcclxuICAgIH1cclxuXHJcbiAgICBcclxuICAgIC8qIE1lcmdlIGluIHRoZSBzYXZlZCBvcHRpb25zIHRvIHRoaXMgTWlkaU9wdGlvbnMuKi9cclxuICAgIHB1YmxpYyB2b2lkIE1lcmdlKE1pZGlPcHRpb25zIHNhdmVkKSB7XHJcbiAgICAgICAgaWYgKHNhdmVkLnRyYWNrcyAhPSBudWxsICYmIHNhdmVkLnRyYWNrcy5MZW5ndGggPT0gdHJhY2tzLkxlbmd0aCkge1xyXG4gICAgICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IHRyYWNrcy5MZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdHJhY2tzW2ldID0gc2F2ZWQudHJhY2tzW2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzYXZlZC5tdXRlICE9IG51bGwgJiYgc2F2ZWQubXV0ZS5MZW5ndGggPT0gbXV0ZS5MZW5ndGgpIHtcclxuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCBtdXRlLkxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBtdXRlW2ldID0gc2F2ZWQubXV0ZVtpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc2F2ZWQuaW5zdHJ1bWVudHMgIT0gbnVsbCAmJiBzYXZlZC5pbnN0cnVtZW50cy5MZW5ndGggPT0gaW5zdHJ1bWVudHMuTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgaW5zdHJ1bWVudHMuTGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGluc3RydW1lbnRzW2ldID0gc2F2ZWQuaW5zdHJ1bWVudHNbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHNhdmVkLnRpbWUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aW1lID0gbmV3IFRpbWVTaWduYXR1cmUoc2F2ZWQudGltZS5OdW1lcmF0b3IsIHNhdmVkLnRpbWUuRGVub21pbmF0b3IsXHJcbiAgICAgICAgICAgICAgICAgICAgc2F2ZWQudGltZS5RdWFydGVyLCBzYXZlZC50aW1lLlRlbXBvKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdXNlRGVmYXVsdEluc3RydW1lbnRzID0gc2F2ZWQudXNlRGVmYXVsdEluc3RydW1lbnRzO1xyXG4gICAgICAgIHNjcm9sbFZlcnQgPSBzYXZlZC5zY3JvbGxWZXJ0O1xyXG4gICAgICAgIGxhcmdlTm90ZVNpemUgPSBzYXZlZC5sYXJnZU5vdGVTaXplO1xyXG4gICAgICAgIHNob3dMeXJpY3MgPSBzYXZlZC5zaG93THlyaWNzO1xyXG4gICAgICAgIHR3b1N0YWZmcyA9IHNhdmVkLnR3b1N0YWZmcztcclxuICAgICAgICBzaG93Tm90ZUxldHRlcnMgPSBzYXZlZC5zaG93Tm90ZUxldHRlcnM7XHJcbiAgICAgICAgdHJhbnNwb3NlID0gc2F2ZWQudHJhbnNwb3NlO1xyXG4gICAgICAgIGtleSA9IHNhdmVkLmtleTtcclxuICAgICAgICBjb21iaW5lSW50ZXJ2YWwgPSBzYXZlZC5jb21iaW5lSW50ZXJ2YWw7XHJcbiAgICAgICAgaWYgKHNhdmVkLnNoYWRlQ29sb3IgIT0gQ29sb3IuV2hpdGUpIHtcclxuICAgICAgICAgICAgc2hhZGVDb2xvciA9IHNhdmVkLnNoYWRlQ29sb3I7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzYXZlZC5zaGFkZTJDb2xvciAhPSBDb2xvci5XaGl0ZSkge1xyXG4gICAgICAgICAgICBzaGFkZTJDb2xvciA9IHNhdmVkLnNoYWRlMkNvbG9yO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc2F2ZWQuY29sb3JzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgY29sb3JzID0gc2F2ZWQuY29sb3JzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzaG93TWVhc3VyZXMgPSBzYXZlZC5zaG93TWVhc3VyZXM7XHJcbiAgICAgICAgcGxheU1lYXN1cmVzSW5Mb29wID0gc2F2ZWQucGxheU1lYXN1cmVzSW5Mb29wO1xyXG4gICAgICAgIHBsYXlNZWFzdXJlc0luTG9vcFN0YXJ0ID0gc2F2ZWQucGxheU1lYXN1cmVzSW5Mb29wU3RhcnQ7XHJcbiAgICAgICAgcGxheU1lYXN1cmVzSW5Mb29wRW5kID0gc2F2ZWQucGxheU1lYXN1cmVzSW5Mb29wRW5kO1xyXG4gICAgfVxyXG59XHJcblxyXG59XHJcblxyXG5cclxuIiwiLypcclxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTIgTWFkaGF2IFZhaWR5YW5hdGhhblxyXG4gKlxyXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxyXG4gKlxyXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gKiAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuICovXHJcblxyXG51c2luZyBTeXN0ZW07XHJcbnVzaW5nIFN5c3RlbS5JTztcclxudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XHJcbnVzaW5nIFN5c3RlbS5UZXh0O1xyXG5cclxuXHJcbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY1xyXG57XHJcblxyXG4gICAgLyoqIEBjbGFzcyBNaWRpVHJhY2tcclxuICAgICAqIFRoZSBNaWRpVHJhY2sgdGFrZXMgYXMgaW5wdXQgdGhlIHJhdyBNaWRpRXZlbnRzIGZvciB0aGUgdHJhY2ssIGFuZCBnZXRzOlxyXG4gICAgICogLSBUaGUgbGlzdCBvZiBtaWRpIG5vdGVzIGluIHRoZSB0cmFjay5cclxuICAgICAqIC0gVGhlIGZpcnN0IGluc3RydW1lbnQgdXNlZCBpbiB0aGUgdHJhY2suXHJcbiAgICAgKlxyXG4gICAgICogRm9yIGVhY2ggTm90ZU9uIGV2ZW50IGluIHRoZSBtaWRpIGZpbGUsIGEgbmV3IE1pZGlOb3RlIGlzIGNyZWF0ZWRcclxuICAgICAqIGFuZCBhZGRlZCB0byB0aGUgdHJhY2ssIHVzaW5nIHRoZSBBZGROb3RlKCkgbWV0aG9kLlxyXG4gICAgICogXHJcbiAgICAgKiBUaGUgTm90ZU9mZigpIG1ldGhvZCBpcyBjYWxsZWQgd2hlbiBhIE5vdGVPZmYgZXZlbnQgaXMgZW5jb3VudGVyZWQsXHJcbiAgICAgKiBpbiBvcmRlciB0byB1cGRhdGUgdGhlIGR1cmF0aW9uIG9mIHRoZSBNaWRpTm90ZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGNsYXNzIE1pZGlUcmFja1xyXG4gICAge1xyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIGludCBub3RlSWRDb3VudGVyID0gMDsgLyoqIENvdW50ZXIgdXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgbm90ZSBJRHMgKi9cclxuICAgICAgICBwcml2YXRlIGludCB0cmFja251bTsgICAgICAgICAgICAgLyoqIFRoZSB0cmFjayBudW1iZXIgKi9cclxuICAgICAgICBwcml2YXRlIExpc3Q8TWlkaU5vdGU+IG5vdGVzOyAgICAgLyoqIExpc3Qgb2YgTWlkaSBub3RlcyAqL1xyXG4gICAgICAgIHByaXZhdGUgaW50IGluc3RydW1lbnQ7ICAgICAgICAgICAvKiogSW5zdHJ1bWVudCBmb3IgdGhpcyB0cmFjayAqL1xyXG4gICAgICAgIHByaXZhdGUgTGlzdDxNaWRpRXZlbnQ+IGx5cmljczsgICAvKiogVGhlIGx5cmljcyBpbiB0aGlzIHRyYWNrICovXHJcblxyXG4gICAgICAgIC8qKiBDcmVhdGUgYW4gZW1wdHkgTWlkaVRyYWNrLiAgVXNlZCBieSB0aGUgQ2xvbmUgbWV0aG9kICovXHJcbiAgICAgICAgcHVibGljIE1pZGlUcmFjayhpbnQgdHJhY2tudW0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnRyYWNrbnVtID0gdHJhY2tudW07XHJcbiAgICAgICAgICAgIG5vdGVzID0gbmV3IExpc3Q8TWlkaU5vdGU+KDIwKTtcclxuICAgICAgICAgICAgaW5zdHJ1bWVudCA9IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogQ3JlYXRlIGEgTWlkaVRyYWNrIGJhc2VkIG9uIHRoZSBNaWRpIGV2ZW50cy4gIEV4dHJhY3QgdGhlIE5vdGVPbi9Ob3RlT2ZmXHJcbiAgICAgICAgICogIGV2ZW50cyB0byBnYXRoZXIgdGhlIGxpc3Qgb2YgTWlkaU5vdGVzLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHB1YmxpYyBNaWRpVHJhY2soTGlzdDxNaWRpRXZlbnQ+IGV2ZW50cywgaW50IHRyYWNrbnVtKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy50cmFja251bSA9IHRyYWNrbnVtO1xyXG4gICAgICAgICAgICBub3RlcyA9IG5ldyBMaXN0PE1pZGlOb3RlPihldmVudHMuQ291bnQpO1xyXG4gICAgICAgICAgICBpbnN0cnVtZW50ID0gMDtcclxuXHJcbiAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlFdmVudCBtZXZlbnQgaW4gZXZlbnRzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAobWV2ZW50LkV2ZW50RmxhZyA9PSBNaWRpRmlsZS5FdmVudE5vdGVPbiAmJiBtZXZlbnQuVmVsb2NpdHkgPiAwKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIE1pZGlOb3RlIG5vdGUgPSBuZXcgTWlkaU5vdGUobm90ZUlkQ291bnRlcisrLCBtZXZlbnQuU3RhcnRUaW1lLCBtZXZlbnQuQ2hhbm5lbCwgbWV2ZW50Lk5vdGVudW1iZXIsIDAsIG1ldmVudC5WZWxvY2l0eSk7XHJcbiAgICAgICAgICAgICAgICAgICAgQWRkTm90ZShub3RlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gTWlkaUZpbGUuRXZlbnROb3RlT24gJiYgbWV2ZW50LlZlbG9jaXR5ID09IDApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgTm90ZU9mZihtZXZlbnQuQ2hhbm5lbCwgbWV2ZW50Lk5vdGVudW1iZXIsIG1ldmVudC5TdGFydFRpbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobWV2ZW50LkV2ZW50RmxhZyA9PSBNaWRpRmlsZS5FdmVudE5vdGVPZmYpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgTm90ZU9mZihtZXZlbnQuQ2hhbm5lbCwgbWV2ZW50Lk5vdGVudW1iZXIsIG1ldmVudC5TdGFydFRpbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobWV2ZW50LkV2ZW50RmxhZyA9PSBNaWRpRmlsZS5FdmVudFByb2dyYW1DaGFuZ2UpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5zdHJ1bWVudCA9IG1ldmVudC5JbnN0cnVtZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobWV2ZW50Lk1ldGFldmVudCA9PSBNaWRpRmlsZS5NZXRhRXZlbnRMeXJpYylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBBZGRMeXJpYyhtZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChub3Rlcy5Db3VudCA+IDAgJiYgbm90ZXNbMF0uQ2hhbm5lbCA9PSA5KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpbnN0cnVtZW50ID0gMTI4OyAgLyogUGVyY3Vzc2lvbiAqL1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGludCBseXJpY2NvdW50ID0gMDtcclxuICAgICAgICAgICAgaWYgKGx5cmljcyAhPSBudWxsKSB7IGx5cmljY291bnQgPSBseXJpY3MuQ291bnQ7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBpbnQgTnVtYmVyXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBnZXQgeyByZXR1cm4gdHJhY2tudW07IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBMaXN0PE1pZGlOb3RlPiBOb3Rlc1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIG5vdGVzOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgaW50IEluc3RydW1lbnRcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdldCB7IHJldHVybiBpbnN0cnVtZW50OyB9XHJcbiAgICAgICAgICAgIHNldCB7IGluc3RydW1lbnQgPSB2YWx1ZTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0cmluZyBJbnN0cnVtZW50TmFtZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ2V0XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChpbnN0cnVtZW50ID49IDAgJiYgaW5zdHJ1bWVudCA8PSAxMjgpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1pZGlGaWxlLkluc3RydW1lbnRzW2luc3RydW1lbnRdO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgTGlzdDxNaWRpRXZlbnQ+IEx5cmljc1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIGx5cmljczsgfVxyXG4gICAgICAgICAgICBzZXQgeyBseXJpY3MgPSB2YWx1ZTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEFkZCBhIE1pZGlOb3RlIHRvIHRoaXMgdHJhY2suICBUaGlzIGlzIGNhbGxlZCBmb3IgZWFjaCBOb3RlT24gZXZlbnQgKi9cclxuICAgICAgICBwdWJsaWMgdm9pZCBBZGROb3RlKE1pZGlOb3RlIG0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBub3Rlcy5BZGQobSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogQSBOb3RlT2ZmIGV2ZW50IG9jY3VyZWQuICBGaW5kIHRoZSBNaWRpTm90ZSBvZiB0aGUgY29ycmVzcG9uZGluZ1xyXG4gICAgICAgICAqIE5vdGVPbiBldmVudCwgYW5kIHVwZGF0ZSB0aGUgZHVyYXRpb24gb2YgdGhlIE1pZGlOb3RlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHB1YmxpYyB2b2lkIE5vdGVPZmYoaW50IGNoYW5uZWwsIGludCBub3RlbnVtYmVyLCBpbnQgZW5kdGltZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAoaW50IGkgPSBub3Rlcy5Db3VudCAtIDE7IGkgPj0gMDsgaS0tKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBNaWRpTm90ZSBub3RlID0gbm90ZXNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAobm90ZS5DaGFubmVsID09IGNoYW5uZWwgJiYgbm90ZS5OdW1iZXIgPT0gbm90ZW51bWJlciAmJlxyXG4gICAgICAgICAgICAgICAgICAgIG5vdGUuRHVyYXRpb24gPT0gMClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBub3RlLk5vdGVPZmYoZW5kdGltZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogQWRkIGEgTHlyaWMgTWlkaUV2ZW50ICovXHJcbiAgICAgICAgcHVibGljIHZvaWQgQWRkTHlyaWMoTWlkaUV2ZW50IG1ldmVudClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChseXJpY3MgPT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbHlyaWNzID0gbmV3IExpc3Q8TWlkaUV2ZW50PigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGx5cmljcy5BZGQobWV2ZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBSZXR1cm4gYSBkZWVwIGNvcHkgY2xvbmUgb2YgdGhpcyBNaWRpVHJhY2suICovXHJcbiAgICAgICAgcHVibGljIE1pZGlUcmFjayBDbG9uZSgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBNaWRpVHJhY2sgdHJhY2sgPSBuZXcgTWlkaVRyYWNrKE51bWJlcik7XHJcbiAgICAgICAgICAgIHRyYWNrLmluc3RydW1lbnQgPSBpbnN0cnVtZW50O1xyXG4gICAgICAgICAgICBmb3JlYWNoIChNaWRpTm90ZSBub3RlIGluIG5vdGVzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0cmFjay5ub3Rlcy5BZGQobm90ZS5DbG9uZSgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAobHlyaWNzICE9IG51bGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRyYWNrLmx5cmljcyA9IG5ldyBMaXN0PE1pZGlFdmVudD4oKTtcclxuICAgICAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlFdmVudCBldiBpbiBseXJpY3MpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJhY2subHlyaWNzLkFkZChldik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRyYWNrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgb3ZlcnJpZGUgc3RyaW5nIFRvU3RyaW5nKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0cmluZyByZXN1bHQgPSBcIlRyYWNrIG51bWJlcj1cIiArIHRyYWNrbnVtICsgXCIgaW5zdHJ1bWVudD1cIiArIGluc3RydW1lbnQgKyBcIlxcblwiO1xyXG4gICAgICAgICAgICBmb3JlYWNoIChNaWRpTm90ZSBuIGluIG5vdGVzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQgKyBuICsgXCJcXG5cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHQgKz0gXCJFbmQgVHJhY2tcXG5cIjtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTEgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xuXG4vKiogRW51bWVyYXRpb24gb2YgdGhlIG5vdGVzIGluIGEgc2NhbGUgKEEsIEEjLCAuLi4gRyMpICovXG5wdWJsaWMgY2xhc3MgTm90ZVNjYWxlIHtcbiAgICBwdWJsaWMgY29uc3QgaW50IEEgICAgICA9IDA7XG4gICAgcHVibGljIGNvbnN0IGludCBBc2hhcnAgPSAxO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgQmZsYXQgID0gMTtcbiAgICBwdWJsaWMgY29uc3QgaW50IEIgICAgICA9IDI7XG4gICAgcHVibGljIGNvbnN0IGludCBDICAgICAgPSAzO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgQ3NoYXJwID0gNDtcbiAgICBwdWJsaWMgY29uc3QgaW50IERmbGF0ICA9IDQ7XG4gICAgcHVibGljIGNvbnN0IGludCBEICAgICAgPSA1O1xuICAgIHB1YmxpYyBjb25zdCBpbnQgRHNoYXJwID0gNjtcbiAgICBwdWJsaWMgY29uc3QgaW50IEVmbGF0ICA9IDY7XG4gICAgcHVibGljIGNvbnN0IGludCBFICAgICAgPSA3O1xuICAgIHB1YmxpYyBjb25zdCBpbnQgRiAgICAgID0gODtcbiAgICBwdWJsaWMgY29uc3QgaW50IEZzaGFycCA9IDk7XG4gICAgcHVibGljIGNvbnN0IGludCBHZmxhdCAgPSA5O1xuICAgIHB1YmxpYyBjb25zdCBpbnQgRyAgICAgID0gMTA7XG4gICAgcHVibGljIGNvbnN0IGludCBHc2hhcnAgPSAxMTtcbiAgICBwdWJsaWMgY29uc3QgaW50IEFmbGF0ICA9IDExO1xuXG4gICAgLyoqIENvbnZlcnQgYSBub3RlIChBLCBBIywgQiwgZXRjKSBhbmQgb2N0YXZlIGludG8gYVxuICAgICAqIE1pZGkgTm90ZSBudW1iZXIuXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBpbnQgVG9OdW1iZXIoaW50IG5vdGVzY2FsZSwgaW50IG9jdGF2ZSkge1xuICAgICAgICByZXR1cm4gOSArIG5vdGVzY2FsZSArIG9jdGF2ZSAqIDEyO1xuICAgIH1cblxuICAgIC8qKiBDb252ZXJ0IGEgTWlkaSBub3RlIG51bWJlciBpbnRvIGEgbm90ZXNjYWxlIChBLCBBIywgQikgKi9cbiAgICBwdWJsaWMgc3RhdGljIGludCBGcm9tTnVtYmVyKGludCBudW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIChudW1iZXIgKyAzKSAlIDEyO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdHJ1ZSBpZiB0aGlzIG5vdGVzY2FsZSBudW1iZXIgaXMgYSBibGFjayBrZXkgKi9cbiAgICBwdWJsaWMgc3RhdGljIGJvb2wgSXNCbGFja0tleShpbnQgbm90ZXNjYWxlKSB7XG4gICAgICAgIGlmIChub3Rlc2NhbGUgPT0gQXNoYXJwIHx8XG4gICAgICAgICAgICBub3Rlc2NhbGUgPT0gQ3NoYXJwIHx8XG4gICAgICAgICAgICBub3Rlc2NhbGUgPT0gRHNoYXJwIHx8XG4gICAgICAgICAgICBub3Rlc2NhbGUgPT0gRnNoYXJwIHx8XG4gICAgICAgICAgICBub3Rlc2NhbGUgPT0gR3NoYXJwKSB7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cbi8qKiBAY2xhc3MgV2hpdGVOb3RlXG4gKiBUaGUgV2hpdGVOb3RlIGNsYXNzIHJlcHJlc2VudHMgYSB3aGl0ZSBrZXkgbm90ZSwgYSBub24tc2hhcnAsXG4gKiBub24tZmxhdCBub3RlLiAgVG8gZGlzcGxheSBtaWRpIG5vdGVzIGFzIHNoZWV0IG11c2ljLCB0aGUgbm90ZXNcbiAqIG11c3QgYmUgY29udmVydGVkIHRvIHdoaXRlIG5vdGVzIGFuZCBhY2NpZGVudGFscy4gXG4gKlxuICogV2hpdGUgbm90ZXMgY29uc2lzdCBvZiBhIGxldHRlciAoQSB0aHJ1IEcpIGFuZCBhbiBvY3RhdmUgKDAgdGhydSAxMCkuXG4gKiBUaGUgb2N0YXZlIGNoYW5nZXMgZnJvbSBHIHRvIEEuICBBZnRlciBHMiBjb21lcyBBMy4gIE1pZGRsZS1DIGlzIEM0LlxuICpcbiAqIFRoZSBtYWluIG9wZXJhdGlvbnMgYXJlIGNhbGN1bGF0aW5nIGRpc3RhbmNlcyBiZXR3ZWVuIG5vdGVzLCBhbmQgY29tcGFyaW5nIG5vdGVzLlxuICovIFxuXG5wdWJsaWMgY2xhc3MgV2hpdGVOb3RlIDogSUNvbXBhcmVyPFdoaXRlTm90ZT4ge1xuXG4gICAgLyogVGhlIHBvc3NpYmxlIG5vdGUgbGV0dGVycyAqL1xuICAgIHB1YmxpYyBjb25zdCBpbnQgQSA9IDA7XG4gICAgcHVibGljIGNvbnN0IGludCBCID0gMTtcbiAgICBwdWJsaWMgY29uc3QgaW50IEMgPSAyO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgRCA9IDM7XG4gICAgcHVibGljIGNvbnN0IGludCBFID0gNDtcbiAgICBwdWJsaWMgY29uc3QgaW50IEYgPSA1O1xuICAgIHB1YmxpYyBjb25zdCBpbnQgRyA9IDY7XG5cbiAgICAvKiBDb21tb24gd2hpdGUgbm90ZXMgdXNlZCBpbiBjYWxjdWxhdGlvbnMgKi9cbiAgICBwdWJsaWMgc3RhdGljIFdoaXRlTm90ZSBUb3BUcmVibGUgPSBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5FLCA1KTtcbiAgICBwdWJsaWMgc3RhdGljIFdoaXRlTm90ZSBCb3R0b21UcmVibGUgPSBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5GLCA0KTtcbiAgICBwdWJsaWMgc3RhdGljIFdoaXRlTm90ZSBUb3BCYXNzID0gbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRywgMyk7XG4gICAgcHVibGljIHN0YXRpYyBXaGl0ZU5vdGUgQm90dG9tQmFzcyA9IG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkEsIDMpO1xuICAgIHB1YmxpYyBzdGF0aWMgV2hpdGVOb3RlIE1pZGRsZUMgPSBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5DLCA0KTtcblxuICAgIHByaXZhdGUgaW50IGxldHRlcjsgIC8qIFRoZSBsZXR0ZXIgb2YgdGhlIG5vdGUsIEEgdGhydSBHICovXG4gICAgcHJpdmF0ZSBpbnQgb2N0YXZlOyAgLyogVGhlIG9jdGF2ZSwgMCB0aHJ1IDEwLiAqL1xuXG4gICAgLyogR2V0IHRoZSBsZXR0ZXIgKi9cbiAgICBwdWJsaWMgaW50IExldHRlciB7XG4gICAgICAgIGdldCB7IHJldHVybiBsZXR0ZXI7IH1cbiAgICB9XG5cbiAgICAvKiBHZXQgdGhlIG9jdGF2ZSAqL1xuICAgIHB1YmxpYyBpbnQgT2N0YXZlIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIG9jdGF2ZTsgfVxuICAgIH1cblxuXG4gICAgLyoqIENyZWF0ZSBhIG5ldyBub3RlIHdpdGggdGhlIGdpdmVuIGxldHRlciBhbmQgb2N0YXZlLiAqL1xuICAgIHB1YmxpYyBXaGl0ZU5vdGUoaW50IGxldHRlciwgaW50IG9jdGF2ZSkge1xuICAgICAgICBpZiAoIShsZXR0ZXIgPj0gMCAmJiBsZXR0ZXIgPD0gNikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBTeXN0ZW0uQXJndW1lbnRFeGNlcHRpb24oXCJMZXR0ZXIgXCIgKyBsZXR0ZXIgKyBcIiBpcyBpbmNvcnJlY3RcIik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxldHRlciA9IGxldHRlcjtcbiAgICAgICAgdGhpcy5vY3RhdmUgPSBvY3RhdmU7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB0aGUgZGlzdGFuY2UgKGluIHdoaXRlIG5vdGVzKSBiZXR3ZWVuIHRoaXMgbm90ZVxuICAgICAqIGFuZCBub3RlIHcsIGkuZS4gIHRoaXMgLSB3LiAgRm9yIGV4YW1wbGUsIEM0IC0gQTQgPSAyLFxuICAgICAqL1xuICAgIHB1YmxpYyBpbnQgRGlzdChXaGl0ZU5vdGUgdykge1xuICAgICAgICByZXR1cm4gKG9jdGF2ZSAtIHcub2N0YXZlKSAqIDcgKyAobGV0dGVyIC0gdy5sZXR0ZXIpO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdGhpcyBub3RlIHBsdXMgdGhlIGdpdmVuIGFtb3VudCAoaW4gd2hpdGUgbm90ZXMpLlxuICAgICAqIFRoZSBhbW91bnQgbWF5IGJlIHBvc2l0aXZlIG9yIG5lZ2F0aXZlLiAgRm9yIGV4YW1wbGUsXG4gICAgICogQTQgKyAyID0gQzQsIGFuZCBDNCArICgtMikgPSBBNC5cbiAgICAgKi9cbiAgICBwdWJsaWMgV2hpdGVOb3RlIEFkZChpbnQgYW1vdW50KSB7XG4gICAgICAgIGludCBudW0gPSBvY3RhdmUgKiA3ICsgbGV0dGVyO1xuICAgICAgICBudW0gKz0gYW1vdW50O1xuICAgICAgICBpZiAobnVtIDwgMCkge1xuICAgICAgICAgICAgbnVtID0gMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFdoaXRlTm90ZShudW0gJSA3LCBudW0gLyA3KTtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHRoZSBtaWRpIG5vdGUgbnVtYmVyIGNvcnJlc3BvbmRpbmcgdG8gdGhpcyB3aGl0ZSBub3RlLlxuICAgICAqIFRoZSBtaWRpIG5vdGUgbnVtYmVycyBjb3ZlciBhbGwga2V5cywgaW5jbHVkaW5nIHNoYXJwcy9mbGF0cyxcbiAgICAgKiBzbyBlYWNoIG9jdGF2ZSBpcyAxMiBub3Rlcy4gIE1pZGRsZSBDIChDNCkgaXMgNjAuICBTb21lIGV4YW1wbGVcbiAgICAgKiBudW1iZXJzIGZvciB2YXJpb3VzIG5vdGVzOlxuICAgICAqXG4gICAgICogIEEgMiA9IDMzXG4gICAgICogIEEjMiA9IDM0XG4gICAgICogIEcgMiA9IDQzXG4gICAgICogIEcjMiA9IDQ0IFxuICAgICAqICBBIDMgPSA0NVxuICAgICAqICBBIDQgPSA1N1xuICAgICAqICBBIzQgPSA1OFxuICAgICAqICBCIDQgPSA1OVxuICAgICAqICBDIDQgPSA2MFxuICAgICAqL1xuXG4gICAgcHVibGljIGludCBOdW1iZXIoKSB7XG4gICAgICAgIGludCBvZmZzZXQgPSAwO1xuICAgICAgICBzd2l0Y2ggKGxldHRlcikge1xuICAgICAgICAgICAgY2FzZSBBOiBvZmZzZXQgPSBOb3RlU2NhbGUuQTsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEI6IG9mZnNldCA9IE5vdGVTY2FsZS5COyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgQzogb2Zmc2V0ID0gTm90ZVNjYWxlLkM7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBEOiBvZmZzZXQgPSBOb3RlU2NhbGUuRDsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEU6IG9mZnNldCA9IE5vdGVTY2FsZS5FOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgRjogb2Zmc2V0ID0gTm90ZVNjYWxlLkY7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBHOiBvZmZzZXQgPSBOb3RlU2NhbGUuRzsgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OiBvZmZzZXQgPSAwOyBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTm90ZVNjYWxlLlRvTnVtYmVyKG9mZnNldCwgb2N0YXZlKTtcbiAgICB9XG5cbiAgICAvKiogQ29tcGFyZSB0aGUgdHdvIG5vdGVzLiAgUmV0dXJuXG4gICAgICogIDwgMCAgaWYgeCBpcyBsZXNzIChsb3dlcikgdGhhbiB5XG4gICAgICogICAgMCAgaWYgeCBpcyBlcXVhbCB0byB5XG4gICAgICogID4gMCAgaWYgeCBpcyBncmVhdGVyIChoaWdoZXIpIHRoYW4geVxuICAgICAqL1xuICAgIHB1YmxpYyBpbnQgQ29tcGFyZShXaGl0ZU5vdGUgeCwgV2hpdGVOb3RlIHkpIHtcbiAgICAgICAgcmV0dXJuIHguRGlzdCh5KTtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHRoZSBoaWdoZXIgbm90ZSwgeCBvciB5ICovXG4gICAgcHVibGljIHN0YXRpYyBXaGl0ZU5vdGUgTWF4KFdoaXRlTm90ZSB4LCBXaGl0ZU5vdGUgeSkge1xuICAgICAgICBpZiAoeC5EaXN0KHkpID4gMClcbiAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4geTtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHRoZSBsb3dlciBub3RlLCB4IG9yIHkgKi9cbiAgICBwdWJsaWMgc3RhdGljIFdoaXRlTm90ZSBNaW4oV2hpdGVOb3RlIHgsIFdoaXRlTm90ZSB5KSB7XG4gICAgICAgIGlmICh4LkRpc3QoeSkgPCAwKVxuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiB5O1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdGhlIHRvcCBub3RlIGluIHRoZSBzdGFmZiBvZiB0aGUgZ2l2ZW4gY2xlZiAqL1xuICAgIHB1YmxpYyBzdGF0aWMgV2hpdGVOb3RlIFRvcChDbGVmIGNsZWYpIHtcbiAgICAgICAgaWYgKGNsZWYgPT0gQ2xlZi5UcmVibGUpXG4gICAgICAgICAgICByZXR1cm4gVG9wVHJlYmxlO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gVG9wQmFzcztcbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHRoZSBib3R0b20gbm90ZSBpbiB0aGUgc3RhZmYgb2YgdGhlIGdpdmVuIGNsZWYgKi9cbiAgICBwdWJsaWMgc3RhdGljIFdoaXRlTm90ZSBCb3R0b20oQ2xlZiBjbGVmKSB7XG4gICAgICAgIGlmIChjbGVmID09IENsZWYuVHJlYmxlKVxuICAgICAgICAgICAgcmV0dXJuIEJvdHRvbVRyZWJsZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIEJvdHRvbUJhc3M7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB0aGUgc3RyaW5nIDxsZXR0ZXI+PG9jdGF2ZT4gZm9yIHRoaXMgbm90ZS4gKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgXG4gICAgc3RyaW5nIFRvU3RyaW5nKCkge1xuICAgICAgICBzdHJpbmdbXSBzID0geyBcIkFcIiwgXCJCXCIsIFwiQ1wiLCBcIkRcIiwgXCJFXCIsIFwiRlwiLCBcIkdcIiB9O1xuICAgICAgICByZXR1cm4gc1tsZXR0ZXJdICsgb2N0YXZlO1xuICAgIH1cbn1cblxuXG5cbn1cbiIsInVzaW5nIFN5c3RlbTtcclxudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XHJcbnVzaW5nIFN5c3RlbS5UZXh0O1xyXG5cclxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljXHJcbntcclxuICAgIHB1YmxpYyBjbGFzcyBQYWludEV2ZW50QXJnc1xyXG4gICAge1xyXG4gICAgICAgIHB1YmxpYyBSZWN0YW5nbGUgQ2xpcFJlY3RhbmdsZSB7IGdldDsgc2V0OyB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBHcmFwaGljcyBHcmFwaGljcygpIHsgcmV0dXJuIG5ldyBHcmFwaGljcyhcIm1haW5cIik7IH1cclxuICAgIH1cclxufVxyXG4iLCJ1c2luZyBTeXN0ZW07XHJcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xyXG51c2luZyBTeXN0ZW0uVGV4dDtcclxuXHJcbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY1xyXG57XHJcbiAgICBwdWJsaWMgY2xhc3MgUGFuZWxcclxuICAgIHtcclxuICAgICAgICBwcml2YXRlIFBvaW50IGF1dG9TY3JvbGxQb3NpdGlvbj1uZXcgUG9pbnQoMCwwKTtcclxuICAgICAgICBwdWJsaWMgUG9pbnQgQXV0b1Njcm9sbFBvc2l0aW9uIHsgZ2V0IHsgcmV0dXJuIGF1dG9TY3JvbGxQb3NpdGlvbjsgfSBzZXQgeyBhdXRvU2Nyb2xsUG9zaXRpb24gPSB2YWx1ZTsgfSB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBpbnQgV2lkdGg7XHJcbiAgICAgICAgcHVibGljIGludCBIZWlnaHQ7XHJcbiAgICB9XHJcbn1cclxuIiwidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcblxyXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBjbGFzcyBQYXRoXHJcbiAgICB7XHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBzdHJpbmcgR2V0RmlsZU5hbWUoc3RyaW5nIGZpbGVuYW1lKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICB9XHJcbn1cclxuIiwidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcblxyXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcclxue1xyXG4gICAgcHVibGljIGNsYXNzIFBlblxyXG4gICAge1xyXG4gICAgICAgIHB1YmxpYyBDb2xvciBDb2xvcjtcclxuICAgICAgICBwdWJsaWMgaW50IFdpZHRoO1xyXG4gICAgICAgIHB1YmxpYyBMaW5lQ2FwIEVuZENhcDtcclxuXHJcbiAgICAgICAgcHVibGljIFBlbihDb2xvciBjb2xvciwgaW50IHdpZHRoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgQ29sb3IgPSBjb2xvcjtcclxuICAgICAgICAgICAgV2lkdGggPSB3aWR0aDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcblxyXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcclxue1xyXG4gICAgcHVibGljIGNsYXNzIFBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcHVibGljIGludCBYO1xyXG4gICAgICAgIHB1YmxpYyBpbnQgWTtcclxuXHJcbiAgICAgICAgcHVibGljIFBvaW50KGludCB4LCBpbnQgeSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFggPSB4O1xyXG4gICAgICAgICAgICBZID0geTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcblxyXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcclxue1xyXG4gICAgcHVibGljIGNsYXNzIFJlY3RhbmdsZVxyXG4gICAge1xyXG4gICAgICAgIHB1YmxpYyBpbnQgWDtcclxuICAgICAgICBwdWJsaWMgaW50IFk7XHJcbiAgICAgICAgcHVibGljIGludCBXaWR0aDtcclxuICAgICAgICBwdWJsaWMgaW50IEhlaWdodDtcclxuXHJcbiAgICAgICAgcHVibGljIFJlY3RhbmdsZShpbnQgeCwgaW50IHksIGludCB3aWR0aCwgaW50IGhlaWdodClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFggPSB4O1xyXG4gICAgICAgICAgICBZID0geTtcclxuICAgICAgICAgICAgV2lkdGggPSB3aWR0aDtcclxuICAgICAgICAgICAgSGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCIvKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMSBNYWRoYXYgVmFpZHlhbmF0aGFuXHJcbiAqXHJcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXHJcbiAqXHJcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG4gKi9cclxuXHJcbnVzaW5nIFN5c3RlbTtcclxudXNpbmcgU3lzdGVtLklPO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcblxyXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcclxue1xyXG5cclxuICAgIC8qIEBjbGFzcyBTdGFmZlxyXG4gICAgICogVGhlIFN0YWZmIGlzIHVzZWQgdG8gZHJhdyBhIHNpbmdsZSBTdGFmZiAoYSByb3cgb2YgbWVhc3VyZXMpIGluIHRoZSBcclxuICAgICAqIFNoZWV0TXVzaWMgQ29udHJvbC4gQSBTdGFmZiBuZWVkcyB0byBkcmF3XHJcbiAgICAgKiAtIFRoZSBDbGVmXHJcbiAgICAgKiAtIFRoZSBrZXkgc2lnbmF0dXJlXHJcbiAgICAgKiAtIFRoZSBob3Jpem9udGFsIGxpbmVzXHJcbiAgICAgKiAtIEEgbGlzdCBvZiBNdXNpY1N5bWJvbHNcclxuICAgICAqIC0gVGhlIGxlZnQgYW5kIHJpZ2h0IHZlcnRpY2FsIGxpbmVzXHJcbiAgICAgKlxyXG4gICAgICogVGhlIGhlaWdodCBvZiB0aGUgU3RhZmYgaXMgZGV0ZXJtaW5lZCBieSB0aGUgbnVtYmVyIG9mIHBpeGVscyBlYWNoXHJcbiAgICAgKiBNdXNpY1N5bWJvbCBleHRlbmRzIGFib3ZlIGFuZCBiZWxvdyB0aGUgc3RhZmYuXHJcbiAgICAgKlxyXG4gICAgICogVGhlIHZlcnRpY2FsIGxpbmVzIChsZWZ0IGFuZCByaWdodCBzaWRlcykgb2YgdGhlIHN0YWZmIGFyZSBqb2luZWRcclxuICAgICAqIHdpdGggdGhlIHN0YWZmcyBhYm92ZSBhbmQgYmVsb3cgaXQsIHdpdGggb25lIGV4Y2VwdGlvbi4gIFxyXG4gICAgICogVGhlIGxhc3QgdHJhY2sgaXMgbm90IGpvaW5lZCB3aXRoIHRoZSBmaXJzdCB0cmFjay5cclxuICAgICAqL1xyXG5cclxuICAgIHB1YmxpYyBjbGFzcyBTdGFmZlxyXG4gICAge1xyXG4gICAgICAgIHByaXZhdGUgTGlzdDxNdXNpY1N5bWJvbD4gc3ltYm9sczsgIC8qKiBUaGUgbXVzaWMgc3ltYm9scyBpbiB0aGlzIHN0YWZmICovXHJcbiAgICAgICAgcHJpdmF0ZSBMaXN0PEx5cmljU3ltYm9sPiBseXJpY3M7ICAgLyoqIFRoZSBseXJpY3MgdG8gZGlzcGxheSAoY2FuIGJlIG51bGwpICovXHJcbiAgICAgICAgcHJpdmF0ZSBpbnQgeXRvcDsgICAgICAgICAgICAgICAgICAgLyoqIFRoZSB5IHBpeGVsIG9mIHRoZSB0b3Agb2YgdGhlIHN0YWZmICovXHJcbiAgICAgICAgcHJpdmF0ZSBDbGVmU3ltYm9sIGNsZWZzeW07ICAgICAgICAgLyoqIFRoZSBsZWZ0LXNpZGUgQ2xlZiBzeW1ib2wgKi9cclxuICAgICAgICBwcml2YXRlIEFjY2lkU3ltYm9sW10ga2V5czsgICAgICAgICAvKiogVGhlIGtleSBzaWduYXR1cmUgc3ltYm9scyAqL1xyXG4gICAgICAgIHByaXZhdGUgYm9vbCBzaG93TWVhc3VyZXM7ICAgICAgICAgIC8qKiBJZiB0cnVlLCBzaG93IHRoZSBtZWFzdXJlIG51bWJlcnMgKi9cclxuICAgICAgICBwcml2YXRlIGludCBrZXlzaWdXaWR0aDsgICAgICAgICAgICAvKiogVGhlIHdpZHRoIG9mIHRoZSBjbGVmIGFuZCBrZXkgc2lnbmF0dXJlICovXHJcbiAgICAgICAgcHJpdmF0ZSBpbnQgd2lkdGg7ICAgICAgICAgICAgICAgICAgLyoqIFRoZSB3aWR0aCBvZiB0aGUgc3RhZmYgaW4gcGl4ZWxzICovXHJcbiAgICAgICAgcHJpdmF0ZSBpbnQgaGVpZ2h0OyAgICAgICAgICAgICAgICAgLyoqIFRoZSBoZWlnaHQgb2YgdGhlIHN0YWZmIGluIHBpeGVscyAqL1xyXG4gICAgICAgIHByaXZhdGUgaW50IHRyYWNrbnVtOyAgICAgICAgICAgICAgIC8qKiBUaGUgdHJhY2sgdGhpcyBzdGFmZiByZXByZXNlbnRzICovXHJcbiAgICAgICAgcHJpdmF0ZSBpbnQgdG90YWx0cmFja3M7ICAgICAgICAgICAgLyoqIFRoZSB0b3RhbCBudW1iZXIgb2YgdHJhY2tzICovXHJcbiAgICAgICAgcHJpdmF0ZSBpbnQgc3RhcnR0aW1lOyAgICAgICAgICAgICAgLyoqIFRoZSB0aW1lIChpbiBwdWxzZXMpIG9mIGZpcnN0IHN5bWJvbCAqL1xyXG4gICAgICAgIHByaXZhdGUgaW50IGVuZHRpbWU7ICAgICAgICAgICAgICAgIC8qKiBUaGUgdGltZSAoaW4gcHVsc2VzKSBvZiBsYXN0IHN5bWJvbCAqL1xyXG4gICAgICAgIHByaXZhdGUgaW50IG1lYXN1cmVMZW5ndGg7ICAgICAgICAgIC8qKiBUaGUgdGltZSAoaW4gcHVsc2VzKSBvZiBhIG1lYXN1cmUgKi9cclxuXHJcbiAgICAgICAgLyoqIENyZWF0ZSBhIG5ldyBzdGFmZiB3aXRoIHRoZSBnaXZlbiBsaXN0IG9mIG11c2ljIHN5bWJvbHMsXHJcbiAgICAgICAgICogYW5kIHRoZSBnaXZlbiBrZXkgc2lnbmF0dXJlLiAgVGhlIGNsZWYgaXMgZGV0ZXJtaW5lZCBieVxyXG4gICAgICAgICAqIHRoZSBjbGVmIG9mIHRoZSBmaXJzdCBjaG9yZCBzeW1ib2wuIFRoZSB0cmFjayBudW1iZXIgaXMgdXNlZFxyXG4gICAgICAgICAqIHRvIGRldGVybWluZSB3aGV0aGVyIHRvIGpvaW4gdGhpcyBsZWZ0L3JpZ2h0IHZlcnRpY2FsIHNpZGVzXHJcbiAgICAgICAgICogd2l0aCB0aGUgc3RhZmZzIGFib3ZlIGFuZCBiZWxvdy4gVGhlIFNoZWV0TXVzaWNPcHRpb25zIGFyZSB1c2VkXHJcbiAgICAgICAgICogdG8gY2hlY2sgd2hldGhlciB0byBkaXNwbGF5IG1lYXN1cmUgbnVtYmVycyBvciBub3QuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHVibGljIFN0YWZmKExpc3Q8TXVzaWNTeW1ib2w+IHN5bWJvbHMsIEtleVNpZ25hdHVyZSBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgIE1pZGlPcHRpb25zIG9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICAgICAgIGludCB0cmFja251bSwgaW50IHRvdGFsdHJhY2tzKVxyXG4gICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgIGtleXNpZ1dpZHRoID0gU2hlZXRNdXNpYy5LZXlTaWduYXR1cmVXaWR0aChrZXkpO1xyXG4gICAgICAgICAgICB0aGlzLnRyYWNrbnVtID0gdHJhY2tudW07XHJcbiAgICAgICAgICAgIHRoaXMudG90YWx0cmFja3MgPSB0b3RhbHRyYWNrcztcclxuICAgICAgICAgICAgc2hvd01lYXN1cmVzID0gKG9wdGlvbnMuc2hvd01lYXN1cmVzICYmIHRyYWNrbnVtID09IDApO1xyXG4gICAgICAgICAgICBtZWFzdXJlTGVuZ3RoID0gb3B0aW9ucy50aW1lLk1lYXN1cmU7XHJcbiAgICAgICAgICAgIENsZWYgY2xlZiA9IEZpbmRDbGVmKHN5bWJvbHMpO1xyXG5cclxuICAgICAgICAgICAgY2xlZnN5bSA9IG5ldyBDbGVmU3ltYm9sKGNsZWYsIDAsIGZhbHNlKTtcclxuICAgICAgICAgICAga2V5cyA9IGtleS5HZXRTeW1ib2xzKGNsZWYpO1xyXG4gICAgICAgICAgICB0aGlzLnN5bWJvbHMgPSBzeW1ib2xzO1xyXG4gICAgICAgICAgICBDYWxjdWxhdGVXaWR0aChvcHRpb25zLnNjcm9sbFZlcnQpO1xyXG4gICAgICAgICAgICBDYWxjdWxhdGVIZWlnaHQoKTtcclxuICAgICAgICAgICAgQ2FsY3VsYXRlU3RhcnRFbmRUaW1lKCk7XHJcbiAgICAgICAgICAgIEZ1bGxKdXN0aWZ5KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogUmV0dXJuIHRoZSB3aWR0aCBvZiB0aGUgc3RhZmYgKi9cclxuICAgICAgICBwdWJsaWMgaW50IFdpZHRoXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBnZXQgeyByZXR1cm4gd2lkdGg7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBSZXR1cm4gdGhlIGhlaWdodCBvZiB0aGUgc3RhZmYgKi9cclxuICAgICAgICBwdWJsaWMgaW50IEhlaWdodFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIGhlaWdodDsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIFJldHVybiB0aGUgdHJhY2sgbnVtYmVyIG9mIHRoaXMgc3RhZmYgKHN0YXJ0aW5nIGZyb20gMCAqL1xyXG4gICAgICAgIHB1YmxpYyBpbnQgVHJhY2tcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdldCB7IHJldHVybiB0cmFja251bTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIFJldHVybiB0aGUgc3RhcnRpbmcgdGltZSBvZiB0aGUgc3RhZmYsIHRoZSBzdGFydCB0aW1lIG9mXHJcbiAgICAgICAgICogIHRoZSBmaXJzdCBzeW1ib2wuICBUaGlzIGlzIHVzZWQgZHVyaW5nIHBsYXliYWNrLCB0byBcclxuICAgICAgICAgKiAgYXV0b21hdGljYWxseSBzY3JvbGwgdGhlIG11c2ljIHdoaWxlIHBsYXlpbmcuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHVibGljIGludCBTdGFydFRpbWVcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdldCB7IHJldHVybiBzdGFydHRpbWU7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBSZXR1cm4gdGhlIGVuZGluZyB0aW1lIG9mIHRoZSBzdGFmZiwgdGhlIGVuZHRpbWUgb2ZcclxuICAgICAgICAgKiAgdGhlIGxhc3Qgc3ltYm9sLiAgVGhpcyBpcyB1c2VkIGR1cmluZyBwbGF5YmFjaywgdG8gXHJcbiAgICAgICAgICogIGF1dG9tYXRpY2FsbHkgc2Nyb2xsIHRoZSBtdXNpYyB3aGlsZSBwbGF5aW5nLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHB1YmxpYyBpbnQgRW5kVGltZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIGVuZHRpbWU7IH1cclxuICAgICAgICAgICAgc2V0IHsgZW5kdGltZSA9IHZhbHVlOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogRmluZCB0aGUgaW5pdGlhbCBjbGVmIHRvIHVzZSBmb3IgdGhpcyBzdGFmZi4gIFVzZSB0aGUgY2xlZiBvZlxyXG4gICAgICAgICAqIHRoZSBmaXJzdCBDaG9yZFN5bWJvbC5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwcml2YXRlIENsZWYgRmluZENsZWYoTGlzdDxNdXNpY1N5bWJvbD4gbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvcmVhY2ggKE11c2ljU3ltYm9sIG0gaW4gbGlzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKG0gaXMgQ2hvcmRTeW1ib2wpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgQ2hvcmRTeW1ib2wgYyA9IChDaG9yZFN5bWJvbCltO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjLkNsZWY7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIENsZWYuVHJlYmxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIENhbGN1bGF0ZSB0aGUgaGVpZ2h0IG9mIHRoaXMgc3RhZmYuICBFYWNoIE11c2ljU3ltYm9sIGNvbnRhaW5zIHRoZVxyXG4gICAgICAgICAqIG51bWJlciBvZiBwaXhlbHMgaXQgbmVlZHMgYWJvdmUgYW5kIGJlbG93IHRoZSBzdGFmZi4gIEdldCB0aGUgbWF4aW11bVxyXG4gICAgICAgICAqIHZhbHVlcyBhYm92ZSBhbmQgYmVsb3cgdGhlIHN0YWZmLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHB1YmxpYyB2b2lkIENhbGN1bGF0ZUhlaWdodCgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnQgYWJvdmUgPSAwO1xyXG4gICAgICAgICAgICBpbnQgYmVsb3cgPSAwO1xyXG5cclxuICAgICAgICAgICAgZm9yZWFjaCAoTXVzaWNTeW1ib2wgcyBpbiBzeW1ib2xzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBhYm92ZSA9IE1hdGguTWF4KGFib3ZlLCBzLkFib3ZlU3RhZmYpO1xyXG4gICAgICAgICAgICAgICAgYmVsb3cgPSBNYXRoLk1heChiZWxvdywgcy5CZWxvd1N0YWZmKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhYm92ZSA9IE1hdGguTWF4KGFib3ZlLCBjbGVmc3ltLkFib3ZlU3RhZmYpO1xyXG4gICAgICAgICAgICBiZWxvdyA9IE1hdGguTWF4KGJlbG93LCBjbGVmc3ltLkJlbG93U3RhZmYpO1xyXG4gICAgICAgICAgICBpZiAoc2hvd01lYXN1cmVzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBhYm92ZSA9IE1hdGguTWF4KGFib3ZlLCBTaGVldE11c2ljLk5vdGVIZWlnaHQgKiAzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB5dG9wID0gYWJvdmUgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XHJcbiAgICAgICAgICAgIGhlaWdodCA9IFNoZWV0TXVzaWMuTm90ZUhlaWdodCAqIDUgKyB5dG9wICsgYmVsb3c7XHJcbiAgICAgICAgICAgIGlmIChseXJpY3MgIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaGVpZ2h0ICs9IDEyO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvKiBBZGQgc29tZSBleHRyYSB2ZXJ0aWNhbCBzcGFjZSBiZXR3ZWVuIHRoZSBsYXN0IHRyYWNrXHJcbiAgICAgICAgICAgICAqIGFuZCBmaXJzdCB0cmFjay5cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGlmICh0cmFja251bSA9PSB0b3RhbHRyYWNrcyAtIDEpXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQgKz0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0ICogMztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBDYWxjdWxhdGUgdGhlIHdpZHRoIG9mIHRoaXMgc3RhZmYgKi9cclxuICAgICAgICBwcml2YXRlIHZvaWQgQ2FsY3VsYXRlV2lkdGgoYm9vbCBzY3JvbGxWZXJ0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHNjcm9sbFZlcnQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHdpZHRoID0gU2hlZXRNdXNpYy5QYWdlV2lkdGg7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgd2lkdGggPSBrZXlzaWdXaWR0aDtcclxuICAgICAgICAgICAgZm9yZWFjaCAoTXVzaWNTeW1ib2wgcyBpbiBzeW1ib2xzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB3aWR0aCArPSBzLldpZHRoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLyoqIENhbGN1bGF0ZSB0aGUgc3RhcnQgYW5kIGVuZCB0aW1lIG9mIHRoaXMgc3RhZmYuICovXHJcbiAgICAgICAgcHJpdmF0ZSB2b2lkIENhbGN1bGF0ZVN0YXJ0RW5kVGltZSgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzdGFydHRpbWUgPSBlbmR0aW1lID0gMDtcclxuICAgICAgICAgICAgaWYgKHN5bWJvbHMuQ291bnQgPT0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0YXJ0dGltZSA9IHN5bWJvbHNbMF0uU3RhcnRUaW1lO1xyXG4gICAgICAgICAgICBmb3JlYWNoIChNdXNpY1N5bWJvbCBtIGluIHN5bWJvbHMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChlbmR0aW1lIDwgbS5TdGFydFRpbWUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5kdGltZSA9IG0uU3RhcnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKG0gaXMgQ2hvcmRTeW1ib2wpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgQ2hvcmRTeW1ib2wgYyA9IChDaG9yZFN5bWJvbCltO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmR0aW1lIDwgYy5FbmRUaW1lKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kdGltZSA9IGMuRW5kVGltZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvKiogRnVsbC1KdXN0aWZ5IHRoZSBzeW1ib2xzLCBzbyB0aGF0IHRoZXkgZXhwYW5kIHRvIGZpbGwgdGhlIHdob2xlIHN0YWZmLiAqL1xyXG4gICAgICAgIHByaXZhdGUgdm9pZCBGdWxsSnVzdGlmeSgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAod2lkdGggIT0gU2hlZXRNdXNpYy5QYWdlV2lkdGgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBpbnQgdG90YWx3aWR0aCA9IGtleXNpZ1dpZHRoO1xyXG4gICAgICAgICAgICBpbnQgdG90YWxzeW1ib2xzID0gMDtcclxuICAgICAgICAgICAgaW50IGkgPSAwO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKGkgPCBzeW1ib2xzLkNvdW50KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpbnQgc3RhcnQgPSBzeW1ib2xzW2ldLlN0YXJ0VGltZTtcclxuICAgICAgICAgICAgICAgIHRvdGFsc3ltYm9scysrO1xyXG4gICAgICAgICAgICAgICAgdG90YWx3aWR0aCArPSBzeW1ib2xzW2ldLldpZHRoO1xyXG4gICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGkgPCBzeW1ib2xzLkNvdW50ICYmIHN5bWJvbHNbaV0uU3RhcnRUaW1lID09IHN0YXJ0KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsd2lkdGggKz0gc3ltYm9sc1tpXS5XaWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGludCBleHRyYXdpZHRoID0gKFNoZWV0TXVzaWMuUGFnZVdpZHRoIC0gdG90YWx3aWR0aCAtIDEpIC8gdG90YWxzeW1ib2xzO1xyXG4gICAgICAgICAgICBpZiAoZXh0cmF3aWR0aCA+IFNoZWV0TXVzaWMuTm90ZUhlaWdodCAqIDIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGV4dHJhd2lkdGggPSBTaGVldE11c2ljLk5vdGVIZWlnaHQgKiAyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGkgPSAwO1xyXG4gICAgICAgICAgICB3aGlsZSAoaSA8IHN5bWJvbHMuQ291bnQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGludCBzdGFydCA9IHN5bWJvbHNbaV0uU3RhcnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgc3ltYm9sc1tpXS5XaWR0aCArPSBleHRyYXdpZHRoO1xyXG4gICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGkgPCBzeW1ib2xzLkNvdW50ICYmIHN5bWJvbHNbaV0uU3RhcnRUaW1lID09IHN0YXJ0KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qKiBBZGQgdGhlIGx5cmljIHN5bWJvbHMgdGhhdCBvY2N1ciB3aXRoaW4gdGhpcyBzdGFmZi5cclxuICAgICAgICAgKiAgU2V0IHRoZSB4LXBvc2l0aW9uIG9mIHRoZSBseXJpYyBzeW1ib2wuIFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHB1YmxpYyB2b2lkIEFkZEx5cmljcyhMaXN0PEx5cmljU3ltYm9sPiB0cmFja2x5cmljcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0cmFja2x5cmljcyA9PSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbHlyaWNzID0gbmV3IExpc3Q8THlyaWNTeW1ib2w+KCk7XHJcbiAgICAgICAgICAgIGludCB4cG9zID0gMDtcclxuICAgICAgICAgICAgaW50IHN5bWJvbGluZGV4ID0gMDtcclxuICAgICAgICAgICAgZm9yZWFjaCAoTHlyaWNTeW1ib2wgbHlyaWMgaW4gdHJhY2tseXJpY3MpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChseXJpYy5TdGFydFRpbWUgPCBzdGFydHRpbWUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobHlyaWMuU3RhcnRUaW1lID4gZW5kdGltZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8qIEdldCB0aGUgeC1wb3NpdGlvbiBvZiB0aGlzIGx5cmljICovXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoc3ltYm9saW5kZXggPCBzeW1ib2xzLkNvdW50ICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgc3ltYm9sc1tzeW1ib2xpbmRleF0uU3RhcnRUaW1lIDwgbHlyaWMuU3RhcnRUaW1lKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHhwb3MgKz0gc3ltYm9sc1tzeW1ib2xpbmRleF0uV2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgc3ltYm9saW5kZXgrKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGx5cmljLlggPSB4cG9zO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN5bWJvbGluZGV4IDwgc3ltYm9scy5Db3VudCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIChzeW1ib2xzW3N5bWJvbGluZGV4XSBpcyBCYXJTeW1ib2wpKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGx5cmljLlggKz0gU2hlZXRNdXNpYy5Ob3RlV2lkdGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBseXJpY3MuQWRkKGx5cmljKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAobHlyaWNzLkNvdW50ID09IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGx5cmljcyA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvKiogRHJhdyB0aGUgbHlyaWNzICovXHJcbiAgICAgICAgcHJpdmF0ZSB2b2lkIERyYXdMeXJpY3MoR3JhcGhpY3MgZywgUGVuIHBlbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8qIFNraXAgdGhlIGxlZnQgc2lkZSBDbGVmIHN5bWJvbCBhbmQga2V5IHNpZ25hdHVyZSAqL1xyXG4gICAgICAgICAgICBpbnQgeHBvcyA9IGtleXNpZ1dpZHRoO1xyXG4gICAgICAgICAgICBpbnQgeXBvcyA9IGhlaWdodCAtIDEyO1xyXG5cclxuICAgICAgICAgICAgZm9yZWFjaCAoTHlyaWNTeW1ib2wgbHlyaWMgaW4gbHlyaWNzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBnLkRyYXdTdHJpbmcobHlyaWMuVGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLkxldHRlckZvbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQnJ1c2hlcy5CbGFjayxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4cG9zICsgbHlyaWMuWCwgeXBvcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBEcmF3IHRoZSBtZWFzdXJlIG51bWJlcnMgZm9yIGVhY2ggbWVhc3VyZSAqL1xyXG4gICAgICAgIHByaXZhdGUgdm9pZCBEcmF3TWVhc3VyZU51bWJlcnMoR3JhcGhpY3MgZywgUGVuIHBlbilcclxuICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAvKiBTa2lwIHRoZSBsZWZ0IHNpZGUgQ2xlZiBzeW1ib2wgYW5kIGtleSBzaWduYXR1cmUgKi9cclxuICAgICAgICAgICAgaW50IHhwb3MgPSBrZXlzaWdXaWR0aDtcclxuICAgICAgICAgICAgaW50IHlwb3MgPSB5dG9wIC0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0ICogMztcclxuXHJcbiAgICAgICAgICAgIGZvcmVhY2ggKE11c2ljU3ltYm9sIHMgaW4gc3ltYm9scylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHMgaXMgQmFyU3ltYm9sKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGludCBtZWFzdXJlID0gMSArIHMuU3RhcnRUaW1lIC8gbWVhc3VyZUxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBnLkRyYXdTdHJpbmcoXCJcIiArIG1lYXN1cmUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTGV0dGVyRm9udCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQnJ1c2hlcy5CbGFjayxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHBvcyArIFNoZWV0TXVzaWMuTm90ZVdpZHRoIC8gMixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeXBvcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB4cG9zICs9IHMuV2lkdGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBEcmF3IHRoZSBseXJpY3MgKi9cclxuXHJcblxyXG4gICAgICAgIC8qKiBEcmF3IHRoZSBmaXZlIGhvcml6b250YWwgbGluZXMgb2YgdGhlIHN0YWZmICovXHJcbiAgICAgICAgcHJpdmF0ZSB2b2lkIERyYXdIb3JpekxpbmVzKEdyYXBoaWNzIGcsIFBlbiBwZW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnQgbGluZSA9IDE7XHJcbiAgICAgICAgICAgIGludCB5ID0geXRvcCAtIFNoZWV0TXVzaWMuTGluZVdpZHRoO1xyXG4gICAgICAgICAgICBwZW4uV2lkdGggPSAxO1xyXG4gICAgICAgICAgICBmb3IgKGxpbmUgPSAxOyBsaW5lIDw9IDU7IGxpbmUrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZy5EcmF3TGluZShwZW4sIFNoZWV0TXVzaWMuTGVmdE1hcmdpbiwgeSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCAtIDEsIHkpO1xyXG4gICAgICAgICAgICAgICAgeSArPSBTaGVldE11c2ljLkxpbmVXaWR0aCArIFNoZWV0TXVzaWMuTGluZVNwYWNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHBlbi5Db2xvciA9IENvbG9yLkJsYWNrO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBEcmF3IHRoZSB2ZXJ0aWNhbCBsaW5lcyBhdCB0aGUgZmFyIGxlZnQgYW5kIGZhciByaWdodCBzaWRlcy4gKi9cclxuICAgICAgICBwcml2YXRlIHZvaWQgRHJhd0VuZExpbmVzKEdyYXBoaWNzIGcsIFBlbiBwZW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwZW4uV2lkdGggPSAxO1xyXG5cclxuICAgICAgICAgICAgLyogRHJhdyB0aGUgdmVydGljYWwgbGluZXMgZnJvbSAwIHRvIHRoZSBoZWlnaHQgb2YgdGhpcyBzdGFmZixcclxuICAgICAgICAgICAgICogaW5jbHVkaW5nIHRoZSBzcGFjZSBhYm92ZSBhbmQgYmVsb3cgdGhlIHN0YWZmLCB3aXRoIHR3byBleGNlcHRpb25zOlxyXG4gICAgICAgICAgICAgKiAtIElmIHRoaXMgaXMgdGhlIGZpcnN0IHRyYWNrLCBkb24ndCBzdGFydCBhYm92ZSB0aGUgc3RhZmYuXHJcbiAgICAgICAgICAgICAqICAgU3RhcnQgZXhhY3RseSBhdCB0aGUgdG9wIG9mIHRoZSBzdGFmZiAoeXRvcCAtIExpbmVXaWR0aClcclxuICAgICAgICAgICAgICogLSBJZiB0aGlzIGlzIHRoZSBsYXN0IHRyYWNrLCBkb24ndCBlbmQgYmVsb3cgdGhlIHN0YWZmLlxyXG4gICAgICAgICAgICAgKiAgIEVuZCBleGFjdGx5IGF0IHRoZSBib3R0b20gb2YgdGhlIHN0YWZmLlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgaW50IHlzdGFydCwgeWVuZDtcclxuICAgICAgICAgICAgaWYgKHRyYWNrbnVtID09IDApXHJcbiAgICAgICAgICAgICAgICB5c3RhcnQgPSB5dG9wIC0gU2hlZXRNdXNpYy5MaW5lV2lkdGg7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHlzdGFydCA9IDA7XHJcblxyXG4gICAgICAgICAgICBpZiAodHJhY2tudW0gPT0gKHRvdGFsdHJhY2tzIC0gMSkpXHJcbiAgICAgICAgICAgICAgICB5ZW5kID0geXRvcCArIDQgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHllbmQgPSBoZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICBnLkRyYXdMaW5lKHBlbiwgU2hlZXRNdXNpYy5MZWZ0TWFyZ2luLCB5c3RhcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLkxlZnRNYXJnaW4sIHllbmQpO1xyXG5cclxuICAgICAgICAgICAgZy5EcmF3TGluZShwZW4sIHdpZHRoIC0gMSwgeXN0YXJ0LCB3aWR0aCAtIDEsIHllbmQpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBEcmF3IHRoaXMgc3RhZmYuIE9ubHkgZHJhdyB0aGUgc3ltYm9scyBpbnNpZGUgdGhlIGNsaXAgYXJlYSAqL1xyXG4gICAgICAgIHB1YmxpYyB2b2lkIERyYXcoR3JhcGhpY3MgZywgUmVjdGFuZ2xlIGNsaXAsIFBlbiBwZW4sIGludCBzZWxlY3Rpb25TdGFydFB1bHNlLCBpbnQgc2VsZWN0aW9uRW5kUHVsc2UsIEJydXNoIGRlc2VsZWN0ZWRCcnVzaClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8qIFNoYWRlIGFueSBkZXNlbGVjdGVkIGFyZWFzICovXHJcbiAgICAgICAgICAgIFNoYWRlU2VsZWN0aW9uQmFja2dyb3VuZChnLCBjbGlwLCBzZWxlY3Rpb25TdGFydFB1bHNlLCBzZWxlY3Rpb25FbmRQdWxzZSwgZGVzZWxlY3RlZEJydXNoKTtcclxuXHJcbiAgICAgICAgICAgIGludCB4cG9zID0gU2hlZXRNdXNpYy5MZWZ0TWFyZ2luICsgNTtcclxuXHJcbiAgICAgICAgICAgIC8qIERyYXcgdGhlIGxlZnQgc2lkZSBDbGVmIHN5bWJvbCAqL1xyXG4gICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSh4cG9zLCAwKTtcclxuICAgICAgICAgICAgY2xlZnN5bS5EcmF3KGcsIHBlbiwgeXRvcCk7XHJcbiAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC14cG9zLCAwKTtcclxuICAgICAgICAgICAgeHBvcyArPSBjbGVmc3ltLldpZHRoO1xyXG5cclxuICAgICAgICAgICAgLyogRHJhdyB0aGUga2V5IHNpZ25hdHVyZSAqL1xyXG4gICAgICAgICAgICBmb3JlYWNoIChBY2NpZFN5bWJvbCBhIGluIGtleXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKHhwb3MsIDApO1xyXG4gICAgICAgICAgICAgICAgYS5EcmF3KGcsIHBlbiwgeXRvcCk7XHJcbiAgICAgICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgteHBvcywgMCk7XHJcbiAgICAgICAgICAgICAgICB4cG9zICs9IGEuV2lkdGg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8qIERyYXcgdGhlIGFjdHVhbCBub3RlcywgcmVzdHMsIGJhcnMuICBEcmF3IHRoZSBzeW1ib2xzIG9uZSBcclxuICAgICAgICAgICAgICogYWZ0ZXIgYW5vdGhlciwgdXNpbmcgdGhlIHN5bWJvbCB3aWR0aCB0byBkZXRlcm1pbmUgdGhlXHJcbiAgICAgICAgICAgICAqIHggcG9zaXRpb24gb2YgdGhlIG5leHQgc3ltYm9sLlxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBGb3IgZmFzdCBwZXJmb3JtYW5jZSwgb25seSBkcmF3IHN5bWJvbHMgdGhhdCBhcmUgaW4gdGhlIGNsaXAgYXJlYS5cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGZvcmVhY2ggKE11c2ljU3ltYm9sIHMgaW4gc3ltYm9scylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKEluc2lkZUNsaXBwaW5nKGNsaXAsIHhwb3MsIHMpKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKHhwb3MsIDApO1xyXG4gICAgICAgICAgICAgICAgICAgIHMuRHJhdyhnLCBwZW4sIHl0b3ApO1xyXG4gICAgICAgICAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC14cG9zLCAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHhwb3MgKz0gcy5XaWR0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBEcmF3SG9yaXpMaW5lcyhnLCBwZW4pO1xyXG4gICAgICAgICAgICBEcmF3RW5kTGluZXMoZywgcGVuKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzaG93TWVhc3VyZXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIERyYXdNZWFzdXJlTnVtYmVycyhnLCBwZW4pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChseXJpY3MgIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgRHJhd0x5cmljcyhnLCBwZW4pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIFxyXG4gICAgICAgICAqIElmIGEgc2VsZWN0aW9uIGhhcyBiZWVuIHNwZWNpZmllZCwgc2hhZGUgYWxsIGFyZWFzIHRoYXQgYXJlbid0IGluIHRoZSBzZWxlY3Rpb25cclxuICAgICAgICAqL1xyXG4gICAgICAgIHByaXZhdGUgdm9pZCBTaGFkZVNlbGVjdGlvbkJhY2tncm91bmQoR3JhcGhpY3MgZywgUmVjdGFuZ2xlIGNsaXAsIGludCBzZWxlY3Rpb25TdGFydFB1bHNlLCBpbnQgc2VsZWN0aW9uRW5kUHVsc2UsIEJydXNoIGRlc2VsZWN0ZWRCcnVzaClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3Rpb25FbmRQdWxzZSA9PSAwKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBpbnQgeHBvcyA9IGtleXNpZ1dpZHRoO1xyXG4gICAgICAgICAgICBib29sIGxhc3RTdGF0ZUZpbGwgPSBmYWxzZTtcclxuICAgICAgICAgICAgZm9yZWFjaCAoTXVzaWNTeW1ib2wgcyBpbiBzeW1ib2xzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoSW5zaWRlQ2xpcHBpbmcoY2xpcCwgeHBvcywgcykgJiYgKHMuU3RhcnRUaW1lIDwgc2VsZWN0aW9uU3RhcnRQdWxzZSB8fCBzLlN0YXJ0VGltZSA+IHNlbGVjdGlvbkVuZFB1bHNlKSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSh4cG9zIC0gMiwgLTIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShkZXNlbGVjdGVkQnJ1c2gsIDAsIDAsIHMuV2lkdGggKyA0LCB0aGlzLkhlaWdodCArIDQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC0oeHBvcyAtIDIpLCAyKTtcclxuICAgICAgICAgICAgICAgICAgICBsYXN0U3RhdGVGaWxsID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYXN0U3RhdGVGaWxsID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB4cG9zICs9IHMuV2lkdGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGxhc3RTdGF0ZUZpbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vc2hhZGUgdGhlIHJlc3Qgb2YgdGhlIHN0YWZmIGlmIHRoZSBwcmV2aW91cyBzeW1ib2wgd2FzIHNoYWRlZFxyXG4gICAgICAgICAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oeHBvcyAtIDIsIC0yKTtcclxuICAgICAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShkZXNlbGVjdGVkQnJ1c2gsIDAsIDAsIHdpZHRoIC0geHBvcywgdGhpcy5IZWlnaHQgKyA0KTtcclxuICAgICAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC0oeHBvcyAtIDIpLCAyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgYm9vbCBJbnNpZGVDbGlwcGluZyhSZWN0YW5nbGUgY2xpcCwgaW50IHhwb3MsIE11c2ljU3ltYm9sIHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gKHhwb3MgPD0gY2xpcC5YICsgY2xpcC5XaWR0aCArIDUwKSAmJiAoeHBvcyArIHMuV2lkdGggKyA1MCA+PSBjbGlwLlgpO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qKiBTaGFkZSBhbGwgdGhlIGNob3JkcyBwbGF5ZWQgaW4gdGhlIGdpdmVuIHRpbWUuXHJcbiAgICAgICAgICogIFVuLXNoYWRlIGFueSBjaG9yZHMgc2hhZGVkIGluIHRoZSBwcmV2aW91cyBwdWxzZSB0aW1lLlxyXG4gICAgICAgICAqICBTdG9yZSB0aGUgeCBjb29yZGluYXRlIGxvY2F0aW9uIHdoZXJlIHRoZSBzaGFkZSB3YXMgZHJhd24uXHJcbiAgICAgICAgICogIFJldHVybnMgdGhlIHdpZHRoIG9mIHRoZSBzaGFkZWQgcmVjdGFuZ2xlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHVibGljIGludCBTaGFkZU5vdGVzKEdyYXBoaWNzIGcsIFNvbGlkQnJ1c2ggc2hhZGVCcnVzaCwgUGVuIHBlbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50IGN1cnJlbnRQdWxzZVRpbWUsIGludCBwcmV2UHVsc2VUaW1lLCByZWYgaW50IHhfc2hhZGUpXHJcbiAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgLyogSWYgdGhlcmUncyBub3RoaW5nIHRvIHVuc2hhZGUsIG9yIHNoYWRlLCByZXR1cm4gKi9cclxuICAgICAgICAgICAgaWYgKChzdGFydHRpbWUgPiBwcmV2UHVsc2VUaW1lIHx8IGVuZHRpbWUgPCBwcmV2UHVsc2VUaW1lKSAmJlxyXG4gICAgICAgICAgICAgICAgKHN0YXJ0dGltZSA+IGN1cnJlbnRQdWxzZVRpbWUgfHwgZW5kdGltZSA8IGN1cnJlbnRQdWxzZVRpbWUpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLyogU2tpcCB0aGUgbGVmdCBzaWRlIENsZWYgc3ltYm9sIGFuZCBrZXkgc2lnbmF0dXJlICovXHJcbiAgICAgICAgICAgIGludCB4cG9zID0ga2V5c2lnV2lkdGg7XHJcblxyXG4gICAgICAgICAgICBNdXNpY1N5bWJvbCBjdXJyID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIC8qIExvb3AgdGhyb3VnaCB0aGUgc3ltYm9scy4gXHJcbiAgICAgICAgICAgICAqIFVuc2hhZGUgc3ltYm9scyB3aGVyZSBzdGFydCA8PSBwcmV2UHVsc2VUaW1lIDwgZW5kXHJcbiAgICAgICAgICAgICAqIFNoYWRlIHN5bWJvbHMgd2hlcmUgc3RhcnQgPD0gY3VycmVudFB1bHNlVGltZSA8IGVuZFxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgaW50IHdpZHRoID0gMDtcclxuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCBzeW1ib2xzLkNvdW50OyBpKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGN1cnIgPSBzeW1ib2xzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnIgaXMgQmFyU3ltYm9sKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHhwb3MgKz0gY3Vyci5XaWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpbnQgc3RhcnQgPSBjdXJyLlN0YXJ0VGltZTtcclxuICAgICAgICAgICAgICAgIGludCBlbmQgPSAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgKyAyIDwgc3ltYm9scy5Db3VudCAmJiBzeW1ib2xzW2kgKyAxXSBpcyBCYXJTeW1ib2wpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5kID0gc3ltYm9sc1tpICsgMl0uU3RhcnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaSArIDEgPCBzeW1ib2xzLkNvdW50KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZCA9IHN5bWJvbHNbaSArIDFdLlN0YXJ0VGltZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBlbmQgPSBlbmR0aW1lO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAvKiBJZiB3ZSd2ZSBwYXN0IHRoZSBwcmV2aW91cyBhbmQgY3VycmVudCB0aW1lcywgd2UncmUgZG9uZS4gKi9cclxuICAgICAgICAgICAgICAgIGlmICgoc3RhcnQgPiBwcmV2UHVsc2VUaW1lKSAmJiAoc3RhcnQgPiBjdXJyZW50UHVsc2VUaW1lKSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoeF9zaGFkZSA9PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeF9zaGFkZSA9IHhwb3M7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvKiBJZiBzaGFkZWQgbm90ZXMgYXJlIHRoZSBzYW1lLCB3ZSdyZSBkb25lICovXHJcbiAgICAgICAgICAgICAgICBpZiAoKHN0YXJ0IDw9IGN1cnJlbnRQdWxzZVRpbWUpICYmIChjdXJyZW50UHVsc2VUaW1lIDwgZW5kKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgIChzdGFydCA8PSBwcmV2UHVsc2VUaW1lKSAmJiAocHJldlB1bHNlVGltZSA8IGVuZCkpXHJcbiAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHhfc2hhZGUgPSB4cG9zO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3aWR0aDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvKiBJZiBzeW1ib2wgaXMgaW4gdGhlIHByZXZpb3VzIHRpbWUsIGRyYXcgYSB3aGl0ZSBiYWNrZ3JvdW5kICovXHJcbiAgICAgICAgICAgICAgICBpZiAoKHN0YXJ0IDw9IHByZXZQdWxzZVRpbWUpICYmIChwcmV2UHVsc2VUaW1lIDwgZW5kKSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSh4cG9zIC0gMiwgLTIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGcuQ2xlYXJSZWN0YW5nbGUoMCwgMCwgY3Vyci5XaWR0aCArIDQsIHRoaXMuSGVpZ2h0ICsgNCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oLSh4cG9zIC0gMiksIDIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8qIElmIHN5bWJvbCBpcyBpbiB0aGUgY3VycmVudCB0aW1lLCBkcmF3IGEgc2hhZGVkIGJhY2tncm91bmQgKi9cclxuICAgICAgICAgICAgICAgIGlmICgoc3RhcnQgPD0gY3VycmVudFB1bHNlVGltZSkgJiYgKGN1cnJlbnRQdWxzZVRpbWUgPCBlbmQpKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoICs9IGN1cnIuV2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgeF9zaGFkZSA9IHhwb3M7XHJcbiAgICAgICAgICAgICAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oeHBvcywgMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKHNoYWRlQnJ1c2gsIDAsIDAsIGN1cnIuV2lkdGgsIHRoaXMuSGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgteHBvcywgMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgeHBvcyArPSBjdXJyLldpZHRoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB3aWR0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBSZXR1cm4gdGhlIHB1bHNlIHRpbWUgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW4gcG9pbnQuXHJcbiAgICAgICAgICogIEZpbmQgdGhlIG5vdGVzL3N5bWJvbHMgY29ycmVzcG9uZGluZyB0byB0aGUgeCBwb3NpdGlvbixcclxuICAgICAgICAgKiAgYW5kIHJldHVybiB0aGUgc3RhcnRUaW1lIChwdWxzZVRpbWUpIG9mIHRoZSBzeW1ib2wuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHVibGljIGludCBQdWxzZVRpbWVGb3JQb2ludChQb2ludCBwb2ludClcclxuICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICBpbnQgeHBvcyA9IGtleXNpZ1dpZHRoO1xyXG4gICAgICAgICAgICBpbnQgcHVsc2VUaW1lID0gc3RhcnR0aW1lO1xyXG4gICAgICAgICAgICBmb3JlYWNoIChNdXNpY1N5bWJvbCBzeW0gaW4gc3ltYm9scylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcHVsc2VUaW1lID0gc3ltLlN0YXJ0VGltZTtcclxuICAgICAgICAgICAgICAgIGlmIChwb2ludC5YIDw9IHhwb3MgKyBzeW0uV2lkdGgpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHB1bHNlVGltZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHhwb3MgKz0gc3ltLldpZHRoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwdWxzZVRpbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgb3ZlcnJpZGUgc3RyaW5nIFRvU3RyaW5nKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0cmluZyByZXN1bHQgPSBcIlN0YWZmIGNsZWY9XCIgKyBjbGVmc3ltLlRvU3RyaW5nKCkgKyBcIlxcblwiO1xyXG4gICAgICAgICAgICByZXN1bHQgKz0gXCIgIEtleXM6XFxuXCI7XHJcbiAgICAgICAgICAgIGZvcmVhY2ggKEFjY2lkU3ltYm9sIGEgaW4ga2V5cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IFwiICAgIFwiICsgYS5Ub1N0cmluZygpICsgXCJcXG5cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHQgKz0gXCIgIFN5bWJvbHM6XFxuXCI7XHJcbiAgICAgICAgICAgIGZvcmVhY2ggKE11c2ljU3ltYm9sIHMgaW4ga2V5cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IFwiICAgIFwiICsgcy5Ub1N0cmluZygpICsgXCJcXG5cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3JlYWNoIChNdXNpY1N5bWJvbCBtIGluIHN5bWJvbHMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBcIiAgICBcIiArIG0uVG9TdHJpbmcoKSArIFwiXFxuXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzdWx0ICs9IFwiRW5kIFN0YWZmXFxuXCI7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxufVxyXG5cclxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAwNy0yMDExIE1hZGhhdiBWYWlkeWFuYXRoYW5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuXG51c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uSU87XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xuXG4vKiogQGNsYXNzIFN0ZW1cbiAqIFRoZSBTdGVtIGNsYXNzIGlzIHVzZWQgYnkgQ2hvcmRTeW1ib2wgdG8gZHJhdyB0aGUgc3RlbSBwb3J0aW9uIG9mXG4gKiB0aGUgY2hvcmQuICBUaGUgc3RlbSBoYXMgdGhlIGZvbGxvd2luZyBmaWVsZHM6XG4gKlxuICogZHVyYXRpb24gIC0gVGhlIGR1cmF0aW9uIG9mIHRoZSBzdGVtLlxuICogZGlyZWN0aW9uIC0gRWl0aGVyIFVwIG9yIERvd25cbiAqIHNpZGUgICAgICAtIEVpdGhlciBsZWZ0IG9yIHJpZ2h0XG4gKiB0b3AgICAgICAgLSBUaGUgdG9wbW9zdCBub3RlIGluIHRoZSBjaG9yZFxuICogYm90dG9tICAgIC0gVGhlIGJvdHRvbW1vc3Qgbm90ZSBpbiB0aGUgY2hvcmRcbiAqIGVuZCAgICAgICAtIFRoZSBub3RlIHBvc2l0aW9uIHdoZXJlIHRoZSBzdGVtIGVuZHMuICBUaGlzIGlzIHVzdWFsbHlcbiAqICAgICAgICAgICAgIHNpeCBub3RlcyBwYXN0IHRoZSBsYXN0IG5vdGUgaW4gdGhlIGNob3JkLiAgRm9yIDh0aC8xNnRoXG4gKiAgICAgICAgICAgICBub3RlcywgdGhlIHN0ZW0gbXVzdCBleHRlbmQgZXZlbiBtb3JlLlxuICpcbiAqIFRoZSBTaGVldE11c2ljIGNsYXNzIGNhbiBjaGFuZ2UgdGhlIGRpcmVjdGlvbiBvZiBhIHN0ZW0gYWZ0ZXIgaXRcbiAqIGhhcyBiZWVuIGNyZWF0ZWQuICBUaGUgc2lkZSBhbmQgZW5kIGZpZWxkcyBtYXkgYWxzbyBjaGFuZ2UgZHVlIHRvXG4gKiB0aGUgZGlyZWN0aW9uIGNoYW5nZS4gIEJ1dCBvdGhlciBmaWVsZHMgd2lsbCBub3QgY2hhbmdlLlxuICovXG4gXG5wdWJsaWMgY2xhc3MgU3RlbSB7XG4gICAgcHVibGljIGNvbnN0IGludCBVcCA9ICAgMTsgICAgICAvKiBUaGUgc3RlbSBwb2ludHMgdXAgKi9cbiAgICBwdWJsaWMgY29uc3QgaW50IERvd24gPSAyOyAgICAgIC8qIFRoZSBzdGVtIHBvaW50cyBkb3duICovXG4gICAgcHVibGljIGNvbnN0IGludCBMZWZ0U2lkZSA9IDE7ICAvKiBUaGUgc3RlbSBpcyB0byB0aGUgbGVmdCBvZiB0aGUgbm90ZSAqL1xuICAgIHB1YmxpYyBjb25zdCBpbnQgUmlnaHRTaWRlID0gMjsgLyogVGhlIHN0ZW0gaXMgdG8gdGhlIHJpZ2h0IG9mIHRoZSBub3RlICovXG5cbiAgICBwcml2YXRlIE5vdGVEdXJhdGlvbiBkdXJhdGlvbjsgLyoqIER1cmF0aW9uIG9mIHRoZSBzdGVtLiAqL1xuICAgIHByaXZhdGUgaW50IGRpcmVjdGlvbjsgICAgICAgICAvKiogVXAsIERvd24sIG9yIE5vbmUgKi9cbiAgICBwcml2YXRlIFdoaXRlTm90ZSB0b3A7ICAgICAgICAgLyoqIFRvcG1vc3Qgbm90ZSBpbiBjaG9yZCAqL1xuICAgIHByaXZhdGUgV2hpdGVOb3RlIGJvdHRvbTsgICAgICAvKiogQm90dG9tbW9zdCBub3RlIGluIGNob3JkICovXG4gICAgcHJpdmF0ZSBXaGl0ZU5vdGUgZW5kOyAgICAgICAgIC8qKiBMb2NhdGlvbiBvZiBlbmQgb2YgdGhlIHN0ZW0gKi9cbiAgICBwcml2YXRlIGJvb2wgbm90ZXNvdmVybGFwOyAgICAgLyoqIERvIHRoZSBjaG9yZCBub3RlcyBvdmVybGFwICovXG4gICAgcHJpdmF0ZSBpbnQgc2lkZTsgICAgICAgICAgICAgIC8qKiBMZWZ0IHNpZGUgb3IgcmlnaHQgc2lkZSBvZiBub3RlICovXG5cbiAgICBwcml2YXRlIFN0ZW0gcGFpcjsgICAgICAgICAgICAgIC8qKiBJZiBwYWlyICE9IG51bGwsIHRoaXMgaXMgYSBob3Jpem9udGFsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogYmVhbSBzdGVtIHRvIGFub3RoZXIgY2hvcmQgKi9cbiAgICBwcml2YXRlIGludCB3aWR0aF90b19wYWlyOyAgICAgIC8qKiBUaGUgd2lkdGggKGluIHBpeGVscykgdG8gdGhlIGNob3JkIHBhaXIgKi9cbiAgICBwcml2YXRlIGJvb2wgcmVjZWl2ZXJfaW5fcGFpcjsgIC8qKiBUaGlzIHN0ZW0gaXMgdGhlIHJlY2VpdmVyIG9mIGEgaG9yaXpvbnRhbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBiZWFtIHN0ZW0gZnJvbSBhbm90aGVyIGNob3JkLiAqL1xuXG4gICAgLyoqIEdldC9TZXQgdGhlIGRpcmVjdGlvbiBvZiB0aGUgc3RlbSAoVXAgb3IgRG93bikgKi9cbiAgICBwdWJsaWMgaW50IERpcmVjdGlvbiB7XG4gICAgICAgIGdldCB7IHJldHVybiBkaXJlY3Rpb247IH1cbiAgICAgICAgc2V0IHsgQ2hhbmdlRGlyZWN0aW9uKHZhbHVlKTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIGR1cmF0aW9uIG9mIHRoZSBzdGVtIChFaWd0aCwgU2l4dGVlbnRoLCBUaGlydHlTZWNvbmQpICovXG4gICAgcHVibGljIE5vdGVEdXJhdGlvbiBEdXJhdGlvbiB7XG4gICAgICAgIGdldCB7IHJldHVybiBkdXJhdGlvbjsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIHRvcCBub3RlIGluIHRoZSBjaG9yZC4gVGhpcyBpcyBuZWVkZWQgdG8gZGV0ZXJtaW5lIHRoZSBzdGVtIGRpcmVjdGlvbiAqL1xuICAgIHB1YmxpYyBXaGl0ZU5vdGUgVG9wIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHRvcDsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIGJvdHRvbSBub3RlIGluIHRoZSBjaG9yZC4gVGhpcyBpcyBuZWVkZWQgdG8gZGV0ZXJtaW5lIHRoZSBzdGVtIGRpcmVjdGlvbiAqL1xuICAgIHB1YmxpYyBXaGl0ZU5vdGUgQm90dG9tIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIGJvdHRvbTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQvU2V0IHRoZSBsb2NhdGlvbiB3aGVyZSB0aGUgc3RlbSBlbmRzLiAgVGhpcyBpcyB1c3VhbGx5IHNpeCBub3Rlc1xuICAgICAqIHBhc3QgdGhlIGxhc3Qgbm90ZSBpbiB0aGUgY2hvcmQuIFNlZSBtZXRob2QgQ2FsY3VsYXRlRW5kLlxuICAgICAqL1xuICAgIHB1YmxpYyBXaGl0ZU5vdGUgRW5kIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIGVuZDsgfVxuICAgICAgICBzZXQgeyBlbmQgPSB2YWx1ZTsgfVxuICAgIH1cblxuICAgIC8qKiBTZXQgdGhpcyBTdGVtIHRvIGJlIHRoZSByZWNlaXZlciBvZiBhIGhvcml6b250YWwgYmVhbSwgYXMgcGFydFxuICAgICAqIG9mIGEgY2hvcmQgcGFpci4gIEluIERyYXcoKSwgaWYgdGhpcyBzdGVtIGlzIGEgcmVjZWl2ZXIsIHdlXG4gICAgICogZG9uJ3QgZHJhdyBhIGN1cnZ5IHN0ZW0sIHdlIG9ubHkgZHJhdyB0aGUgdmVydGljYWwgbGluZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgYm9vbCBSZWNlaXZlciB7XG4gICAgICAgIGdldCB7IHJldHVybiByZWNlaXZlcl9pbl9wYWlyOyB9XG4gICAgICAgIHNldCB7IHJlY2VpdmVyX2luX3BhaXIgPSB2YWx1ZTsgfVxuICAgIH1cblxuICAgIC8qKiBDcmVhdGUgYSBuZXcgc3RlbS4gIFRoZSB0b3Agbm90ZSwgYm90dG9tIG5vdGUsIGFuZCBkaXJlY3Rpb24gYXJlIFxuICAgICAqIG5lZWRlZCBmb3IgZHJhd2luZyB0aGUgdmVydGljYWwgbGluZSBvZiB0aGUgc3RlbS4gIFRoZSBkdXJhdGlvbiBpcyBcbiAgICAgKiBuZWVkZWQgdG8gZHJhdyB0aGUgdGFpbCBvZiB0aGUgc3RlbS4gIFRoZSBvdmVybGFwIGJvb2xlYW4gaXMgdHJ1ZVxuICAgICAqIGlmIHRoZSBub3RlcyBpbiB0aGUgY2hvcmQgb3ZlcmxhcC4gIElmIHRoZSBub3RlcyBvdmVybGFwLCB0aGVcbiAgICAgKiBzdGVtIG11c3QgYmUgZHJhd24gb24gdGhlIHJpZ2h0IHNpZGUuXG4gICAgICovXG4gICAgcHVibGljIFN0ZW0oV2hpdGVOb3RlIGJvdHRvbSwgV2hpdGVOb3RlIHRvcCwgXG4gICAgICAgICAgICAgICAgTm90ZUR1cmF0aW9uIGR1cmF0aW9uLCBpbnQgZGlyZWN0aW9uLCBib29sIG92ZXJsYXApIHtcblxuICAgICAgICB0aGlzLnRvcCA9IHRvcDtcbiAgICAgICAgdGhpcy5ib3R0b20gPSBib3R0b207XG4gICAgICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgICAgIHRoaXMubm90ZXNvdmVybGFwID0gb3ZlcmxhcDtcbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PSBVcCB8fCBub3Rlc292ZXJsYXApXG4gICAgICAgICAgICBzaWRlID0gUmlnaHRTaWRlO1xuICAgICAgICBlbHNlIFxuICAgICAgICAgICAgc2lkZSA9IExlZnRTaWRlO1xuICAgICAgICBlbmQgPSBDYWxjdWxhdGVFbmQoKTtcbiAgICAgICAgcGFpciA9IG51bGw7XG4gICAgICAgIHdpZHRoX3RvX3BhaXIgPSAwO1xuICAgICAgICByZWNlaXZlcl9pbl9wYWlyID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqIENhbGN1bGF0ZSB0aGUgdmVydGljYWwgcG9zaXRpb24gKHdoaXRlIG5vdGUga2V5KSB3aGVyZSBcbiAgICAgKiB0aGUgc3RlbSBlbmRzIFxuICAgICAqL1xuICAgIHB1YmxpYyBXaGl0ZU5vdGUgQ2FsY3VsYXRlRW5kKCkge1xuICAgICAgICBpZiAoZGlyZWN0aW9uID09IFVwKSB7XG4gICAgICAgICAgICBXaGl0ZU5vdGUgdyA9IHRvcDtcbiAgICAgICAgICAgIHcgPSB3LkFkZCg2KTtcbiAgICAgICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uU2l4dGVlbnRoKSB7XG4gICAgICAgICAgICAgICAgdyA9IHcuQWRkKDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuICAgICAgICAgICAgICAgIHcgPSB3LkFkZCg0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRpcmVjdGlvbiA9PSBEb3duKSB7XG4gICAgICAgICAgICBXaGl0ZU5vdGUgdyA9IGJvdHRvbTtcbiAgICAgICAgICAgIHcgPSB3LkFkZCgtNik7XG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlNpeHRlZW50aCkge1xuICAgICAgICAgICAgICAgIHcgPSB3LkFkZCgtMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVGhpcnR5U2Vjb25kKSB7XG4gICAgICAgICAgICAgICAgdyA9IHcuQWRkKC00KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7ICAvKiBTaG91bGRuJ3QgaGFwcGVuICovXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogQ2hhbmdlIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHN0ZW0uICBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBieSBcbiAgICAgKiBDaG9yZFN5bWJvbC5NYWtlUGFpcigpLiAgV2hlbiB0d28gY2hvcmRzIGFyZSBqb2luZWQgYnkgYSBob3Jpem9udGFsXG4gICAgICogYmVhbSwgdGhlaXIgc3RlbXMgbXVzdCBwb2ludCBpbiB0aGUgc2FtZSBkaXJlY3Rpb24gKHVwIG9yIGRvd24pLlxuICAgICAqL1xuICAgIHB1YmxpYyB2b2lkIENoYW5nZURpcmVjdGlvbihpbnQgbmV3ZGlyZWN0aW9uKSB7XG4gICAgICAgIGRpcmVjdGlvbiA9IG5ld2RpcmVjdGlvbjtcbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PSBVcCB8fCBub3Rlc292ZXJsYXApXG4gICAgICAgICAgICBzaWRlID0gUmlnaHRTaWRlO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzaWRlID0gTGVmdFNpZGU7XG4gICAgICAgIGVuZCA9IENhbGN1bGF0ZUVuZCgpO1xuICAgIH1cblxuICAgIC8qKiBQYWlyIHRoaXMgc3RlbSB3aXRoIGFub3RoZXIgQ2hvcmQuICBJbnN0ZWFkIG9mIGRyYXdpbmcgYSBjdXJ2eSB0YWlsLFxuICAgICAqIHRoaXMgc3RlbSB3aWxsIG5vdyBoYXZlIHRvIGRyYXcgYSBiZWFtIHRvIHRoZSBnaXZlbiBzdGVtIHBhaXIuICBUaGVcbiAgICAgKiB3aWR0aCAoaW4gcGl4ZWxzKSB0byB0aGlzIHN0ZW0gcGFpciBpcyBwYXNzZWQgYXMgYXJndW1lbnQuXG4gICAgICovXG4gICAgcHVibGljIHZvaWQgU2V0UGFpcihTdGVtIHBhaXIsIGludCB3aWR0aF90b19wYWlyKSB7XG4gICAgICAgIHRoaXMucGFpciA9IHBhaXI7XG4gICAgICAgIHRoaXMud2lkdGhfdG9fcGFpciA9IHdpZHRoX3RvX3BhaXI7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB0cnVlIGlmIHRoaXMgU3RlbSBpcyBwYXJ0IG9mIGEgaG9yaXpvbnRhbCBiZWFtLiAqL1xuICAgIHB1YmxpYyBib29sIGlzQmVhbSB7XG4gICAgICAgIGdldCB7IHJldHVybiByZWNlaXZlcl9pbl9wYWlyIHx8IChwYWlyICE9IG51bGwpOyB9XG4gICAgfVxuXG4gICAgLyoqIERyYXcgdGhpcyBzdGVtLlxuICAgICAqIEBwYXJhbSB5dG9wIFRoZSB5IGxvY2F0aW9uIChpbiBwaXhlbHMpIHdoZXJlIHRoZSB0b3Agb2YgdGhlIHN0YWZmIHN0YXJ0cy5cbiAgICAgKiBAcGFyYW0gdG9wc3RhZmYgIFRoZSBub3RlIGF0IHRoZSB0b3Agb2YgdGhlIHN0YWZmLlxuICAgICAqL1xuICAgIHB1YmxpYyB2b2lkIERyYXcoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHl0b3AsIFdoaXRlTm90ZSB0b3BzdGFmZikge1xuICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLldob2xlKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIERyYXdWZXJ0aWNhbExpbmUoZywgcGVuLCB5dG9wLCB0b3BzdGFmZik7XG4gICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uUXVhcnRlciB8fCBcbiAgICAgICAgICAgIGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRRdWFydGVyIHx8IFxuICAgICAgICAgICAgZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLkhhbGYgfHxcbiAgICAgICAgICAgIGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRIYWxmIHx8XG4gICAgICAgICAgICByZWNlaXZlcl9pbl9wYWlyKSB7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYWlyICE9IG51bGwpXG4gICAgICAgICAgICBEcmF3SG9yaXpCYXJTdGVtKGcsIHBlbiwgeXRvcCwgdG9wc3RhZmYpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBEcmF3Q3VydnlTdGVtKGcsIHBlbiwgeXRvcCwgdG9wc3RhZmYpO1xuICAgIH1cblxuICAgIC8qKiBEcmF3IHRoZSB2ZXJ0aWNhbCBsaW5lIG9mIHRoZSBzdGVtIFxuICAgICAqIEBwYXJhbSB5dG9wIFRoZSB5IGxvY2F0aW9uIChpbiBwaXhlbHMpIHdoZXJlIHRoZSB0b3Agb2YgdGhlIHN0YWZmIHN0YXJ0cy5cbiAgICAgKiBAcGFyYW0gdG9wc3RhZmYgIFRoZSBub3RlIGF0IHRoZSB0b3Agb2YgdGhlIHN0YWZmLlxuICAgICAqL1xuICAgIHByaXZhdGUgdm9pZCBEcmF3VmVydGljYWxMaW5lKEdyYXBoaWNzIGcsIFBlbiBwZW4sIGludCB5dG9wLCBXaGl0ZU5vdGUgdG9wc3RhZmYpIHtcbiAgICAgICAgaW50IHhzdGFydDtcbiAgICAgICAgaWYgKHNpZGUgPT0gTGVmdFNpZGUpXG4gICAgICAgICAgICB4c3RhcnQgPSBTaGVldE11c2ljLkxpbmVTcGFjZS80ICsgMTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgeHN0YXJ0ID0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNCArIFNoZWV0TXVzaWMuTm90ZVdpZHRoO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT0gVXApIHtcbiAgICAgICAgICAgIGludCB5MSA9IHl0b3AgKyB0b3BzdGFmZi5EaXN0KGJvdHRvbSkgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQvMiBcbiAgICAgICAgICAgICAgICAgICAgICAgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQvNDtcblxuICAgICAgICAgICAgaW50IHlzdGVtID0geXRvcCArIHRvcHN0YWZmLkRpc3QoZW5kKSAqIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yO1xuXG4gICAgICAgICAgICBnLkRyYXdMaW5lKHBlbiwgeHN0YXJ0LCB5MSwgeHN0YXJ0LCB5c3RlbSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGlyZWN0aW9uID09IERvd24pIHtcbiAgICAgICAgICAgIGludCB5MSA9IHl0b3AgKyB0b3BzdGFmZi5EaXN0KHRvcCkgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQvMiBcbiAgICAgICAgICAgICAgICAgICAgICAgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG5cbiAgICAgICAgICAgIGlmIChzaWRlID09IExlZnRTaWRlKVxuICAgICAgICAgICAgICAgIHkxID0geTEgLSBTaGVldE11c2ljLk5vdGVIZWlnaHQvNDtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB5MSA9IHkxIC0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7XG5cbiAgICAgICAgICAgIGludCB5c3RlbSA9IHl0b3AgKyB0b3BzdGFmZi5EaXN0KGVuZCkgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQvMiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG5cbiAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuLCB4c3RhcnQsIHkxLCB4c3RhcnQsIHlzdGVtKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBEcmF3IGEgY3Vydnkgc3RlbSB0YWlsLiAgVGhpcyBpcyBvbmx5IHVzZWQgZm9yIHNpbmdsZSBjaG9yZHMsIG5vdCBjaG9yZCBwYWlycy5cbiAgICAgKiBAcGFyYW0geXRvcCBUaGUgeSBsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICogQHBhcmFtIHRvcHN0YWZmICBUaGUgbm90ZSBhdCB0aGUgdG9wIG9mIHRoZSBzdGFmZi5cbiAgICAgKi9cbiAgICBwcml2YXRlIHZvaWQgRHJhd0N1cnZ5U3RlbShHcmFwaGljcyBnLCBQZW4gcGVuLCBpbnQgeXRvcCwgV2hpdGVOb3RlIHRvcHN0YWZmKSB7XG5cbiAgICAgICAgcGVuLldpZHRoID0gMjtcblxuICAgICAgICBpbnQgeHN0YXJ0ID0gMDtcbiAgICAgICAgaWYgKHNpZGUgPT0gTGVmdFNpZGUpXG4gICAgICAgICAgICB4c3RhcnQgPSBTaGVldE11c2ljLkxpbmVTcGFjZS80ICsgMTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgeHN0YXJ0ID0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNCArIFNoZWV0TXVzaWMuTm90ZVdpZHRoO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT0gVXApIHtcbiAgICAgICAgICAgIGludCB5c3RlbSA9IHl0b3AgKyB0b3BzdGFmZi5EaXN0KGVuZCkgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQvMjtcblxuXG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLkVpZ2h0aCB8fFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRFaWdodGggfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVHJpcGxldCB8fFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5TaXh0ZWVudGggfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVGhpcnR5U2Vjb25kKSB7XG5cbiAgICAgICAgICAgICAgICBnLkRyYXdCZXppZXIocGVuLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0LCB5c3RlbSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeXN0ZW0gKyAzKlNoZWV0TXVzaWMuTGluZVNwYWNlLzIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCArIFNoZWV0TXVzaWMuTGluZVNwYWNlKjIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5c3RlbSArIFNoZWV0TXVzaWMuTm90ZUhlaWdodCoyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQgKyBTaGVldE11c2ljLkxpbmVTcGFjZS8yLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeXN0ZW0gKyBTaGVldE11c2ljLk5vdGVIZWlnaHQqMyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB5c3RlbSArPSBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG5cbiAgICAgICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uU2l4dGVlbnRoIHx8XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuXG4gICAgICAgICAgICAgICAgZy5EcmF3QmV6aWVyKHBlbiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCwgeXN0ZW0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlzdGVtICsgMypTaGVldE11c2ljLkxpbmVTcGFjZS8yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQgKyBTaGVldE11c2ljLkxpbmVTcGFjZSoyLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeXN0ZW0gKyBTaGVldE11c2ljLk5vdGVIZWlnaHQqMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0ICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UvMiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlzdGVtICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0KjMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB5c3RlbSArPSBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuICAgICAgICAgICAgICAgIGcuRHJhd0JlemllcihwZW4sIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQsIHlzdGVtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5c3RlbSArIDMqU2hlZXRNdXNpYy5MaW5lU3BhY2UvMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0ICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UqMiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlzdGVtICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0KjIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5c3RlbSArIFNoZWV0TXVzaWMuTm90ZUhlaWdodCozKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoZGlyZWN0aW9uID09IERvd24pIHtcbiAgICAgICAgICAgIGludCB5c3RlbSA9IHl0b3AgKyB0b3BzdGFmZi5EaXN0KGVuZCkqU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuXG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLkVpZ2h0aCB8fFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRFaWdodGggfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVHJpcGxldCB8fFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5TaXh0ZWVudGggfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVGhpcnR5U2Vjb25kKSB7XG5cbiAgICAgICAgICAgICAgICBnLkRyYXdCZXppZXIocGVuLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0LCB5c3RlbSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeXN0ZW0gLSBTaGVldE11c2ljLkxpbmVTcGFjZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0ICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UqMiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlzdGVtIC0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0KjIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCArIFNoZWV0TXVzaWMuTGluZVNwYWNlLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeXN0ZW0gLSBTaGVldE11c2ljLk5vdGVIZWlnaHQqMiAtIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTGluZVNwYWNlLzIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeXN0ZW0gLT0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuXG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlNpeHRlZW50aCB8fFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5UaGlydHlTZWNvbmQpIHtcblxuICAgICAgICAgICAgICAgIGcuRHJhd0JlemllcihwZW4sIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQsIHlzdGVtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5c3RlbSAtIFNoZWV0TXVzaWMuTGluZVNwYWNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQgKyBTaGVldE11c2ljLkxpbmVTcGFjZSoyLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeXN0ZW0gLSBTaGVldE11c2ljLk5vdGVIZWlnaHQqMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0ICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5c3RlbSAtIFNoZWV0TXVzaWMuTm90ZUhlaWdodCoyIC0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5MaW5lU3BhY2UvMik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHlzdGVtIC09IFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcbiAgICAgICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVGhpcnR5U2Vjb25kKSB7XG4gICAgICAgICAgICAgICAgZy5EcmF3QmV6aWVyKHBlbiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCwgeXN0ZW0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlzdGVtIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCArIFNoZWV0TXVzaWMuTGluZVNwYWNlKjIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5c3RlbSAtIFNoZWV0TXVzaWMuTm90ZUhlaWdodCoyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQgKyBTaGVldE11c2ljLkxpbmVTcGFjZSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlzdGVtIC0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0KjIgLSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLkxpbmVTcGFjZS8yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICAgIHBlbi5XaWR0aCA9IDE7XG5cbiAgICB9XG5cbiAgICAvKiBEcmF3IGEgaG9yaXpvbnRhbCBiZWFtIHN0ZW0sIGNvbm5lY3RpbmcgdGhpcyBzdGVtIHdpdGggdGhlIFN0ZW0gcGFpci5cbiAgICAgKiBAcGFyYW0geXRvcCBUaGUgeSBsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICogQHBhcmFtIHRvcHN0YWZmICBUaGUgbm90ZSBhdCB0aGUgdG9wIG9mIHRoZSBzdGFmZi5cbiAgICAgKi9cbiAgICBwcml2YXRlIHZvaWQgRHJhd0hvcml6QmFyU3RlbShHcmFwaGljcyBnLCBQZW4gcGVuLCBpbnQgeXRvcCwgV2hpdGVOb3RlIHRvcHN0YWZmKSB7XG4gICAgICAgIHBlbi5XaWR0aCA9IFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yO1xuXG4gICAgICAgIGludCB4c3RhcnQgPSAwO1xuICAgICAgICBpbnQgeHN0YXJ0MiA9IDA7XG5cbiAgICAgICAgaWYgKHNpZGUgPT0gTGVmdFNpZGUpXG4gICAgICAgICAgICB4c3RhcnQgPSBTaGVldE11c2ljLkxpbmVTcGFjZS80ICsgMTtcbiAgICAgICAgZWxzZSBpZiAoc2lkZSA9PSBSaWdodFNpZGUpXG4gICAgICAgICAgICB4c3RhcnQgPSBTaGVldE11c2ljLkxpbmVTcGFjZS80ICsgU2hlZXRNdXNpYy5Ob3RlV2lkdGg7XG5cbiAgICAgICAgaWYgKHBhaXIuc2lkZSA9PSBMZWZ0U2lkZSlcbiAgICAgICAgICAgIHhzdGFydDIgPSBTaGVldE11c2ljLkxpbmVTcGFjZS80ICsgMTtcbiAgICAgICAgZWxzZSBpZiAocGFpci5zaWRlID09IFJpZ2h0U2lkZSlcbiAgICAgICAgICAgIHhzdGFydDIgPSBTaGVldE11c2ljLkxpbmVTcGFjZS80ICsgU2hlZXRNdXNpYy5Ob3RlV2lkdGg7XG5cblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09IFVwKSB7XG4gICAgICAgICAgICBpbnQgeGVuZCA9IHdpZHRoX3RvX3BhaXIgKyB4c3RhcnQyO1xuICAgICAgICAgICAgaW50IHlzdGFydCA9IHl0b3AgKyB0b3BzdGFmZi5EaXN0KGVuZCkgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQvMjtcbiAgICAgICAgICAgIGludCB5ZW5kID0geXRvcCArIHRvcHN0YWZmLkRpc3QocGFpci5lbmQpICogU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7XG5cbiAgICAgICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uRWlnaHRoIHx8XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLkRvdHRlZEVpZ2h0aCB8fCBcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVHJpcGxldCB8fCBcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uU2l4dGVlbnRoIHx8XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuXG4gICAgICAgICAgICAgICAgZy5EcmF3TGluZShwZW4sIHhzdGFydCwgeXN0YXJ0LCB4ZW5kLCB5ZW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHlzdGFydCArPSBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG4gICAgICAgICAgICB5ZW5kICs9IFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcblxuICAgICAgICAgICAgLyogQSBkb3R0ZWQgZWlnaHRoIHdpbGwgY29ubmVjdCB0byBhIDE2dGggbm90ZS4gKi9cbiAgICAgICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uRG90dGVkRWlnaHRoKSB7XG4gICAgICAgICAgICAgICAgaW50IHggPSB4ZW5kIC0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICAgICAgICAgIGRvdWJsZSBzbG9wZSA9ICh5ZW5kIC0geXN0YXJ0KSAqIDEuMCAvICh4ZW5kIC0geHN0YXJ0KTtcbiAgICAgICAgICAgICAgICBpbnQgeSA9IChpbnQpKHNsb3BlICogKHggLSB4ZW5kKSArIHllbmQpOyBcblxuICAgICAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuLCB4LCB5LCB4ZW5kLCB5ZW5kKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5TaXh0ZWVudGggfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVGhpcnR5U2Vjb25kKSB7XG5cbiAgICAgICAgICAgICAgICBnLkRyYXdMaW5lKHBlbiwgeHN0YXJ0LCB5c3RhcnQsIHhlbmQsIHllbmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeXN0YXJ0ICs9IFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcbiAgICAgICAgICAgIHllbmQgKz0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuICAgICAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuLCB4c3RhcnQsIHlzdGFydCwgeGVuZCwgeWVuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGludCB4ZW5kID0gd2lkdGhfdG9fcGFpciArIHhzdGFydDI7XG4gICAgICAgICAgICBpbnQgeXN0YXJ0ID0geXRvcCArIHRvcHN0YWZmLkRpc3QoZW5kKSAqIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICAgICAgaW50IHllbmQgPSB5dG9wICsgdG9wc3RhZmYuRGlzdChwYWlyLmVuZCkgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQvMiBcbiAgICAgICAgICAgICAgICAgICAgICAgICArIFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcblxuICAgICAgICAgICAgaWYgKGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5FaWdodGggfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uRG90dGVkRWlnaHRoIHx8XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRyaXBsZXQgfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uU2l4dGVlbnRoIHx8XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuXG4gICAgICAgICAgICAgICAgZy5EcmF3TGluZShwZW4sIHhzdGFydCwgeXN0YXJ0LCB4ZW5kLCB5ZW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHlzdGFydCAtPSBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG4gICAgICAgICAgICB5ZW5kIC09IFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcblxuICAgICAgICAgICAgLyogQSBkb3R0ZWQgZWlnaHRoIHdpbGwgY29ubmVjdCB0byBhIDE2dGggbm90ZS4gKi9cbiAgICAgICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uRG90dGVkRWlnaHRoKSB7XG4gICAgICAgICAgICAgICAgaW50IHggPSB4ZW5kIC0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICAgICAgICAgIGRvdWJsZSBzbG9wZSA9ICh5ZW5kIC0geXN0YXJ0KSAqIDEuMCAvICh4ZW5kIC0geHN0YXJ0KTtcbiAgICAgICAgICAgICAgICBpbnQgeSA9IChpbnQpKHNsb3BlICogKHggLSB4ZW5kKSArIHllbmQpOyBcblxuICAgICAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuLCB4LCB5LCB4ZW5kLCB5ZW5kKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5TaXh0ZWVudGggfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVGhpcnR5U2Vjb25kKSB7XG5cbiAgICAgICAgICAgICAgICBnLkRyYXdMaW5lKHBlbiwgeHN0YXJ0LCB5c3RhcnQsIHhlbmQsIHllbmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeXN0YXJ0IC09IFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcbiAgICAgICAgICAgIHllbmQgLT0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuICAgICAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuLCB4c3RhcnQsIHlzdGFydCwgeGVuZCwgeWVuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcGVuLldpZHRoID0gMTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb3ZlcnJpZGUgc3RyaW5nIFRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gc3RyaW5nLkZvcm1hdChcIlN0ZW0gZHVyYXRpb249ezB9IGRpcmVjdGlvbj17MX0gdG9wPXsyfSBib3R0b209ezN9IGVuZD17NH1cIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIG92ZXJsYXA9ezV9IHNpZGU9ezZ9IHdpZHRoX3RvX3BhaXI9ezd9IHJlY2VpdmVyX2luX3BhaXI9ezh9XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uLCBkaXJlY3Rpb24sIHRvcC5Ub1N0cmluZygpLCBib3R0b20uVG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kLlRvU3RyaW5nKCksIG5vdGVzb3ZlcmxhcCwgc2lkZSwgd2lkdGhfdG9fcGFpciwgcmVjZWl2ZXJfaW5fcGFpcik7XG4gICAgfVxuXG59IFxuXG5cbn1cblxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAwNy0yMDExIE1hZGhhdiBWYWlkeWFuYXRoYW5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuXG51c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uSU87XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljIHtcblxuLyoqIEBjbGFzcyBTeW1ib2xXaWR0aHNcbiAqIFRoZSBTeW1ib2xXaWR0aHMgY2xhc3MgaXMgdXNlZCB0byB2ZXJ0aWNhbGx5IGFsaWduIG5vdGVzIGluIGRpZmZlcmVudFxuICogdHJhY2tzIHRoYXQgb2NjdXIgYXQgdGhlIHNhbWUgdGltZSAodGhhdCBoYXZlIHRoZSBzYW1lIHN0YXJ0dGltZSkuXG4gKiBUaGlzIGlzIGRvbmUgYnkgdGhlIGZvbGxvd2luZzpcbiAqIC0gU3RvcmUgYSBsaXN0IG9mIGFsbCB0aGUgc3RhcnQgdGltZXMuXG4gKiAtIFN0b3JlIHRoZSB3aWR0aCBvZiBzeW1ib2xzIGZvciBlYWNoIHN0YXJ0IHRpbWUsIGZvciBlYWNoIHRyYWNrLlxuICogLSBTdG9yZSB0aGUgbWF4aW11bSB3aWR0aCBmb3IgZWFjaCBzdGFydCB0aW1lLCBhY3Jvc3MgYWxsIHRyYWNrcy5cbiAqIC0gR2V0IHRoZSBleHRyYSB3aWR0aCBuZWVkZWQgZm9yIGVhY2ggdHJhY2sgdG8gbWF0Y2ggdGhlIG1heGltdW1cbiAqICAgd2lkdGggZm9yIHRoYXQgc3RhcnQgdGltZS5cbiAqXG4gKiBTZWUgbWV0aG9kIFNoZWV0TXVzaWMuQWxpZ25TeW1ib2xzKCksIHdoaWNoIHVzZXMgdGhpcyBjbGFzcy5cbiAqL1xuXG5wdWJsaWMgY2xhc3MgU3ltYm9sV2lkdGhzIHtcblxuICAgIC8qKiBBcnJheSBvZiBtYXBzIChzdGFydHRpbWUgLT4gc3ltYm9sIHdpZHRoKSwgb25lIHBlciB0cmFjayAqL1xuICAgIHByaXZhdGUgRGljdGlvbmFyeTxpbnQsIGludD5bXSB3aWR0aHM7XG5cbiAgICAvKiogTWFwIG9mIHN0YXJ0dGltZSAtPiBtYXhpbXVtIHN5bWJvbCB3aWR0aCAqL1xuICAgIHByaXZhdGUgRGljdGlvbmFyeTxpbnQsIGludD4gbWF4d2lkdGhzO1xuXG4gICAgLyoqIEFuIGFycmF5IG9mIGFsbCB0aGUgc3RhcnR0aW1lcywgaW4gYWxsIHRyYWNrcyAqL1xuICAgIHByaXZhdGUgaW50W10gc3RhcnR0aW1lcztcblxuXG4gICAgLyoqIEluaXRpYWxpemUgdGhlIHN5bWJvbCB3aWR0aCBtYXBzLCBnaXZlbiBhbGwgdGhlIHN5bWJvbHMgaW5cbiAgICAgKiBhbGwgdGhlIHRyYWNrcywgcGx1cyB0aGUgbHlyaWNzIGluIGFsbCB0cmFja3MuXG4gICAgICovXG4gICAgcHVibGljIFN5bWJvbFdpZHRocyhMaXN0PE11c2ljU3ltYm9sPltdIHRyYWNrcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIExpc3Q8THlyaWNTeW1ib2w+W10gdHJhY2tseXJpY3MpIHtcblxuICAgICAgICAvKiBHZXQgdGhlIHN5bWJvbCB3aWR0aHMgZm9yIGFsbCB0aGUgdHJhY2tzICovXG4gICAgICAgIHdpZHRocyA9IG5ldyBEaWN0aW9uYXJ5PGludCxpbnQ+WyB0cmFja3MuTGVuZ3RoIF07XG4gICAgICAgIGZvciAoaW50IHRyYWNrID0gMDsgdHJhY2sgPCB0cmFja3MuTGVuZ3RoOyB0cmFjaysrKSB7XG4gICAgICAgICAgICB3aWR0aHNbdHJhY2tdID0gR2V0VHJhY2tXaWR0aHModHJhY2tzW3RyYWNrXSk7XG4gICAgICAgIH1cbiAgICAgICAgbWF4d2lkdGhzID0gbmV3IERpY3Rpb25hcnk8aW50LGludD4oKTtcblxuICAgICAgICAvKiBDYWxjdWxhdGUgdGhlIG1heGltdW0gc3ltYm9sIHdpZHRocyAqL1xuICAgICAgICBmb3JlYWNoIChEaWN0aW9uYXJ5PGludCxpbnQ+IGRpY3QgaW4gd2lkdGhzKSB7XG4gICAgICAgICAgICBmb3JlYWNoIChpbnQgdGltZSBpbiBkaWN0LktleXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIW1heHdpZHRocy5Db250YWluc0tleSh0aW1lKSB8fFxuICAgICAgICAgICAgICAgICAgICAobWF4d2lkdGhzW3RpbWVdIDwgZGljdFt0aW1lXSkgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgbWF4d2lkdGhzW3RpbWVdID0gZGljdFt0aW1lXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHJhY2tseXJpY3MgIT0gbnVsbCkge1xuICAgICAgICAgICAgZm9yZWFjaCAoTGlzdDxMeXJpY1N5bWJvbD4gbHlyaWNzIGluIHRyYWNrbHlyaWNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGx5cmljcyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3JlYWNoIChMeXJpY1N5bWJvbCBseXJpYyBpbiBseXJpY3MpIHtcbiAgICAgICAgICAgICAgICAgICAgaW50IHdpZHRoID0gbHlyaWMuTWluV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGludCB0aW1lID0gbHlyaWMuU3RhcnRUaW1lO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1heHdpZHRocy5Db250YWluc0tleSh0aW1lKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKG1heHdpZHRoc1t0aW1lXSA8IHdpZHRoKSApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4d2lkdGhzW3RpbWVdID0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTdG9yZSBhbGwgdGhlIHN0YXJ0IHRpbWVzIHRvIHRoZSBzdGFydHRpbWUgYXJyYXkgKi9cbiAgICAgICAgc3RhcnR0aW1lcyA9IG5ldyBpbnRbIG1heHdpZHRocy5LZXlzLkNvdW50IF07XG4gICAgICAgIG1heHdpZHRocy5LZXlzLkNvcHlUbyhzdGFydHRpbWVzLCAwKTtcbiAgICAgICAgQXJyYXkuU29ydDxpbnQ+KHN0YXJ0dGltZXMpO1xuICAgIH1cblxuICAgIC8qKiBDcmVhdGUgYSB0YWJsZSBvZiB0aGUgc3ltYm9sIHdpZHRocyBmb3IgZWFjaCBzdGFydHRpbWUgaW4gdGhlIHRyYWNrLiAqL1xuICAgIHByaXZhdGUgc3RhdGljIERpY3Rpb25hcnk8aW50LGludD4gR2V0VHJhY2tXaWR0aHMoTGlzdDxNdXNpY1N5bWJvbD4gc3ltYm9scykge1xuICAgICAgICBEaWN0aW9uYXJ5PGludCxpbnQ+IHdpZHRocyA9IG5ldyBEaWN0aW9uYXJ5PGludCxpbnQ+KCk7XG5cbiAgICAgICAgZm9yZWFjaCAoTXVzaWNTeW1ib2wgbSBpbiBzeW1ib2xzKSB7XG4gICAgICAgICAgICBpbnQgc3RhcnQgPSBtLlN0YXJ0VGltZTtcbiAgICAgICAgICAgIGludCB3ID0gbS5NaW5XaWR0aDtcblxuICAgICAgICAgICAgaWYgKG0gaXMgQmFyU3ltYm9sKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh3aWR0aHMuQ29udGFpbnNLZXkoc3RhcnQpKSB7XG4gICAgICAgICAgICAgICAgd2lkdGhzW3N0YXJ0XSArPSB3O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgd2lkdGhzW3N0YXJ0XSA9IHc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHdpZHRocztcbiAgICB9XG5cbiAgICAvKiogR2l2ZW4gYSB0cmFjayBhbmQgYSBzdGFydCB0aW1lLCByZXR1cm4gdGhlIGV4dHJhIHdpZHRoIG5lZWRlZCBzbyB0aGF0XG4gICAgICogdGhlIHN5bWJvbHMgZm9yIHRoYXQgc3RhcnQgdGltZSBhbGlnbiB3aXRoIHRoZSBvdGhlciB0cmFja3MuXG4gICAgICovXG4gICAgcHVibGljIGludCBHZXRFeHRyYVdpZHRoKGludCB0cmFjaywgaW50IHN0YXJ0KSB7XG4gICAgICAgIGlmICghd2lkdGhzW3RyYWNrXS5Db250YWluc0tleShzdGFydCkpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXh3aWR0aHNbc3RhcnRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG1heHdpZHRoc1tzdGFydF0gLSB3aWR0aHNbdHJhY2tdW3N0YXJ0XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gYW4gYXJyYXkgb2YgYWxsIHRoZSBzdGFydCB0aW1lcyBpbiBhbGwgdGhlIHRyYWNrcyAqL1xuICAgIHB1YmxpYyBpbnRbXSBTdGFydFRpbWVzIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHN0YXJ0dGltZXM7IH1cbiAgICB9XG5cblxuXG5cbn1cblxuXG59XG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTEgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyB7XG5cbi8qKiBUaGUgcG9zc2libGUgbm90ZSBkdXJhdGlvbnMgKi9cbnB1YmxpYyBlbnVtIE5vdGVEdXJhdGlvbiB7XG4gIFRoaXJ0eVNlY29uZCwgU2l4dGVlbnRoLCBUcmlwbGV0LCBFaWdodGgsXG4gIERvdHRlZEVpZ2h0aCwgUXVhcnRlciwgRG90dGVkUXVhcnRlcixcbiAgSGFsZiwgRG90dGVkSGFsZiwgV2hvbGVcbn07XG5cbi8qKiBAY2xhc3MgVGltZVNpZ25hdHVyZVxuICogVGhlIFRpbWVTaWduYXR1cmUgY2xhc3MgcmVwcmVzZW50c1xuICogLSBUaGUgdGltZSBzaWduYXR1cmUgb2YgdGhlIHNvbmcsIHN1Y2ggYXMgNC80LCAzLzQsIG9yIDYvOCB0aW1lLCBhbmRcbiAqIC0gVGhlIG51bWJlciBvZiBwdWxzZXMgcGVyIHF1YXJ0ZXIgbm90ZVxuICogLSBUaGUgbnVtYmVyIG9mIG1pY3Jvc2Vjb25kcyBwZXIgcXVhcnRlciBub3RlXG4gKlxuICogSW4gbWlkaSBmaWxlcywgYWxsIHRpbWUgaXMgbWVhc3VyZWQgaW4gXCJwdWxzZXNcIi4gIEVhY2ggbm90ZSBoYXNcbiAqIGEgc3RhcnQgdGltZSAobWVhc3VyZWQgaW4gcHVsc2VzKSwgYW5kIGEgZHVyYXRpb24gKG1lYXN1cmVkIGluIFxuICogcHVsc2VzKS4gIFRoaXMgY2xhc3MgaXMgdXNlZCBtYWlubHkgdG8gY29udmVydCBwdWxzZSBkdXJhdGlvbnNcbiAqIChsaWtlIDEyMCwgMjQwLCBldGMpIGludG8gbm90ZSBkdXJhdGlvbnMgKGhhbGYsIHF1YXJ0ZXIsIGVpZ2h0aCwgZXRjKS5cbiAqL1xuXG5wdWJsaWMgY2xhc3MgVGltZVNpZ25hdHVyZSB7XG4gICAgcHJpdmF0ZSBpbnQgbnVtZXJhdG9yOyAgICAgIC8qKiBOdW1lcmF0b3Igb2YgdGhlIHRpbWUgc2lnbmF0dXJlICovXG4gICAgcHJpdmF0ZSBpbnQgZGVub21pbmF0b3I7ICAgIC8qKiBEZW5vbWluYXRvciBvZiB0aGUgdGltZSBzaWduYXR1cmUgKi9cbiAgICBwcml2YXRlIGludCBxdWFydGVybm90ZTsgICAgLyoqIE51bWJlciBvZiBwdWxzZXMgcGVyIHF1YXJ0ZXIgbm90ZSAqL1xuICAgIHByaXZhdGUgaW50IG1lYXN1cmU7ICAgICAgICAvKiogTnVtYmVyIG9mIHB1bHNlcyBwZXIgbWVhc3VyZSAqL1xuICAgIHByaXZhdGUgaW50IHRlbXBvOyAgICAgICAgICAvKiogTnVtYmVyIG9mIG1pY3Jvc2Vjb25kcyBwZXIgcXVhcnRlciBub3RlICovXG5cbiAgICAvKiogR2V0IHRoZSBudW1lcmF0b3Igb2YgdGhlIHRpbWUgc2lnbmF0dXJlICovXG4gICAgcHVibGljIGludCBOdW1lcmF0b3Ige1xuICAgICAgICBnZXQgeyByZXR1cm4gbnVtZXJhdG9yOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgZGVub21pbmF0b3Igb2YgdGhlIHRpbWUgc2lnbmF0dXJlICovXG4gICAgcHVibGljIGludCBEZW5vbWluYXRvciB7XG4gICAgICAgIGdldCB7IHJldHVybiBkZW5vbWluYXRvcjsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBwdWxzZXMgcGVyIHF1YXJ0ZXIgbm90ZSAqL1xuICAgIHB1YmxpYyBpbnQgUXVhcnRlciB7XG4gICAgICAgIGdldCB7IHJldHVybiBxdWFydGVybm90ZTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBwdWxzZXMgcGVyIG1lYXN1cmUgKi9cbiAgICBwdWJsaWMgaW50IE1lYXN1cmUge1xuICAgICAgICBnZXQgeyByZXR1cm4gbWVhc3VyZTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBtaWNyb3NlY29uZHMgcGVyIHF1YXJ0ZXIgbm90ZSAqLyBcbiAgICBwdWJsaWMgaW50IFRlbXBvIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHRlbXBvOyB9XG4gICAgfVxuXG4gICAgLyoqIENyZWF0ZSBhIG5ldyB0aW1lIHNpZ25hdHVyZSwgd2l0aCB0aGUgZ2l2ZW4gbnVtZXJhdG9yLFxuICAgICAqIGRlbm9taW5hdG9yLCBwdWxzZXMgcGVyIHF1YXJ0ZXIgbm90ZSwgYW5kIHRlbXBvLlxuICAgICAqL1xuICAgIHB1YmxpYyBUaW1lU2lnbmF0dXJlKGludCBudW1lcmF0b3IsIGludCBkZW5vbWluYXRvciwgaW50IHF1YXJ0ZXJub3RlLCBpbnQgdGVtcG8pIHtcbiAgICAgICAgaWYgKG51bWVyYXRvciA8PSAwIHx8IGRlbm9taW5hdG9yIDw9IDAgfHwgcXVhcnRlcm5vdGUgPD0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1pZGlGaWxlRXhjZXB0aW9uKFwiSW52YWxpZCB0aW1lIHNpZ25hdHVyZVwiLCAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIE1pZGkgRmlsZSBnaXZlcyB3cm9uZyB0aW1lIHNpZ25hdHVyZSBzb21ldGltZXMgKi9cbiAgICAgICAgaWYgKG51bWVyYXRvciA9PSA1KSB7XG4gICAgICAgICAgICBudW1lcmF0b3IgPSA0O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5udW1lcmF0b3IgPSBudW1lcmF0b3I7XG4gICAgICAgIHRoaXMuZGVub21pbmF0b3IgPSBkZW5vbWluYXRvcjtcbiAgICAgICAgdGhpcy5xdWFydGVybm90ZSA9IHF1YXJ0ZXJub3RlO1xuICAgICAgICB0aGlzLnRlbXBvID0gdGVtcG87XG5cbiAgICAgICAgaW50IGJlYXQ7XG4gICAgICAgIGlmIChkZW5vbWluYXRvciA8IDQpXG4gICAgICAgICAgICBiZWF0ID0gcXVhcnRlcm5vdGUgKiAyO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBiZWF0ID0gcXVhcnRlcm5vdGUgLyAoZGVub21pbmF0b3IvNCk7XG5cbiAgICAgICAgbWVhc3VyZSA9IG51bWVyYXRvciAqIGJlYXQ7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB3aGljaCBtZWFzdXJlIHRoZSBnaXZlbiB0aW1lIChpbiBwdWxzZXMpIGJlbG9uZ3MgdG8uICovXG4gICAgcHVibGljIGludCBHZXRNZWFzdXJlKGludCB0aW1lKSB7XG4gICAgICAgIHJldHVybiB0aW1lIC8gbWVhc3VyZTtcbiAgICB9XG5cbiAgICAvKiogR2l2ZW4gYSBkdXJhdGlvbiBpbiBwdWxzZXMsIHJldHVybiB0aGUgY2xvc2VzdCBub3RlIGR1cmF0aW9uLiAqL1xuICAgIHB1YmxpYyBOb3RlRHVyYXRpb24gR2V0Tm90ZUR1cmF0aW9uKGludCBkdXJhdGlvbikge1xuICAgICAgICBpbnQgd2hvbGUgPSBxdWFydGVybm90ZSAqIDQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAxICAgICAgID0gMzIvMzJcbiAgICAgICAgIDMvNCAgICAgPSAyNC8zMlxuICAgICAgICAgMS8yICAgICA9IDE2LzMyXG4gICAgICAgICAzLzggICAgID0gMTIvMzJcbiAgICAgICAgIDEvNCAgICAgPSAgOC8zMlxuICAgICAgICAgMy8xNiAgICA9ICA2LzMyXG4gICAgICAgICAxLzggICAgID0gIDQvMzIgPSAgICA4LzY0XG4gICAgICAgICB0cmlwbGV0ICAgICAgICAgPSA1LjMzLzY0XG4gICAgICAgICAxLzE2ICAgID0gIDIvMzIgPSAgICA0LzY0XG4gICAgICAgICAxLzMyICAgID0gIDEvMzIgPSAgICAyLzY0XG4gICAgICAgICAqKi8gXG5cbiAgICAgICAgaWYgICAgICAoZHVyYXRpb24gPj0gMjgqd2hvbGUvMzIpXG4gICAgICAgICAgICByZXR1cm4gTm90ZUR1cmF0aW9uLldob2xlO1xuICAgICAgICBlbHNlIGlmIChkdXJhdGlvbiA+PSAyMCp3aG9sZS8zMikgXG4gICAgICAgICAgICByZXR1cm4gTm90ZUR1cmF0aW9uLkRvdHRlZEhhbGY7XG4gICAgICAgIGVsc2UgaWYgKGR1cmF0aW9uID49IDE0Kndob2xlLzMyKVxuICAgICAgICAgICAgcmV0dXJuIE5vdGVEdXJhdGlvbi5IYWxmO1xuICAgICAgICBlbHNlIGlmIChkdXJhdGlvbiA+PSAxMCp3aG9sZS8zMilcbiAgICAgICAgICAgIHJldHVybiBOb3RlRHVyYXRpb24uRG90dGVkUXVhcnRlcjtcbiAgICAgICAgZWxzZSBpZiAoZHVyYXRpb24gPj0gIDcqd2hvbGUvMzIpXG4gICAgICAgICAgICByZXR1cm4gTm90ZUR1cmF0aW9uLlF1YXJ0ZXI7XG4gICAgICAgIGVsc2UgaWYgKGR1cmF0aW9uID49ICA1Kndob2xlLzMyKVxuICAgICAgICAgICAgcmV0dXJuIE5vdGVEdXJhdGlvbi5Eb3R0ZWRFaWdodGg7XG4gICAgICAgIGVsc2UgaWYgKGR1cmF0aW9uID49ICA2Kndob2xlLzY0KVxuICAgICAgICAgICAgcmV0dXJuIE5vdGVEdXJhdGlvbi5FaWdodGg7XG4gICAgICAgIGVsc2UgaWYgKGR1cmF0aW9uID49ICA1Kndob2xlLzY0KVxuICAgICAgICAgICAgcmV0dXJuIE5vdGVEdXJhdGlvbi5UcmlwbGV0O1xuICAgICAgICBlbHNlIGlmIChkdXJhdGlvbiA+PSAgMyp3aG9sZS82NClcbiAgICAgICAgICAgIHJldHVybiBOb3RlRHVyYXRpb24uU2l4dGVlbnRoO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZDtcbiAgICB9XG5cbiAgICAvKiogQ29udmVydCBhIG5vdGUgZHVyYXRpb24gaW50byBhIHN0ZW0gZHVyYXRpb24uICBEb3R0ZWQgZHVyYXRpb25zXG4gICAgICogYXJlIGNvbnZlcnRlZCBpbnRvIHRoZWlyIG5vbi1kb3R0ZWQgZXF1aXZhbGVudHMuXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBOb3RlRHVyYXRpb24gR2V0U3RlbUR1cmF0aW9uKE5vdGVEdXJhdGlvbiBkdXIpIHtcbiAgICAgICAgaWYgKGR1ciA9PSBOb3RlRHVyYXRpb24uRG90dGVkSGFsZilcbiAgICAgICAgICAgIHJldHVybiBOb3RlRHVyYXRpb24uSGFsZjtcbiAgICAgICAgZWxzZSBpZiAoZHVyID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRRdWFydGVyKVxuICAgICAgICAgICAgcmV0dXJuIE5vdGVEdXJhdGlvbi5RdWFydGVyO1xuICAgICAgICBlbHNlIGlmIChkdXIgPT0gTm90ZUR1cmF0aW9uLkRvdHRlZEVpZ2h0aClcbiAgICAgICAgICAgIHJldHVybiBOb3RlRHVyYXRpb24uRWlnaHRoO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZHVyO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdGhlIHRpbWUgcGVyaW9kIChpbiBwdWxzZXMpIHRoZSB0aGUgZ2l2ZW4gZHVyYXRpb24gc3BhbnMgKi9cbiAgICBwdWJsaWMgaW50IER1cmF0aW9uVG9UaW1lKE5vdGVEdXJhdGlvbiBkdXIpIHtcbiAgICAgICAgaW50IGVpZ2h0aCA9IHF1YXJ0ZXJub3RlLzI7XG4gICAgICAgIGludCBzaXh0ZWVudGggPSBlaWdodGgvMjtcblxuICAgICAgICBzd2l0Y2ggKGR1cikge1xuICAgICAgICAgICAgY2FzZSBOb3RlRHVyYXRpb24uV2hvbGU6ICAgICAgICAgcmV0dXJuIHF1YXJ0ZXJub3RlICogNDsgXG4gICAgICAgICAgICBjYXNlIE5vdGVEdXJhdGlvbi5Eb3R0ZWRIYWxmOiAgICByZXR1cm4gcXVhcnRlcm5vdGUgKiAzOyBcbiAgICAgICAgICAgIGNhc2UgTm90ZUR1cmF0aW9uLkhhbGY6ICAgICAgICAgIHJldHVybiBxdWFydGVybm90ZSAqIDI7IFxuICAgICAgICAgICAgY2FzZSBOb3RlRHVyYXRpb24uRG90dGVkUXVhcnRlcjogcmV0dXJuIDMqZWlnaHRoOyBcbiAgICAgICAgICAgIGNhc2UgTm90ZUR1cmF0aW9uLlF1YXJ0ZXI6ICAgICAgIHJldHVybiBxdWFydGVybm90ZTsgXG4gICAgICAgICAgICBjYXNlIE5vdGVEdXJhdGlvbi5Eb3R0ZWRFaWdodGg6ICByZXR1cm4gMypzaXh0ZWVudGg7XG4gICAgICAgICAgICBjYXNlIE5vdGVEdXJhdGlvbi5FaWdodGg6ICAgICAgICByZXR1cm4gZWlnaHRoO1xuICAgICAgICAgICAgY2FzZSBOb3RlRHVyYXRpb24uVHJpcGxldDogICAgICAgcmV0dXJuIHF1YXJ0ZXJub3RlLzM7IFxuICAgICAgICAgICAgY2FzZSBOb3RlRHVyYXRpb24uU2l4dGVlbnRoOiAgICAgcmV0dXJuIHNpeHRlZW50aDtcbiAgICAgICAgICAgIGNhc2UgTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZDogIHJldHVybiBzaXh0ZWVudGgvMjsgXG4gICAgICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG92ZXJyaWRlIFxuICAgIHN0cmluZyBUb1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5Gb3JtYXQoXCJUaW1lU2lnbmF0dXJlPXswfS97MX0gcXVhcnRlcj17Mn0gdGVtcG89ezN9XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyYXRvciwgZGVub21pbmF0b3IsIHF1YXJ0ZXJub3RlLCB0ZW1wbyk7XG4gICAgfVxuICAgIFxufVxuXG59XG5cbiIsInVzaW5nIFN5c3RlbTtcclxudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XHJcbnVzaW5nIFN5c3RlbS5MaW5xO1xyXG51c2luZyBTeXN0ZW0uVGV4dDtcclxudXNpbmcgU3lzdGVtLlRocmVhZGluZy5UYXNrcztcclxuXHJcbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY0JyaWRnZS5UZXh0XHJcbntcclxuICAgIHB1YmxpYyBjbGFzcyBBU0NJSVxyXG4gICAge1xyXG4gICAgICAgIHB1YmxpYyBzdHJpbmcgR2V0U3RyaW5nKGJ5dGVbXSBkYXRhLCBpbnQgc3RhcnRJbmRleCwgaW50IGxlbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB0b1JldHVybiA9IFwiXCI7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuICYmIGkgPCBkYXRhLkxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICAgICAgdG9SZXR1cm4gKz0gKGNoYXIpZGF0YVtpICsgc3RhcnRJbmRleF07XHJcbiAgICAgICAgICAgIHJldHVybiB0b1JldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcblxyXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNCcmlkZ2UuVGV4dFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNsYXNzIEVuY29kaW5nXHJcbiAgICB7XHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBBU0NJSSBBU0NJSSA9IG5ldyBBU0NJSSgpO1xyXG4gICAgfVxyXG59XHJcbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMSBNYWRoYXYgVmFpZHlhbmF0aGFuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cblxudXNpbmcgU3lzdGVtO1xudXNpbmcgU3lzdGVtLklPO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG51c2luZyBTeXN0ZW0uVGV4dDtcblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljIHtcblxuXG4vKiogQWNjaWRlbnRhbHMgKi9cbnB1YmxpYyBlbnVtIEFjY2lkIHtcbiAgICBOb25lLCBTaGFycCwgRmxhdCwgTmF0dXJhbFxufVxuXG4vKiogQGNsYXNzIEFjY2lkU3ltYm9sXG4gKiBBbiBhY2NpZGVudGFsIChhY2NpZCkgc3ltYm9sIHJlcHJlc2VudHMgYSBzaGFycCwgZmxhdCwgb3IgbmF0dXJhbFxuICogYWNjaWRlbnRhbCB0aGF0IGlzIGRpc3BsYXllZCBhdCBhIHNwZWNpZmljIHBvc2l0aW9uIChub3RlIGFuZCBjbGVmKS5cbiAqL1xucHVibGljIGNsYXNzIEFjY2lkU3ltYm9sIDogTXVzaWNTeW1ib2wge1xuICAgIHByaXZhdGUgQWNjaWQgYWNjaWQ7ICAgICAgICAgIC8qKiBUaGUgYWNjaWRlbnRhbCAoc2hhcnAsIGZsYXQsIG5hdHVyYWwpICovXG4gICAgcHJpdmF0ZSBXaGl0ZU5vdGUgd2hpdGVub3RlOyAgLyoqIFRoZSB3aGl0ZSBub3RlIHdoZXJlIHRoZSBzeW1ib2wgb2NjdXJzICovXG4gICAgcHJpdmF0ZSBDbGVmIGNsZWY7ICAgICAgICAgICAgLyoqIFdoaWNoIGNsZWYgdGhlIHN5bWJvbHMgaXMgaW4gKi9cbiAgICBwcml2YXRlIGludCB3aWR0aDsgICAgICAgICAgICAvKiogV2lkdGggb2Ygc3ltYm9sICovXG5cbiAgICAvKiogXG4gICAgICogQ3JlYXRlIGEgbmV3IEFjY2lkU3ltYm9sIHdpdGggdGhlIGdpdmVuIGFjY2lkZW50YWwsIHRoYXQgaXNcbiAgICAgKiBkaXNwbGF5ZWQgYXQgdGhlIGdpdmVuIG5vdGUgaW4gdGhlIGdpdmVuIGNsZWYuXG4gICAgICovXG4gICAgcHVibGljIEFjY2lkU3ltYm9sKEFjY2lkIGFjY2lkLCBXaGl0ZU5vdGUgbm90ZSwgQ2xlZiBjbGVmKSB7XG4gICAgICAgIHRoaXMuYWNjaWQgPSBhY2NpZDtcbiAgICAgICAgdGhpcy53aGl0ZW5vdGUgPSBub3RlO1xuICAgICAgICB0aGlzLmNsZWYgPSBjbGVmO1xuICAgICAgICB3aWR0aCA9IE1pbldpZHRoO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdGhlIHdoaXRlIG5vdGUgdGhpcyBhY2NpZGVudGFsIGlzIGRpc3BsYXllZCBhdCAqL1xuICAgIHB1YmxpYyBXaGl0ZU5vdGUgTm90ZSAge1xuICAgICAgICBnZXQgeyByZXR1cm4gd2hpdGVub3RlOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgdGltZSAoaW4gcHVsc2VzKSB0aGlzIHN5bWJvbCBvY2N1cnMgYXQuXG4gICAgICogTm90IHVzZWQuICBJbnN0ZWFkLCB0aGUgU3RhcnRUaW1lIG9mIHRoZSBDaG9yZFN5bWJvbCBjb250YWluaW5nIHRoaXNcbiAgICAgKiBBY2NpZFN5bWJvbCBpcyB1c2VkLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgU3RhcnRUaW1lIHsgXG4gICAgICAgIGdldCB7IHJldHVybiAtMTsgfSAgXG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbWluaW11bSB3aWR0aCAoaW4gcGl4ZWxzKSBuZWVkZWQgdG8gZHJhdyB0aGlzIHN5bWJvbCAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgTWluV2lkdGggeyBcbiAgICAgICAgZ2V0IHsgcmV0dXJuIDMqU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7IH1cbiAgICB9XG5cbiAgICAvKiogR2V0L1NldCB0aGUgd2lkdGggKGluIHBpeGVscykgb2YgdGhpcyBzeW1ib2wuIFRoZSB3aWR0aCBpcyBzZXRcbiAgICAgKiBpbiBTaGVldE11c2ljLkFsaWduU3ltYm9scygpIHRvIHZlcnRpY2FsbHkgYWxpZ24gc3ltYm9scy5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IFdpZHRoIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHdpZHRoOyB9XG4gICAgICAgIHNldCB7IHdpZHRoID0gdmFsdWU7IH1cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBudW1iZXIgb2YgcGl4ZWxzIHRoaXMgc3ltYm9sIGV4dGVuZHMgYWJvdmUgdGhlIHN0YWZmLiBVc2VkXG4gICAgICogIHRvIGRldGVybWluZSB0aGUgbWluaW11bSBoZWlnaHQgbmVlZGVkIGZvciB0aGUgc3RhZmYgKFN0YWZmLkZpbmRCb3VuZHMpLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgQWJvdmVTdGFmZiB7XG4gICAgICAgIGdldCB7IHJldHVybiBHZXRBYm92ZVN0YWZmKCk7IH1cbiAgICB9XG5cbiAgICBpbnQgR2V0QWJvdmVTdGFmZigpIHtcbiAgICAgICAgaW50IGRpc3QgPSBXaGl0ZU5vdGUuVG9wKGNsZWYpLkRpc3Qod2hpdGVub3RlKSAqIFxuICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yO1xuICAgICAgICBpZiAoYWNjaWQgPT0gQWNjaWQuU2hhcnAgfHwgYWNjaWQgPT0gQWNjaWQuTmF0dXJhbClcbiAgICAgICAgICAgIGRpc3QgLT0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICBlbHNlIGlmIChhY2NpZCA9PSBBY2NpZC5GbGF0KVxuICAgICAgICAgICAgZGlzdCAtPSAzKlNoZWV0TXVzaWMuTm90ZUhlaWdodC8yO1xuXG4gICAgICAgIGlmIChkaXN0IDwgMClcbiAgICAgICAgICAgIHJldHVybiAtZGlzdDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbnVtYmVyIG9mIHBpeGVscyB0aGlzIHN5bWJvbCBleHRlbmRzIGJlbG93IHRoZSBzdGFmZi4gVXNlZFxuICAgICAqICB0byBkZXRlcm1pbmUgdGhlIG1pbmltdW0gaGVpZ2h0IG5lZWRlZCBmb3IgdGhlIHN0YWZmIChTdGFmZi5GaW5kQm91bmRzKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IEJlbG93U3RhZmYge1xuICAgICAgICBnZXQgeyByZXR1cm4gR2V0QmVsb3dTdGFmZigpOyB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbnQgR2V0QmVsb3dTdGFmZigpIHtcbiAgICAgICAgaW50IGRpc3QgPSBXaGl0ZU5vdGUuQm90dG9tKGNsZWYpLkRpc3Qod2hpdGVub3RlKSAqIFxuICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yICsgXG4gICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICBpZiAoYWNjaWQgPT0gQWNjaWQuU2hhcnAgfHwgYWNjaWQgPT0gQWNjaWQuTmF0dXJhbCkgXG4gICAgICAgICAgICBkaXN0ICs9IFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcblxuICAgICAgICBpZiAoZGlzdCA+IDApXG4gICAgICAgICAgICByZXR1cm4gZGlzdDtcbiAgICAgICAgZWxzZSBcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIC8qKiBEcmF3IHRoZSBzeW1ib2wuXG4gICAgICogQHBhcmFtIHl0b3AgVGhlIHlsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIHZvaWQgRHJhdyhHcmFwaGljcyBnLCBQZW4gcGVuLCBpbnQgeXRvcCkge1xuICAgICAgICAvKiBBbGlnbiB0aGUgc3ltYm9sIHRvIHRoZSByaWdodCAqL1xuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybShXaWR0aCAtIE1pbldpZHRoLCAwKTtcblxuICAgICAgICAvKiBTdG9yZSB0aGUgeS1waXhlbCB2YWx1ZSBvZiB0aGUgdG9wIG9mIHRoZSB3aGl0ZW5vdGUgaW4geW5vdGUuICovXG4gICAgICAgIGludCB5bm90ZSA9IHl0b3AgKyBXaGl0ZU5vdGUuVG9wKGNsZWYpLkRpc3Qod2hpdGVub3RlKSAqIFxuICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLk5vdGVIZWlnaHQvMjtcblxuICAgICAgICBpZiAoYWNjaWQgPT0gQWNjaWQuU2hhcnApXG4gICAgICAgICAgICBEcmF3U2hhcnAoZywgcGVuLCB5bm90ZSk7XG4gICAgICAgIGVsc2UgaWYgKGFjY2lkID09IEFjY2lkLkZsYXQpXG4gICAgICAgICAgICBEcmF3RmxhdChnLCBwZW4sIHlub3RlKTtcbiAgICAgICAgZWxzZSBpZiAoYWNjaWQgPT0gQWNjaWQuTmF0dXJhbClcbiAgICAgICAgICAgIERyYXdOYXR1cmFsKGcsIHBlbiwgeW5vdGUpO1xuXG4gICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC0oV2lkdGggLSBNaW5XaWR0aCksIDApO1xuICAgIH1cblxuICAgIC8qKiBEcmF3IGEgc2hhcnAgc3ltYm9sLiBcbiAgICAgKiBAcGFyYW0geW5vdGUgVGhlIHBpeGVsIGxvY2F0aW9uIG9mIHRoZSB0b3Agb2YgdGhlIGFjY2lkZW50YWwncyBub3RlLiBcbiAgICAgKi9cbiAgICBwdWJsaWMgdm9pZCBEcmF3U2hhcnAoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHlub3RlKSB7XG5cbiAgICAgICAgLyogRHJhdyB0aGUgdHdvIHZlcnRpY2FsIGxpbmVzICovXG4gICAgICAgIGludCB5c3RhcnQgPSB5bm90ZSAtIFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcbiAgICAgICAgaW50IHllbmQgPSB5bm90ZSArIDIqU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICBpbnQgeCA9IFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yO1xuICAgICAgICBwZW4uV2lkdGggPSAxO1xuICAgICAgICBnLkRyYXdMaW5lKHBlbiwgeCwgeXN0YXJ0ICsgMiwgeCwgeWVuZCk7XG4gICAgICAgIHggKz0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7XG4gICAgICAgIGcuRHJhd0xpbmUocGVuLCB4LCB5c3RhcnQsIHgsIHllbmQgLSAyKTtcblxuICAgICAgICAvKiBEcmF3IHRoZSBzbGlnaHRseSB1cHdhcmRzIGhvcml6b250YWwgbGluZXMgKi9cbiAgICAgICAgaW50IHhzdGFydCA9IFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yIC0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzQ7XG4gICAgICAgIGludCB4ZW5kID0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0ICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzQ7XG4gICAgICAgIHlzdGFydCA9IHlub3RlICsgU2hlZXRNdXNpYy5MaW5lV2lkdGg7XG4gICAgICAgIHllbmQgPSB5c3RhcnQgLSBTaGVldE11c2ljLkxpbmVXaWR0aCAtIFNoZWV0TXVzaWMuTGluZVNwYWNlLzQ7XG4gICAgICAgIHBlbi5XaWR0aCA9IFNoZWV0TXVzaWMuTGluZVNwYWNlLzI7XG4gICAgICAgIGcuRHJhd0xpbmUocGVuLCB4c3RhcnQsIHlzdGFydCwgeGVuZCwgeWVuZCk7XG4gICAgICAgIHlzdGFydCArPSBTaGVldE11c2ljLkxpbmVTcGFjZTtcbiAgICAgICAgeWVuZCArPSBTaGVldE11c2ljLkxpbmVTcGFjZTtcbiAgICAgICAgZy5EcmF3TGluZShwZW4sIHhzdGFydCwgeXN0YXJ0LCB4ZW5kLCB5ZW5kKTtcbiAgICAgICAgcGVuLldpZHRoID0gMTtcbiAgICB9XG5cbiAgICAvKiogRHJhdyBhIGZsYXQgc3ltYm9sLlxuICAgICAqIEBwYXJhbSB5bm90ZSBUaGUgcGl4ZWwgbG9jYXRpb24gb2YgdGhlIHRvcCBvZiB0aGUgYWNjaWRlbnRhbCdzIG5vdGUuXG4gICAgICovXG4gICAgcHVibGljIHZvaWQgRHJhd0ZsYXQoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHlub3RlKSB7XG4gICAgICAgIGludCB4ID0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNDtcblxuICAgICAgICAvKiBEcmF3IHRoZSB2ZXJ0aWNhbCBsaW5lICovXG4gICAgICAgIHBlbi5XaWR0aCA9IDE7XG4gICAgICAgIGcuRHJhd0xpbmUocGVuLCB4LCB5bm90ZSAtIFNoZWV0TXVzaWMuTm90ZUhlaWdodCAtIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yLFxuICAgICAgICAgICAgICAgICAgICAgICAgeCwgeW5vdGUgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQpO1xuXG4gICAgICAgIC8qIERyYXcgMyBiZXppZXIgY3VydmVzLlxuICAgICAgICAgKiBBbGwgMyBjdXJ2ZXMgc3RhcnQgYW5kIHN0b3AgYXQgdGhlIHNhbWUgcG9pbnRzLlxuICAgICAgICAgKiBFYWNoIHN1YnNlcXVlbnQgY3VydmUgYnVsZ2VzIG1vcmUgYW5kIG1vcmUgdG93YXJkcyBcbiAgICAgICAgICogdGhlIHRvcHJpZ2h0IGNvcm5lciwgbWFraW5nIHRoZSBjdXJ2ZSBsb29rIHRoaWNrZXJcbiAgICAgICAgICogdG93YXJkcyB0aGUgdG9wLXJpZ2h0LlxuICAgICAgICAgKi9cbiAgICAgICAgZy5EcmF3QmV6aWVyKHBlbiwgeCwgeW5vdGUgKyBTaGVldE11c2ljLkxpbmVTcGFjZS80LFxuICAgICAgICAgICAgeCArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzIsIHlub3RlIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvMixcbiAgICAgICAgICAgIHggKyBTaGVldE11c2ljLkxpbmVTcGFjZSwgeW5vdGUgKyBTaGVldE11c2ljLkxpbmVTcGFjZS8zLFxuICAgICAgICAgICAgeCwgeW5vdGUgKyBTaGVldE11c2ljLkxpbmVTcGFjZSArIFNoZWV0TXVzaWMuTGluZVdpZHRoICsgMSk7XG5cbiAgICAgICAgZy5EcmF3QmV6aWVyKHBlbiwgeCwgeW5vdGUgKyBTaGVldE11c2ljLkxpbmVTcGFjZS80LFxuICAgICAgICAgICAgeCArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzIsIHlub3RlIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvMixcbiAgICAgICAgICAgIHggKyBTaGVldE11c2ljLkxpbmVTcGFjZSArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzQsIFxuICAgICAgICAgICAgICB5bm90ZSArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzMgLSBTaGVldE11c2ljLkxpbmVTcGFjZS80LFxuICAgICAgICAgICAgeCwgeW5vdGUgKyBTaGVldE11c2ljLkxpbmVTcGFjZSArIFNoZWV0TXVzaWMuTGluZVdpZHRoICsgMSk7XG5cblxuICAgICAgICBnLkRyYXdCZXppZXIocGVuLCB4LCB5bm90ZSArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzQsXG4gICAgICAgICAgICB4ICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UvMiwgeW5vdGUgLSBTaGVldE11c2ljLkxpbmVTcGFjZS8yLFxuICAgICAgICAgICAgeCArIFNoZWV0TXVzaWMuTGluZVNwYWNlICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UvMiwgXG4gICAgICAgICAgICAgeW5vdGUgKyBTaGVldE11c2ljLkxpbmVTcGFjZS8zIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvMixcbiAgICAgICAgICAgIHgsIHlub3RlICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UgKyBTaGVldE11c2ljLkxpbmVXaWR0aCArIDEpO1xuXG5cbiAgICB9XG5cbiAgICAvKiogRHJhdyBhIG5hdHVyYWwgc3ltYm9sLlxuICAgICAqIEBwYXJhbSB5bm90ZSBUaGUgcGl4ZWwgbG9jYXRpb24gb2YgdGhlIHRvcCBvZiB0aGUgYWNjaWRlbnRhbCdzIG5vdGUuXG4gICAgICovXG4gICAgcHVibGljIHZvaWQgRHJhd05hdHVyYWwoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHlub3RlKSB7XG5cbiAgICAgICAgLyogRHJhdyB0aGUgdHdvIHZlcnRpY2FsIGxpbmVzICovXG4gICAgICAgIGludCB5c3RhcnQgPSB5bm90ZSAtIFNoZWV0TXVzaWMuTGluZVNwYWNlIC0gU2hlZXRNdXNpYy5MaW5lV2lkdGg7XG4gICAgICAgIGludCB5ZW5kID0geW5vdGUgKyBTaGVldE11c2ljLkxpbmVTcGFjZSArIFNoZWV0TXVzaWMuTGluZVdpZHRoO1xuICAgICAgICBpbnQgeCA9IFNoZWV0TXVzaWMuTGluZVNwYWNlLzI7XG4gICAgICAgIHBlbi5XaWR0aCA9IDE7XG4gICAgICAgIGcuRHJhd0xpbmUocGVuLCB4LCB5c3RhcnQsIHgsIHllbmQpO1xuICAgICAgICB4ICs9IFNoZWV0TXVzaWMuTGluZVNwYWNlIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNDtcbiAgICAgICAgeXN0YXJ0ID0geW5vdGUgLSBTaGVldE11c2ljLkxpbmVTcGFjZS80O1xuICAgICAgICB5ZW5kID0geW5vdGUgKyAyKlNoZWV0TXVzaWMuTGluZVNwYWNlICsgU2hlZXRNdXNpYy5MaW5lV2lkdGggLSBcbiAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5MaW5lU3BhY2UvNDtcbiAgICAgICAgZy5EcmF3TGluZShwZW4sIHgsIHlzdGFydCwgeCwgeWVuZCk7XG5cbiAgICAgICAgLyogRHJhdyB0aGUgc2xpZ2h0bHkgdXB3YXJkcyBob3Jpem9udGFsIGxpbmVzICovXG4gICAgICAgIGludCB4c3RhcnQgPSBTaGVldE11c2ljLkxpbmVTcGFjZS8yO1xuICAgICAgICBpbnQgeGVuZCA9IHhzdGFydCArIFNoZWV0TXVzaWMuTGluZVNwYWNlIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNDtcbiAgICAgICAgeXN0YXJ0ID0geW5vdGUgKyBTaGVldE11c2ljLkxpbmVXaWR0aDtcbiAgICAgICAgeWVuZCA9IHlzdGFydCAtIFNoZWV0TXVzaWMuTGluZVdpZHRoIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNDtcbiAgICAgICAgcGVuLldpZHRoID0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvMjtcbiAgICAgICAgZy5EcmF3TGluZShwZW4sIHhzdGFydCwgeXN0YXJ0LCB4ZW5kLCB5ZW5kKTtcbiAgICAgICAgeXN0YXJ0ICs9IFNoZWV0TXVzaWMuTGluZVNwYWNlO1xuICAgICAgICB5ZW5kICs9IFNoZWV0TXVzaWMuTGluZVNwYWNlO1xuICAgICAgICBnLkRyYXdMaW5lKHBlbiwgeHN0YXJ0LCB5c3RhcnQsIHhlbmQsIHllbmQpO1xuICAgICAgICBwZW4uV2lkdGggPSAxO1xuICAgIH1cblxuICAgIHB1YmxpYyBvdmVycmlkZSBzdHJpbmcgVG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcuRm9ybWF0KFxuICAgICAgICAgIFwiQWNjaWRTeW1ib2wgYWNjaWQ9ezB9IHdoaXRlbm90ZT17MX0gY2xlZj17Mn0gd2lkdGg9ezN9XCIsXG4gICAgICAgICAgYWNjaWQsIHdoaXRlbm90ZSwgY2xlZiwgd2lkdGgpO1xuICAgIH1cblxufVxuXG59XG5cblxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAwNy0yMDExIE1hZGhhdiBWYWlkeWFuYXRoYW5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuXG51c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uSU87XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xuXG5cbi8qKiBAY2xhc3MgQmFyU3ltYm9sXG4gKiBUaGUgQmFyU3ltYm9sIHJlcHJlc2VudHMgdGhlIHZlcnRpY2FsIGJhcnMgd2hpY2ggZGVsaW1pdCBtZWFzdXJlcy5cbiAqIFRoZSBzdGFydHRpbWUgb2YgdGhlIHN5bWJvbCBpcyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBuZXdcbiAqIG1lYXN1cmUuXG4gKi9cbnB1YmxpYyBjbGFzcyBCYXJTeW1ib2wgOiBNdXNpY1N5bWJvbCB7XG4gICAgcHJpdmF0ZSBpbnQgc3RhcnR0aW1lO1xuICAgIHByaXZhdGUgaW50IHdpZHRoO1xuXG4gICAgLyoqIENyZWF0ZSBhIEJhclN5bWJvbC4gVGhlIHN0YXJ0dGltZSBzaG91bGQgYmUgdGhlIGJlZ2lubmluZyBvZiBhIG1lYXN1cmUuICovXG4gICAgcHVibGljIEJhclN5bWJvbChpbnQgc3RhcnR0aW1lKSB7XG4gICAgICAgIHRoaXMuc3RhcnR0aW1lID0gc3RhcnR0aW1lO1xuICAgICAgICB3aWR0aCA9IE1pbldpZHRoO1xuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIHRpbWUgKGluIHB1bHNlcykgdGhpcyBzeW1ib2wgb2NjdXJzIGF0LlxuICAgICAqIFRoaXMgaXMgdXNlZCB0byBkZXRlcm1pbmUgdGhlIG1lYXN1cmUgdGhpcyBzeW1ib2wgYmVsb25ncyB0by5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IFN0YXJ0VGltZSB7XG4gICAgICAgIGdldCB7IHJldHVybiBzdGFydHRpbWU7IH1cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBtaW5pbXVtIHdpZHRoIChpbiBwaXhlbHMpIG5lZWRlZCB0byBkcmF3IHRoaXMgc3ltYm9sICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBNaW5XaWR0aCB7IFxuICAgICAgICBnZXQgeyByZXR1cm4gMiAqIFNoZWV0TXVzaWMuTGluZVNwYWNlOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldC9TZXQgdGhlIHdpZHRoIChpbiBwaXhlbHMpIG9mIHRoaXMgc3ltYm9sLiBUaGUgd2lkdGggaXMgc2V0XG4gICAgICogaW4gU2hlZXRNdXNpYy5BbGlnblN5bWJvbHMoKSB0byB2ZXJ0aWNhbGx5IGFsaWduIHN5bWJvbHMuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBXaWR0aCB7XG4gICAgICAgIGdldCB7IHJldHVybiB3aWR0aDsgfVxuICAgICAgICBzZXQgeyB3aWR0aCA9IHZhbHVlOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbnVtYmVyIG9mIHBpeGVscyB0aGlzIHN5bWJvbCBleHRlbmRzIGFib3ZlIHRoZSBzdGFmZi4gVXNlZFxuICAgICAqICB0byBkZXRlcm1pbmUgdGhlIG1pbmltdW0gaGVpZ2h0IG5lZWRlZCBmb3IgdGhlIHN0YWZmIChTdGFmZi5GaW5kQm91bmRzKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IEFib3ZlU3RhZmYgeyBcbiAgICAgICAgZ2V0IHsgcmV0dXJuIDA7IH0gXG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbnVtYmVyIG9mIHBpeGVscyB0aGlzIHN5bWJvbCBleHRlbmRzIGJlbG93IHRoZSBzdGFmZi4gVXNlZFxuICAgICAqICB0byBkZXRlcm1pbmUgdGhlIG1pbmltdW0gaGVpZ2h0IG5lZWRlZCBmb3IgdGhlIHN0YWZmIChTdGFmZi5GaW5kQm91bmRzKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IEJlbG93U3RhZmYgeyBcbiAgICAgICAgZ2V0IHsgcmV0dXJuIDA7IH1cbiAgICB9XG5cbiAgICAvKiogRHJhdyBhIHZlcnRpY2FsIGJhci5cbiAgICAgKiBAcGFyYW0geXRvcCBUaGUgeWxvY2F0aW9uIChpbiBwaXhlbHMpIHdoZXJlIHRoZSB0b3Agb2YgdGhlIHN0YWZmIHN0YXJ0cy5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgXG4gICAgdm9pZCBEcmF3KEdyYXBoaWNzIGcsIFBlbiBwZW4sIGludCB5dG9wKSB7XG4gICAgICAgIGludCB5ID0geXRvcDtcbiAgICAgICAgaW50IHllbmQgPSB5ICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UqNCArIFNoZWV0TXVzaWMuTGluZVdpZHRoKjQ7XG4gICAgICAgIHBlbi5XaWR0aCA9IDE7XG4gICAgICAgIGcuRHJhd0xpbmUocGVuLCBTaGVldE11c2ljLk5vdGVXaWR0aC8yLCB5LCBcbiAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZVdpZHRoLzIsIHllbmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIG92ZXJyaWRlIHN0cmluZyBUb1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5Gb3JtYXQoXCJCYXJTeW1ib2wgc3RhcnR0aW1lPXswfSB3aWR0aD17MX1cIiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0dGltZSwgd2lkdGgpO1xuICAgIH1cbn1cblxuXG59XG5cbiIsInVzaW5nIFN5c3RlbTtcclxudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XHJcbnVzaW5nIFN5c3RlbS5UZXh0O1xyXG5cclxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljXHJcbntcclxuICAgIHB1YmxpYyBjbGFzcyBCaXRtYXA6SW1hZ2VcclxuICAgIHtcclxuICAgICAgICBwdWJsaWMgQml0bWFwKFR5cGUgdHlwZSwgc3RyaW5nIGZpbGVuYW1lKVxyXG4gICAgICAgIDpiYXNlKHR5cGUsZmlsZW5hbWUpe1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIFxyXG4gICAgfVxyXG59XHJcbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMSBNYWRoYXYgVmFpZHlhbmF0aGFuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cblxudXNpbmcgU3lzdGVtO1xudXNpbmcgU3lzdGVtLklPO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG51c2luZyBTeXN0ZW0uVGV4dDtcblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljIHtcblxuXG4vKiogQGNsYXNzIEJsYW5rU3ltYm9sIFxuICogVGhlIEJsYW5rIHN5bWJvbCBpcyBhIG11c2ljIHN5bWJvbCB0aGF0IGRvZXNuJ3QgZHJhdyBhbnl0aGluZy4gIFRoaXNcbiAqIHN5bWJvbCBpcyB1c2VkIGZvciBhbGlnbm1lbnQgcHVycG9zZXMsIHRvIGFsaWduIG5vdGVzIGluIGRpZmZlcmVudCBcbiAqIHN0YWZmcyB3aGljaCBvY2N1ciBhdCB0aGUgc2FtZSB0aW1lLlxuICovXG5wdWJsaWMgY2xhc3MgQmxhbmtTeW1ib2wgOiBNdXNpY1N5bWJvbCB7XG4gICAgcHJpdmF0ZSBpbnQgc3RhcnR0aW1lOyBcbiAgICBwcml2YXRlIGludCB3aWR0aDtcblxuICAgIC8qKiBDcmVhdGUgYSBuZXcgQmxhbmtTeW1ib2wgd2l0aCB0aGUgZ2l2ZW4gc3RhcnR0aW1lIGFuZCB3aWR0aCAqL1xuICAgIHB1YmxpYyBCbGFua1N5bWJvbChpbnQgc3RhcnR0aW1lLCBpbnQgd2lkdGgpIHtcbiAgICAgICAgdGhpcy5zdGFydHRpbWUgPSBzdGFydHRpbWU7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSB0aW1lIChpbiBwdWxzZXMpIHRoaXMgc3ltYm9sIG9jY3VycyBhdC5cbiAgICAgKiBUaGlzIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSBtZWFzdXJlIHRoaXMgc3ltYm9sIGJlbG9uZ3MgdG8uXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBTdGFydFRpbWUgeyBcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHN0YXJ0dGltZTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG1pbmltdW0gd2lkdGggKGluIHBpeGVscykgbmVlZGVkIHRvIGRyYXcgdGhpcyBzeW1ib2wgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IE1pbldpZHRoIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIDA7IH1cbiAgICB9XG5cbiAgICAvKiogR2V0L1NldCB0aGUgd2lkdGggKGluIHBpeGVscykgb2YgdGhpcyBzeW1ib2wuIFRoZSB3aWR0aCBpcyBzZXRcbiAgICAgKiBpbiBTaGVldE11c2ljLkFsaWduU3ltYm9scygpIHRvIHZlcnRpY2FsbHkgYWxpZ24gc3ltYm9scy5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IFdpZHRoIHsgXG4gICAgICAgIGdldCB7IHJldHVybiB3aWR0aDsgfVxuICAgICAgICBzZXQgeyB3aWR0aCA9IHZhbHVlOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbnVtYmVyIG9mIHBpeGVscyB0aGlzIHN5bWJvbCBleHRlbmRzIGFib3ZlIHRoZSBzdGFmZi4gVXNlZFxuICAgICAqICB0byBkZXRlcm1pbmUgdGhlIG1pbmltdW0gaGVpZ2h0IG5lZWRlZCBmb3IgdGhlIHN0YWZmIChTdGFmZi5GaW5kQm91bmRzKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IEFib3ZlU3RhZmYgeyBcbiAgICAgICAgZ2V0IHsgcmV0dXJuIDA7IH1cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBudW1iZXIgb2YgcGl4ZWxzIHRoaXMgc3ltYm9sIGV4dGVuZHMgYmVsb3cgdGhlIHN0YWZmLiBVc2VkXG4gICAgICogIHRvIGRldGVybWluZSB0aGUgbWluaW11bSBoZWlnaHQgbmVlZGVkIGZvciB0aGUgc3RhZmYgKFN0YWZmLkZpbmRCb3VuZHMpLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgQmVsb3dTdGFmZiB7IFxuICAgICAgICBnZXQgeyByZXR1cm4gMDsgfVxuICAgIH1cblxuICAgIC8qKiBEcmF3IG5vdGhpbmcuXG4gICAgICogQHBhcmFtIHl0b3AgVGhlIHlsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIHZvaWQgRHJhdyhHcmFwaGljcyBnLCBQZW4gcGVuLCBpbnQgeXRvcCkge31cblxuICAgIHB1YmxpYyBvdmVycmlkZSBzdHJpbmcgVG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcuRm9ybWF0KFwiQmxhbmtTeW1ib2wgc3RhcnR0aW1lPXswfSB3aWR0aD17MX1cIiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0dGltZSwgd2lkdGgpO1xuICAgIH1cbn1cblxuXG59XG5cblxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAwNy0yMDExIE1hZGhhdiBWYWlkeWFuYXRoYW5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuXG51c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uSU87XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xuXG5wdWJsaWMgZW51bSBTdGVtRGlyIHsgVXAsIERvd24gfTtcblxuLyoqIEBjbGFzcyBOb3RlRGF0YVxuICogIENvbnRhaW5zIGZpZWxkcyBmb3IgZGlzcGxheWluZyBhIHNpbmdsZSBub3RlIGluIGEgY2hvcmQuXG4gKi9cbnB1YmxpYyBjbGFzcyBOb3RlRGF0YSB7XG4gICAgcHVibGljIGludCBudW1iZXI7ICAgICAgICAgICAgIC8qKiBUaGUgTWlkaSBub3RlIG51bWJlciwgdXNlZCB0byBkZXRlcm1pbmUgdGhlIGNvbG9yICovXG4gICAgcHVibGljIFdoaXRlTm90ZSB3aGl0ZW5vdGU7ICAgIC8qKiBUaGUgd2hpdGUgbm90ZSBsb2NhdGlvbiB0byBkcmF3ICovXG4gICAgcHVibGljIE5vdGVEdXJhdGlvbiBkdXJhdGlvbjsgIC8qKiBUaGUgZHVyYXRpb24gb2YgdGhlIG5vdGUgKi9cbiAgICBwdWJsaWMgYm9vbCBsZWZ0c2lkZTsgICAgICAgICAgLyoqIFdoZXRoZXIgdG8gZHJhdyBub3RlIHRvIHRoZSBsZWZ0IG9yIHJpZ2h0IG9mIHRoZSBzdGVtICovXG4gICAgcHVibGljIEFjY2lkIGFjY2lkOyAgICAgICAgICAgIC8qKiBVc2VkIHRvIGNyZWF0ZSB0aGUgQWNjaWRTeW1ib2xzIGZvciB0aGUgY2hvcmQgKi9cbn07XG5cbi8qKiBAY2xhc3MgQ2hvcmRTeW1ib2xcbiAqIEEgY2hvcmQgc3ltYm9sIHJlcHJlc2VudHMgYSBncm91cCBvZiBub3RlcyB0aGF0IGFyZSBwbGF5ZWQgYXQgdGhlIHNhbWVcbiAqIHRpbWUuICBBIGNob3JkIGluY2x1ZGVzIHRoZSBub3RlcywgdGhlIGFjY2lkZW50YWwgc3ltYm9scyBmb3IgZWFjaFxuICogbm90ZSwgYW5kIHRoZSBzdGVtIChvciBzdGVtcykgdG8gdXNlLiAgQSBzaW5nbGUgY2hvcmQgbWF5IGhhdmUgdHdvIFxuICogc3RlbXMgaWYgdGhlIG5vdGVzIGhhdmUgZGlmZmVyZW50IGR1cmF0aW9ucyAoZS5nLiBpZiBvbmUgbm90ZSBpcyBhXG4gKiBxdWFydGVyIG5vdGUsIGFuZCBhbm90aGVyIGlzIGFuIGVpZ2h0aCBub3RlKS5cbiAqL1xucHVibGljIGNsYXNzIENob3JkU3ltYm9sIDogTXVzaWNTeW1ib2wge1xuICAgIHByaXZhdGUgQ2xlZiBjbGVmOyAgICAgICAgICAgICAvKiogV2hpY2ggY2xlZiB0aGUgY2hvcmQgaXMgYmVpbmcgZHJhd24gaW4gKi9cbiAgICBwcml2YXRlIGludCBzdGFydHRpbWU7ICAgICAgICAgLyoqIFRoZSB0aW1lIChpbiBwdWxzZXMpIHRoZSBub3RlcyBvY2N1cnMgYXQgKi9cbiAgICBwcml2YXRlIGludCBlbmR0aW1lOyAgICAgICAgICAgLyoqIFRoZSBzdGFydHRpbWUgcGx1cyB0aGUgbG9uZ2VzdCBub3RlIGR1cmF0aW9uICovXG4gICAgcHJpdmF0ZSBOb3RlRGF0YVtdIG5vdGVkYXRhOyAgIC8qKiBUaGUgbm90ZXMgdG8gZHJhdyAqL1xuICAgIHByaXZhdGUgQWNjaWRTeW1ib2xbXSBhY2NpZHN5bWJvbHM7ICAgLyoqIFRoZSBhY2NpZGVudGFsIHN5bWJvbHMgdG8gZHJhdyAqL1xuICAgIHByaXZhdGUgaW50IHdpZHRoOyAgICAgICAgICAgICAvKiogVGhlIHdpZHRoIG9mIHRoZSBjaG9yZCAqL1xuICAgIHByaXZhdGUgU3RlbSBzdGVtMTsgICAgICAgICAgICAvKiogVGhlIHN0ZW0gb2YgdGhlIGNob3JkLiBDYW4gYmUgbnVsbC4gKi9cbiAgICBwcml2YXRlIFN0ZW0gc3RlbTI7ICAgICAgICAgICAgLyoqIFRoZSBzZWNvbmQgc3RlbSBvZiB0aGUgY2hvcmQuIENhbiBiZSBudWxsICovXG4gICAgcHJpdmF0ZSBib29sIGhhc3R3b3N0ZW1zOyAgICAgIC8qKiBUcnVlIGlmIHRoaXMgY2hvcmQgaGFzIHR3byBzdGVtcyAqL1xuICAgIHByaXZhdGUgU2hlZXRNdXNpYyBzaGVldG11c2ljOyAvKiogVXNlZCB0byBnZXQgY29sb3JzIGFuZCBvdGhlciBvcHRpb25zICovXG5cblxuICAgIC8qKiBDcmVhdGUgYSBuZXcgQ2hvcmQgU3ltYm9sIGZyb20gdGhlIGdpdmVuIGxpc3Qgb2YgbWlkaSBub3Rlcy5cbiAgICAgKiBBbGwgdGhlIG1pZGkgbm90ZXMgd2lsbCBoYXZlIHRoZSBzYW1lIHN0YXJ0IHRpbWUuICBVc2UgdGhlXG4gICAgICoga2V5IHNpZ25hdHVyZSB0byBnZXQgdGhlIHdoaXRlIGtleSBhbmQgYWNjaWRlbnRhbCBzeW1ib2wgZm9yXG4gICAgICogZWFjaCBub3RlLiAgVXNlIHRoZSB0aW1lIHNpZ25hdHVyZSB0byBjYWxjdWxhdGUgdGhlIGR1cmF0aW9uXG4gICAgICogb2YgdGhlIG5vdGVzLiBVc2UgdGhlIGNsZWYgd2hlbiBkcmF3aW5nIHRoZSBjaG9yZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgQ2hvcmRTeW1ib2woTGlzdDxNaWRpTm90ZT4gbWlkaW5vdGVzLCBLZXlTaWduYXR1cmUga2V5LCBcbiAgICAgICAgICAgICAgICAgICAgICAgVGltZVNpZ25hdHVyZSB0aW1lLCBDbGVmIGMsIFNoZWV0TXVzaWMgc2hlZXQpIHtcblxuICAgICAgICBpbnQgbGVuID0gbWlkaW5vdGVzLkNvdW50O1xuICAgICAgICBpbnQgaTtcblxuICAgICAgICBoYXN0d29zdGVtcyA9IGZhbHNlO1xuICAgICAgICBjbGVmID0gYztcbiAgICAgICAgc2hlZXRtdXNpYyA9IHNoZWV0O1xuXG4gICAgICAgIHN0YXJ0dGltZSA9IG1pZGlub3Rlc1swXS5TdGFydFRpbWU7XG4gICAgICAgIGVuZHRpbWUgPSBtaWRpbm90ZXNbMF0uRW5kVGltZTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbWlkaW5vdGVzLkNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpID4gMSkge1xuICAgICAgICAgICAgICAgIGlmIChtaWRpbm90ZXNbaV0uTnVtYmVyIDwgbWlkaW5vdGVzW2ktMV0uTnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeXN0ZW0uQXJndW1lbnRFeGNlcHRpb24oXCJDaG9yZCBub3RlcyBub3QgaW4gaW5jcmVhc2luZyBvcmRlciBieSBudW1iZXJcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW5kdGltZSA9IE1hdGguTWF4KGVuZHRpbWUsIG1pZGlub3Rlc1tpXS5FbmRUaW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vdGVkYXRhID0gQ3JlYXRlTm90ZURhdGEobWlkaW5vdGVzLCBrZXksIHRpbWUpO1xuICAgICAgICBhY2NpZHN5bWJvbHMgPSBDcmVhdGVBY2NpZFN5bWJvbHMobm90ZWRhdGEsIGNsZWYpO1xuXG5cbiAgICAgICAgLyogRmluZCBvdXQgaG93IG1hbnkgc3RlbXMgd2UgbmVlZCAoMSBvciAyKSAqL1xuICAgICAgICBOb3RlRHVyYXRpb24gZHVyMSA9IG5vdGVkYXRhWzBdLmR1cmF0aW9uO1xuICAgICAgICBOb3RlRHVyYXRpb24gZHVyMiA9IGR1cjE7XG4gICAgICAgIGludCBjaGFuZ2UgPSAtMTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG5vdGVkYXRhLkxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBkdXIyID0gbm90ZWRhdGFbaV0uZHVyYXRpb247XG4gICAgICAgICAgICBpZiAoZHVyMSAhPSBkdXIyKSB7XG4gICAgICAgICAgICAgICAgY2hhbmdlID0gaTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkdXIxICE9IGR1cjIpIHtcbiAgICAgICAgICAgIC8qIFdlIGhhdmUgbm90ZXMgd2l0aCBkaWZmZXJlbnQgZHVyYXRpb25zLiAgU28gd2Ugd2lsbCBuZWVkXG4gICAgICAgICAgICAgKiB0d28gc3RlbXMuICBUaGUgZmlyc3Qgc3RlbSBwb2ludHMgZG93biwgYW5kIGNvbnRhaW5zIHRoZVxuICAgICAgICAgICAgICogYm90dG9tIG5vdGUgdXAgdG8gdGhlIG5vdGUgd2l0aCB0aGUgZGlmZmVyZW50IGR1cmF0aW9uLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIFRoZSBzZWNvbmQgc3RlbSBwb2ludHMgdXAsIGFuZCBjb250YWlucyB0aGUgbm90ZSB3aXRoIHRoZVxuICAgICAgICAgICAgICogZGlmZmVyZW50IGR1cmF0aW9uIHVwIHRvIHRoZSB0b3Agbm90ZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaGFzdHdvc3RlbXMgPSB0cnVlO1xuICAgICAgICAgICAgc3RlbTEgPSBuZXcgU3RlbShub3RlZGF0YVswXS53aGl0ZW5vdGUsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RlZGF0YVtjaGFuZ2UtMV0ud2hpdGVub3RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdXIxLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RlbS5Eb3duLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBOb3Rlc092ZXJsYXAobm90ZWRhdGEsIDAsIGNoYW5nZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBzdGVtMiA9IG5ldyBTdGVtKG5vdGVkYXRhW2NoYW5nZV0ud2hpdGVub3RlLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90ZWRhdGFbbm90ZWRhdGEuTGVuZ3RoLTFdLndoaXRlbm90ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVyMiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0ZW0uVXAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIE5vdGVzT3ZlcmxhcChub3RlZGF0YSwgY2hhbmdlLCBub3RlZGF0YS5MZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8qIEFsbCBub3RlcyBoYXZlIHRoZSBzYW1lIGR1cmF0aW9uLCBzbyB3ZSBvbmx5IG5lZWQgb25lIHN0ZW0uICovXG4gICAgICAgICAgICBpbnQgZGlyZWN0aW9uID0gU3RlbURpcmVjdGlvbihub3RlZGF0YVswXS53aGl0ZW5vdGUsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90ZWRhdGFbbm90ZWRhdGEuTGVuZ3RoLTFdLndoaXRlbm90ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWYpO1xuXG4gICAgICAgICAgICBzdGVtMSA9IG5ldyBTdGVtKG5vdGVkYXRhWzBdLndoaXRlbm90ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90ZWRhdGFbbm90ZWRhdGEuTGVuZ3RoLTFdLndoaXRlbm90ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVyMSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTm90ZXNPdmVybGFwKG5vdGVkYXRhLCAwLCBub3RlZGF0YS5MZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHN0ZW0yID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIEZvciB3aG9sZSBub3Rlcywgbm8gc3RlbSBpcyBkcmF3bi4gKi9cbiAgICAgICAgaWYgKGR1cjEgPT0gTm90ZUR1cmF0aW9uLldob2xlKVxuICAgICAgICAgICAgc3RlbTEgPSBudWxsO1xuICAgICAgICBpZiAoZHVyMiA9PSBOb3RlRHVyYXRpb24uV2hvbGUpXG4gICAgICAgICAgICBzdGVtMiA9IG51bGw7XG5cbiAgICAgICAgd2lkdGggPSBNaW5XaWR0aDtcbiAgICB9XG5cblxuICAgIC8qKiBHaXZlbiB0aGUgcmF3IG1pZGkgbm90ZXMgKHRoZSBub3RlIG51bWJlciBhbmQgZHVyYXRpb24gaW4gcHVsc2VzKSxcbiAgICAgKiBjYWxjdWxhdGUgdGhlIGZvbGxvd2luZyBub3RlIGRhdGE6XG4gICAgICogLSBUaGUgd2hpdGUga2V5XG4gICAgICogLSBUaGUgYWNjaWRlbnRhbCAoaWYgYW55KVxuICAgICAqIC0gVGhlIG5vdGUgZHVyYXRpb24gKGhhbGYsIHF1YXJ0ZXIsIGVpZ2h0aCwgZXRjKVxuICAgICAqIC0gVGhlIHNpZGUgaXQgc2hvdWxkIGJlIGRyYXduIChsZWZ0IG9yIHNpZGUpXG4gICAgICogQnkgZGVmYXVsdCwgbm90ZXMgYXJlIGRyYXduIG9uIHRoZSBsZWZ0IHNpZGUuICBIb3dldmVyLCBpZiB0d28gbm90ZXNcbiAgICAgKiBvdmVybGFwIChsaWtlIEEgYW5kIEIpIHlvdSBjYW5ub3QgZHJhdyB0aGUgbmV4dCBub3RlIGRpcmVjdGx5IGFib3ZlIGl0LlxuICAgICAqIEluc3RlYWQgeW91IG11c3Qgc2hpZnQgb25lIG9mIHRoZSBub3RlcyB0byB0aGUgcmlnaHQuXG4gICAgICpcbiAgICAgKiBUaGUgS2V5U2lnbmF0dXJlIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSB3aGl0ZSBrZXkgYW5kIGFjY2lkZW50YWwuXG4gICAgICogVGhlIFRpbWVTaWduYXR1cmUgaXMgdXNlZCB0byBkZXRlcm1pbmUgdGhlIGR1cmF0aW9uLlxuICAgICAqL1xuIFxuICAgIHByaXZhdGUgc3RhdGljIE5vdGVEYXRhW10gXG4gICAgQ3JlYXRlTm90ZURhdGEoTGlzdDxNaWRpTm90ZT4gbWlkaW5vdGVzLCBLZXlTaWduYXR1cmUga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGltZVNpZ25hdHVyZSB0aW1lKSB7XG5cbiAgICAgICAgaW50IGxlbiA9IG1pZGlub3Rlcy5Db3VudDtcbiAgICAgICAgTm90ZURhdGFbXSBub3RlZGF0YSA9IG5ldyBOb3RlRGF0YVtsZW5dO1xuXG4gICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIE1pZGlOb3RlIG1pZGkgPSBtaWRpbm90ZXNbaV07XG4gICAgICAgICAgICBub3RlZGF0YVtpXSA9IG5ldyBOb3RlRGF0YSgpO1xuICAgICAgICAgICAgbm90ZWRhdGFbaV0ubnVtYmVyID0gbWlkaS5OdW1iZXI7XG4gICAgICAgICAgICBub3RlZGF0YVtpXS5sZWZ0c2lkZSA9IHRydWU7XG4gICAgICAgICAgICBub3RlZGF0YVtpXS53aGl0ZW5vdGUgPSBrZXkuR2V0V2hpdGVOb3RlKG1pZGkuTnVtYmVyKTtcbiAgICAgICAgICAgIG5vdGVkYXRhW2ldLmR1cmF0aW9uID0gdGltZS5HZXROb3RlRHVyYXRpb24obWlkaS5FbmRUaW1lIC0gbWlkaS5TdGFydFRpbWUpO1xuICAgICAgICAgICAgbm90ZWRhdGFbaV0uYWNjaWQgPSBrZXkuR2V0QWNjaWRlbnRhbChtaWRpLk51bWJlciwgbWlkaS5TdGFydFRpbWUgLyB0aW1lLk1lYXN1cmUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaSA+IDAgJiYgKG5vdGVkYXRhW2ldLndoaXRlbm90ZS5EaXN0KG5vdGVkYXRhW2ktMV0ud2hpdGVub3RlKSA9PSAxKSkge1xuICAgICAgICAgICAgICAgIC8qIFRoaXMgbm90ZSAobm90ZWRhdGFbaV0pIG92ZXJsYXBzIHdpdGggdGhlIHByZXZpb3VzIG5vdGUuXG4gICAgICAgICAgICAgICAgICogQ2hhbmdlIHRoZSBzaWRlIG9mIHRoaXMgbm90ZS5cbiAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgIGlmIChub3RlZGF0YVtpLTFdLmxlZnRzaWRlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vdGVkYXRhW2ldLmxlZnRzaWRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm90ZWRhdGFbaV0ubGVmdHNpZGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbm90ZWRhdGFbaV0ubGVmdHNpZGUgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub3RlZGF0YTtcbiAgICB9XG5cblxuICAgIC8qKiBHaXZlbiB0aGUgbm90ZSBkYXRhICh0aGUgd2hpdGUga2V5cyBhbmQgYWNjaWRlbnRhbHMpLCBjcmVhdGUgXG4gICAgICogdGhlIEFjY2lkZW50YWwgU3ltYm9scyBhbmQgcmV0dXJuIHRoZW0uXG4gICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgQWNjaWRTeW1ib2xbXSBcbiAgICBDcmVhdGVBY2NpZFN5bWJvbHMoTm90ZURhdGFbXSBub3RlZGF0YSwgQ2xlZiBjbGVmKSB7XG4gICAgICAgIGludCBjb3VudCA9IDA7XG4gICAgICAgIGZvcmVhY2ggKE5vdGVEYXRhIG4gaW4gbm90ZWRhdGEpIHtcbiAgICAgICAgICAgIGlmIChuLmFjY2lkICE9IEFjY2lkLk5vbmUpIHtcbiAgICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIEFjY2lkU3ltYm9sW10gc3ltYm9scyA9IG5ldyBBY2NpZFN5bWJvbFtjb3VudF07XG4gICAgICAgIGludCBpID0gMDtcbiAgICAgICAgZm9yZWFjaCAoTm90ZURhdGEgbiBpbiBub3RlZGF0YSkge1xuICAgICAgICAgICAgaWYgKG4uYWNjaWQgIT0gQWNjaWQuTm9uZSkge1xuICAgICAgICAgICAgICAgIHN5bWJvbHNbaV0gPSBuZXcgQWNjaWRTeW1ib2wobi5hY2NpZCwgbi53aGl0ZW5vdGUsIGNsZWYpO1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3ltYm9scztcbiAgICB9XG5cbiAgICAvKiogQ2FsY3VsYXRlIHRoZSBzdGVtIGRpcmVjdGlvbiAoVXAgb3IgZG93bikgYmFzZWQgb24gdGhlIHRvcCBhbmRcbiAgICAgKiBib3R0b20gbm90ZSBpbiB0aGUgY2hvcmQuICBJZiB0aGUgYXZlcmFnZSBvZiB0aGUgbm90ZXMgaXMgYWJvdmVcbiAgICAgKiB0aGUgbWlkZGxlIG9mIHRoZSBzdGFmZiwgdGhlIGRpcmVjdGlvbiBpcyBkb3duLiAgRWxzZSwgdGhlXG4gICAgICogZGlyZWN0aW9uIGlzIHVwLlxuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIGludCBcbiAgICBTdGVtRGlyZWN0aW9uKFdoaXRlTm90ZSBib3R0b20sIFdoaXRlTm90ZSB0b3AsIENsZWYgY2xlZikge1xuICAgICAgICBXaGl0ZU5vdGUgbWlkZGxlO1xuICAgICAgICBpZiAoY2xlZiA9PSBDbGVmLlRyZWJsZSlcbiAgICAgICAgICAgIG1pZGRsZSA9IG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkIsIDUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBtaWRkbGUgPSBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5ELCAzKTtcblxuICAgICAgICBpbnQgZGlzdCA9IG1pZGRsZS5EaXN0KGJvdHRvbSkgKyBtaWRkbGUuRGlzdCh0b3ApO1xuICAgICAgICBpZiAoZGlzdCA+PSAwKVxuICAgICAgICAgICAgcmV0dXJuIFN0ZW0uVXA7XG4gICAgICAgIGVsc2UgXG4gICAgICAgICAgICByZXR1cm4gU3RlbS5Eb3duO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gd2hldGhlciBhbnkgb2YgdGhlIG5vdGVzIGluIG5vdGVkYXRhIChiZXR3ZWVuIHN0YXJ0IGFuZFxuICAgICAqIGVuZCBpbmRleGVzKSBvdmVybGFwLiAgVGhpcyBpcyBuZWVkZWQgYnkgdGhlIFN0ZW0gY2xhc3MgdG9cbiAgICAgKiBkZXRlcm1pbmUgdGhlIHBvc2l0aW9uIG9mIHRoZSBzdGVtIChsZWZ0IG9yIHJpZ2h0IG9mIG5vdGVzKS5cbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBib29sIE5vdGVzT3ZlcmxhcChOb3RlRGF0YVtdIG5vdGVkYXRhLCBpbnQgc3RhcnQsIGludCBlbmQpIHtcbiAgICAgICAgZm9yIChpbnQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghbm90ZWRhdGFbaV0ubGVmdHNpZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgdGltZSAoaW4gcHVsc2VzKSB0aGlzIHN5bWJvbCBvY2N1cnMgYXQuXG4gICAgICogVGhpcyBpcyB1c2VkIHRvIGRldGVybWluZSB0aGUgbWVhc3VyZSB0aGlzIHN5bWJvbCBiZWxvbmdzIHRvLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgU3RhcnRUaW1lIHsgXG4gICAgICAgIGdldCB7IHJldHVybiBzdGFydHRpbWU7IH1cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBlbmQgdGltZSAoaW4gcHVsc2VzKSBvZiB0aGUgbG9uZ2VzdCBub3RlIGluIHRoZSBjaG9yZC5cbiAgICAgKiBVc2VkIHRvIGRldGVybWluZSB3aGV0aGVyIHR3byBhZGphY2VudCBjaG9yZHMgY2FuIGJlIGpvaW5lZFxuICAgICAqIGJ5IGEgc3RlbS5cbiAgICAgKi9cbiAgICBwdWJsaWMgaW50IEVuZFRpbWUgeyBcbiAgICAgICAgZ2V0IHsgcmV0dXJuIGVuZHRpbWU7IH1cbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHRoZSBjbGVmIHRoaXMgY2hvcmQgaXMgZHJhd24gaW4uICovXG4gICAgcHVibGljIENsZWYgQ2xlZiB7IFxuICAgICAgICBnZXQgeyByZXR1cm4gY2xlZjsgfVxuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdHJ1ZSBpZiB0aGlzIGNob3JkIGhhcyB0d28gc3RlbXMgKi9cbiAgICBwdWJsaWMgYm9vbCBIYXNUd29TdGVtcyB7XG4gICAgICAgIGdldCB7IHJldHVybiBoYXN0d29zdGVtczsgfVxuICAgIH1cblxuICAgIC8qIFJldHVybiB0aGUgc3RlbSB3aWxsIHRoZSBzbWFsbGVzdCBkdXJhdGlvbi4gIFRoaXMgcHJvcGVydHlcbiAgICAgKiBpcyB1c2VkIHdoZW4gbWFraW5nIGNob3JkIHBhaXJzIChjaG9yZHMgam9pbmVkIGJ5IGEgaG9yaXpvbnRhbFxuICAgICAqIGJlYW0gc3RlbSkuIFRoZSBzdGVtIGR1cmF0aW9ucyBtdXN0IG1hdGNoIGluIG9yZGVyIHRvIG1ha2VcbiAgICAgKiBhIGNob3JkIHBhaXIuICBJZiBhIGNob3JkIGhhcyB0d28gc3RlbXMsIHdlIGFsd2F5cyByZXR1cm5cbiAgICAgKiB0aGUgb25lIHdpdGggYSBzbWFsbGVyIGR1cmF0aW9uLCBiZWNhdXNlIGl0IGhhcyBhIGJldHRlciBcbiAgICAgKiBjaGFuY2Ugb2YgbWFraW5nIGEgcGFpci5cbiAgICAgKi9cbiAgICBwdWJsaWMgU3RlbSBTdGVtIHtcbiAgICAgICAgZ2V0IHsgXG4gICAgICAgICAgICBpZiAoc3RlbTEgPT0gbnVsbCkgeyByZXR1cm4gc3RlbTI7IH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHN0ZW0yID09IG51bGwpIHsgcmV0dXJuIHN0ZW0xOyB9XG4gICAgICAgICAgICBlbHNlIGlmIChzdGVtMS5EdXJhdGlvbiA8IHN0ZW0yLkR1cmF0aW9uKSB7IHJldHVybiBzdGVtMTsgfVxuICAgICAgICAgICAgZWxzZSB7IHJldHVybiBzdGVtMjsgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIEdldC9TZXQgdGhlIHdpZHRoIChpbiBwaXhlbHMpIG9mIHRoaXMgc3ltYm9sLiBUaGUgd2lkdGggaXMgc2V0XG4gICAgICogaW4gU2hlZXRNdXNpYy5BbGlnblN5bWJvbHMoKSB0byB2ZXJ0aWNhbGx5IGFsaWduIHN5bWJvbHMuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBXaWR0aCB7XG4gICAgICAgIGdldCB7IHJldHVybiB3aWR0aDsgfVxuICAgICAgICBzZXQgeyB3aWR0aCA9IHZhbHVlOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbWluaW11bSB3aWR0aCAoaW4gcGl4ZWxzKSBuZWVkZWQgdG8gZHJhdyB0aGlzIHN5bWJvbCAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgTWluV2lkdGgge1xuICAgICAgICBnZXQgeyByZXR1cm4gR2V0TWluV2lkdGgoKTsgfVxuICAgIH1cblxuICAgIC8qIFJldHVybiB0aGUgbWluaW11bSB3aWR0aCBuZWVkZWQgdG8gZGlzcGxheSB0aGlzIGNob3JkLlxuICAgICAqXG4gICAgICogVGhlIGFjY2lkZW50YWwgc3ltYm9scyBjYW4gYmUgZHJhd24gYWJvdmUgb25lIGFub3RoZXIgYXMgbG9uZ1xuICAgICAqIGFzIHRoZXkgZG9uJ3Qgb3ZlcmxhcCAodGhleSBtdXN0IGJlIGF0IGxlYXN0IDYgbm90ZXMgYXBhcnQpLlxuICAgICAqIElmIHR3byBhY2NpZGVudGFsIHN5bWJvbHMgZG8gb3ZlcmxhcCwgdGhlIGFjY2lkZW50YWwgc3ltYm9sXG4gICAgICogb24gdG9wIG11c3QgYmUgc2hpZnRlZCB0byB0aGUgcmlnaHQuICBTbyB0aGUgd2lkdGggbmVlZGVkIGZvclxuICAgICAqIGFjY2lkZW50YWwgc3ltYm9scyBkZXBlbmRzIG9uIHdoZXRoZXIgdGhleSBvdmVybGFwIG9yIG5vdC5cbiAgICAgKlxuICAgICAqIElmIHdlIGFyZSBhbHNvIGRpc3BsYXlpbmcgdGhlIGxldHRlcnMsIGluY2x1ZGUgZXh0cmEgd2lkdGguXG4gICAgICovXG4gICAgaW50IEdldE1pbldpZHRoKCkge1xuICAgICAgICAvKiBUaGUgd2lkdGggbmVlZGVkIGZvciB0aGUgbm90ZSBjaXJjbGVzICovXG4gICAgICAgIGludCByZXN1bHQgPSAyKlNoZWV0TXVzaWMuTm90ZUhlaWdodCArIFNoZWV0TXVzaWMuTm90ZUhlaWdodCozLzQ7XG5cbiAgICAgICAgaWYgKGFjY2lkc3ltYm9scy5MZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gYWNjaWRzeW1ib2xzWzBdLk1pbldpZHRoO1xuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDE7IGkgPCBhY2NpZHN5bWJvbHMuTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBBY2NpZFN5bWJvbCBhY2NpZCA9IGFjY2lkc3ltYm9sc1tpXTtcbiAgICAgICAgICAgICAgICBBY2NpZFN5bWJvbCBwcmV2ID0gYWNjaWRzeW1ib2xzW2ktMV07XG4gICAgICAgICAgICAgICAgaWYgKGFjY2lkLk5vdGUuRGlzdChwcmV2Lk5vdGUpIDwgNikge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gYWNjaWQuTWluV2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzaGVldG11c2ljICE9IG51bGwgJiYgc2hlZXRtdXNpYy5TaG93Tm90ZUxldHRlcnMgIT0gTWlkaU9wdGlvbnMuTm90ZU5hbWVOb25lKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gODtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuXG4gICAgLyoqIEdldCB0aGUgbnVtYmVyIG9mIHBpeGVscyB0aGlzIHN5bWJvbCBleHRlbmRzIGFib3ZlIHRoZSBzdGFmZi4gVXNlZFxuICAgICAqICB0byBkZXRlcm1pbmUgdGhlIG1pbmltdW0gaGVpZ2h0IG5lZWRlZCBmb3IgdGhlIHN0YWZmIChTdGFmZi5GaW5kQm91bmRzKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IEFib3ZlU3RhZmYge1xuICAgICAgICBnZXQgeyByZXR1cm4gR2V0QWJvdmVTdGFmZigpOyB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbnQgR2V0QWJvdmVTdGFmZigpIHtcbiAgICAgICAgLyogRmluZCB0aGUgdG9wbW9zdCBub3RlIGluIHRoZSBjaG9yZCAqL1xuICAgICAgICBXaGl0ZU5vdGUgdG9wbm90ZSA9IG5vdGVkYXRhWyBub3RlZGF0YS5MZW5ndGgtMSBdLndoaXRlbm90ZTtcblxuICAgICAgICAvKiBUaGUgc3RlbS5FbmQgaXMgdGhlIG5vdGUgcG9zaXRpb24gd2hlcmUgdGhlIHN0ZW0gZW5kcy5cbiAgICAgICAgICogQ2hlY2sgaWYgdGhlIHN0ZW0gZW5kIGlzIGhpZ2hlciB0aGFuIHRoZSB0b3Agbm90ZS5cbiAgICAgICAgICovXG4gICAgICAgIGlmIChzdGVtMSAhPSBudWxsKVxuICAgICAgICAgICAgdG9wbm90ZSA9IFdoaXRlTm90ZS5NYXgodG9wbm90ZSwgc3RlbTEuRW5kKTtcbiAgICAgICAgaWYgKHN0ZW0yICE9IG51bGwpXG4gICAgICAgICAgICB0b3Bub3RlID0gV2hpdGVOb3RlLk1heCh0b3Bub3RlLCBzdGVtMi5FbmQpO1xuXG4gICAgICAgIGludCBkaXN0ID0gdG9wbm90ZS5EaXN0KFdoaXRlTm90ZS5Ub3AoY2xlZikpICogU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7XG4gICAgICAgIGludCByZXN1bHQgPSAwO1xuICAgICAgICBpZiAoZGlzdCA+IDApXG4gICAgICAgICAgICByZXN1bHQgPSBkaXN0O1xuXG4gICAgICAgIC8qIENoZWNrIGlmIGFueSBhY2NpZGVudGFsIHN5bWJvbHMgZXh0ZW5kIGFib3ZlIHRoZSBzdGFmZiAqL1xuICAgICAgICBmb3JlYWNoIChBY2NpZFN5bWJvbCBzeW1ib2wgaW4gYWNjaWRzeW1ib2xzKSB7XG4gICAgICAgICAgICBpZiAoc3ltYm9sLkFib3ZlU3RhZmYgPiByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBzeW1ib2wuQWJvdmVTdGFmZjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBwaXhlbHMgdGhpcyBzeW1ib2wgZXh0ZW5kcyBiZWxvdyB0aGUgc3RhZmYuIFVzZWRcbiAgICAgKiAgdG8gZGV0ZXJtaW5lIHRoZSBtaW5pbXVtIGhlaWdodCBuZWVkZWQgZm9yIHRoZSBzdGFmZiAoU3RhZmYuRmluZEJvdW5kcykuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBCZWxvd1N0YWZmIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIEdldEJlbG93U3RhZmYoKTsgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaW50IEdldEJlbG93U3RhZmYoKSB7XG4gICAgICAgIC8qIEZpbmQgdGhlIGJvdHRvbSBub3RlIGluIHRoZSBjaG9yZCAqL1xuICAgICAgICBXaGl0ZU5vdGUgYm90dG9tbm90ZSA9IG5vdGVkYXRhWzBdLndoaXRlbm90ZTtcblxuICAgICAgICAvKiBUaGUgc3RlbS5FbmQgaXMgdGhlIG5vdGUgcG9zaXRpb24gd2hlcmUgdGhlIHN0ZW0gZW5kcy5cbiAgICAgICAgICogQ2hlY2sgaWYgdGhlIHN0ZW0gZW5kIGlzIGxvd2VyIHRoYW4gdGhlIGJvdHRvbSBub3RlLlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHN0ZW0xICE9IG51bGwpXG4gICAgICAgICAgICBib3R0b21ub3RlID0gV2hpdGVOb3RlLk1pbihib3R0b21ub3RlLCBzdGVtMS5FbmQpO1xuICAgICAgICBpZiAoc3RlbTIgIT0gbnVsbClcbiAgICAgICAgICAgIGJvdHRvbW5vdGUgPSBXaGl0ZU5vdGUuTWluKGJvdHRvbW5vdGUsIHN0ZW0yLkVuZCk7XG5cbiAgICAgICAgaW50IGRpc3QgPSBXaGl0ZU5vdGUuQm90dG9tKGNsZWYpLkRpc3QoYm90dG9tbm90ZSkgKlxuICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yO1xuXG4gICAgICAgIGludCByZXN1bHQgPSAwO1xuICAgICAgICBpZiAoZGlzdCA+IDApXG4gICAgICAgICAgICByZXN1bHQgPSBkaXN0O1xuXG4gICAgICAgIC8qIENoZWNrIGlmIGFueSBhY2NpZGVudGFsIHN5bWJvbHMgZXh0ZW5kIGJlbG93IHRoZSBzdGFmZiAqLyBcbiAgICAgICAgZm9yZWFjaCAoQWNjaWRTeW1ib2wgc3ltYm9sIGluIGFjY2lkc3ltYm9scykge1xuICAgICAgICAgICAgaWYgKHN5bWJvbC5CZWxvd1N0YWZmID4gcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gc3ltYm9sLkJlbG93U3RhZmY7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBuYW1lIGZvciB0aGlzIG5vdGUgKi9cbiAgICBwcml2YXRlIHN0cmluZyBOb3RlTmFtZShpbnQgbm90ZW51bWJlciwgV2hpdGVOb3RlIHdoaXRlbm90ZSkge1xuICAgICAgICBpZiAoc2hlZXRtdXNpYy5TaG93Tm90ZUxldHRlcnMgPT0gTWlkaU9wdGlvbnMuTm90ZU5hbWVMZXR0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBMZXR0ZXIobm90ZW51bWJlciwgd2hpdGVub3RlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzaGVldG11c2ljLlNob3dOb3RlTGV0dGVycyA9PSBNaWRpT3B0aW9ucy5Ob3RlTmFtZUZpeGVkRG9SZU1pKSB7XG4gICAgICAgICAgICBzdHJpbmdbXSBmaXhlZERvUmVNaSA9IHtcbiAgICAgICAgICAgICAgICBcIkxhXCIsIFwiTGlcIiwgXCJUaVwiLCBcIkRvXCIsIFwiRGlcIiwgXCJSZVwiLCBcIlJpXCIsIFwiTWlcIiwgXCJGYVwiLCBcIkZpXCIsIFwiU29cIiwgXCJTaVwiIFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGludCBub3Rlc2NhbGUgPSBOb3RlU2NhbGUuRnJvbU51bWJlcihub3RlbnVtYmVyKTtcbiAgICAgICAgICAgIHJldHVybiBmaXhlZERvUmVNaVtub3Rlc2NhbGVdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNoZWV0bXVzaWMuU2hvd05vdGVMZXR0ZXJzID09IE1pZGlPcHRpb25zLk5vdGVOYW1lTW92YWJsZURvUmVNaSkge1xuICAgICAgICAgICAgc3RyaW5nW10gZml4ZWREb1JlTWkgPSB7XG4gICAgICAgICAgICAgICAgXCJMYVwiLCBcIkxpXCIsIFwiVGlcIiwgXCJEb1wiLCBcIkRpXCIsIFwiUmVcIiwgXCJSaVwiLCBcIk1pXCIsIFwiRmFcIiwgXCJGaVwiLCBcIlNvXCIsIFwiU2lcIiBcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbnQgbWFpbnNjYWxlID0gc2hlZXRtdXNpYy5NYWluS2V5Lk5vdGVzY2FsZSgpO1xuICAgICAgICAgICAgaW50IGRpZmYgPSBOb3RlU2NhbGUuQyAtIG1haW5zY2FsZTtcbiAgICAgICAgICAgIG5vdGVudW1iZXIgKz0gZGlmZjtcbiAgICAgICAgICAgIGlmIChub3RlbnVtYmVyIDwgMCkge1xuICAgICAgICAgICAgICAgIG5vdGVudW1iZXIgKz0gMTI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbnQgbm90ZXNjYWxlID0gTm90ZVNjYWxlLkZyb21OdW1iZXIobm90ZW51bWJlcik7XG4gICAgICAgICAgICByZXR1cm4gZml4ZWREb1JlTWlbbm90ZXNjYWxlXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzaGVldG11c2ljLlNob3dOb3RlTGV0dGVycyA9PSBNaWRpT3B0aW9ucy5Ob3RlTmFtZUZpeGVkTnVtYmVyKSB7XG4gICAgICAgICAgICBzdHJpbmdbXSBudW0gPSB7XG4gICAgICAgICAgICAgICAgXCIxMFwiLCBcIjExXCIsIFwiMTJcIiwgXCIxXCIsIFwiMlwiLCBcIjNcIiwgXCI0XCIsIFwiNVwiLCBcIjZcIiwgXCI3XCIsIFwiOFwiLCBcIjlcIiBcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbnQgbm90ZXNjYWxlID0gTm90ZVNjYWxlLkZyb21OdW1iZXIobm90ZW51bWJlcik7XG4gICAgICAgICAgICByZXR1cm4gbnVtW25vdGVzY2FsZV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2hlZXRtdXNpYy5TaG93Tm90ZUxldHRlcnMgPT0gTWlkaU9wdGlvbnMuTm90ZU5hbWVNb3ZhYmxlTnVtYmVyKSB7XG4gICAgICAgICAgICBzdHJpbmdbXSBudW0gPSB7XG4gICAgICAgICAgICAgICAgXCIxMFwiLCBcIjExXCIsIFwiMTJcIiwgXCIxXCIsIFwiMlwiLCBcIjNcIiwgXCI0XCIsIFwiNVwiLCBcIjZcIiwgXCI3XCIsIFwiOFwiLCBcIjlcIiBcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbnQgbWFpbnNjYWxlID0gc2hlZXRtdXNpYy5NYWluS2V5Lk5vdGVzY2FsZSgpO1xuICAgICAgICAgICAgaW50IGRpZmYgPSBOb3RlU2NhbGUuQyAtIG1haW5zY2FsZTtcbiAgICAgICAgICAgIG5vdGVudW1iZXIgKz0gZGlmZjtcbiAgICAgICAgICAgIGlmIChub3RlbnVtYmVyIDwgMCkge1xuICAgICAgICAgICAgICAgIG5vdGVudW1iZXIgKz0gMTI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbnQgbm90ZXNjYWxlID0gTm90ZVNjYWxlLkZyb21OdW1iZXIobm90ZW51bWJlcik7XG4gICAgICAgICAgICByZXR1cm4gbnVtW25vdGVzY2FsZV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIGxldHRlciAoQSwgQSMsIEJiKSByZXByZXNlbnRpbmcgdGhpcyBub3RlICovXG4gICAgcHJpdmF0ZSBzdHJpbmcgTGV0dGVyKGludCBub3RlbnVtYmVyLCBXaGl0ZU5vdGUgd2hpdGVub3RlKSB7XG4gICAgICAgIGludCBub3Rlc2NhbGUgPSBOb3RlU2NhbGUuRnJvbU51bWJlcihub3RlbnVtYmVyKTtcbiAgICAgICAgc3dpdGNoKG5vdGVzY2FsZSkge1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuQTogcmV0dXJuIFwiQVwiO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuQjogcmV0dXJuIFwiQlwiO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuQzogcmV0dXJuIFwiQ1wiO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuRDogcmV0dXJuIFwiRFwiO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuRTogcmV0dXJuIFwiRVwiO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuRjogcmV0dXJuIFwiRlwiO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuRzogcmV0dXJuIFwiR1wiO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuQXNoYXJwOlxuICAgICAgICAgICAgICAgIGlmICh3aGl0ZW5vdGUuTGV0dGVyID09IFdoaXRlTm90ZS5BKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJBI1wiO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiQmJcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkNzaGFycDpcbiAgICAgICAgICAgICAgICBpZiAod2hpdGVub3RlLkxldHRlciA9PSBXaGl0ZU5vdGUuQylcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiQyNcIjtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIkRiXCI7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5Ec2hhcnA6XG4gICAgICAgICAgICAgICAgaWYgKHdoaXRlbm90ZS5MZXR0ZXIgPT0gV2hpdGVOb3RlLkQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIkQjXCI7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJFYlwiO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuRnNoYXJwOlxuICAgICAgICAgICAgICAgIGlmICh3aGl0ZW5vdGUuTGV0dGVyID09IFdoaXRlTm90ZS5GKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJGI1wiO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiR2JcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkdzaGFycDpcbiAgICAgICAgICAgICAgICBpZiAod2hpdGVub3RlLkxldHRlciA9PSBXaGl0ZU5vdGUuRylcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiRyNcIjtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIkFiXCI7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIERyYXcgdGhlIENob3JkIFN5bWJvbDpcbiAgICAgKiAtIERyYXcgdGhlIGFjY2lkZW50YWwgc3ltYm9scy5cbiAgICAgKiAtIERyYXcgdGhlIGJsYWNrIGNpcmNsZSBub3Rlcy5cbiAgICAgKiAtIERyYXcgdGhlIHN0ZW1zLlxuICAgICAgQHBhcmFtIHl0b3AgVGhlIHlsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIHZvaWQgRHJhdyhHcmFwaGljcyBnLCBQZW4gcGVuLCBpbnQgeXRvcCkge1xuICAgICAgICAvKiBBbGlnbiB0aGUgY2hvcmQgdG8gdGhlIHJpZ2h0ICovXG4gICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKFdpZHRoIC0gTWluV2lkdGgsIDApO1xuXG4gICAgICAgIC8qIERyYXcgdGhlIGFjY2lkZW50YWxzLiAqL1xuICAgICAgICBXaGl0ZU5vdGUgdG9wc3RhZmYgPSBXaGl0ZU5vdGUuVG9wKGNsZWYpO1xuICAgICAgICBpbnQgeHBvcyA9IERyYXdBY2NpZChnLCBwZW4sIHl0b3ApO1xuXG4gICAgICAgIC8qIERyYXcgdGhlIG5vdGVzICovXG4gICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKHhwb3MsIDApO1xuICAgICAgICBEcmF3Tm90ZXMoZywgcGVuLCB5dG9wLCB0b3BzdGFmZik7XG4gICAgICAgIGlmIChzaGVldG11c2ljICE9IG51bGwgJiYgc2hlZXRtdXNpYy5TaG93Tm90ZUxldHRlcnMgIT0gMCkge1xuICAgICAgICAgICAgRHJhd05vdGVMZXR0ZXJzKGcsIHBlbiwgeXRvcCwgdG9wc3RhZmYpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogRHJhdyB0aGUgc3RlbXMgKi9cbiAgICAgICAgaWYgKHN0ZW0xICE9IG51bGwpXG4gICAgICAgICAgICBzdGVtMS5EcmF3KGcsIHBlbiwgeXRvcCwgdG9wc3RhZmYpO1xuICAgICAgICBpZiAoc3RlbTIgIT0gbnVsbClcbiAgICAgICAgICAgIHN0ZW0yLkRyYXcoZywgcGVuLCB5dG9wLCB0b3BzdGFmZik7XG5cbiAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oLXhwb3MsIDApO1xuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgtKFdpZHRoIC0gTWluV2lkdGgpLCAwKTtcbiAgICB9XG5cbiAgICAvKiBEcmF3IHRoZSBhY2NpZGVudGFsIHN5bWJvbHMuICBJZiB0d28gc3ltYm9scyBvdmVybGFwIChpZiB0aGV5XG4gICAgICogYXJlIGxlc3MgdGhhbiA2IG5vdGVzIGFwYXJ0KSwgd2UgY2Fubm90IGRyYXcgdGhlIHN5bWJvbCBkaXJlY3RseVxuICAgICAqIGFib3ZlIHRoZSBwcmV2aW91cyBvbmUuICBJbnN0ZWFkLCB3ZSBtdXN0IHNoaWZ0IGl0IHRvIHRoZSByaWdodC5cbiAgICAgKiBAcGFyYW0geXRvcCBUaGUgeWxvY2F0aW9uIChpbiBwaXhlbHMpIHdoZXJlIHRoZSB0b3Agb2YgdGhlIHN0YWZmIHN0YXJ0cy5cbiAgICAgKiBAcmV0dXJuIFRoZSB4IHBpeGVsIHdpZHRoIHVzZWQgYnkgYWxsIHRoZSBhY2NpZGVudGFscy5cbiAgICAgKi9cbiAgICBwdWJsaWMgaW50IERyYXdBY2NpZChHcmFwaGljcyBnLCBQZW4gcGVuLCBpbnQgeXRvcCkge1xuICAgICAgICBpbnQgeHBvcyA9IDA7XG5cbiAgICAgICAgQWNjaWRTeW1ib2wgcHJldiA9IG51bGw7XG4gICAgICAgIGZvcmVhY2ggKEFjY2lkU3ltYm9sIHN5bWJvbCBpbiBhY2NpZHN5bWJvbHMpIHtcbiAgICAgICAgICAgIGlmIChwcmV2ICE9IG51bGwgJiYgc3ltYm9sLk5vdGUuRGlzdChwcmV2Lk5vdGUpIDwgNikge1xuICAgICAgICAgICAgICAgIHhwb3MgKz0gc3ltYm9sLldpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oeHBvcywgMCk7XG4gICAgICAgICAgICBzeW1ib2wuRHJhdyhnLCBwZW4sIHl0b3ApO1xuICAgICAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oLXhwb3MsIDApO1xuICAgICAgICAgICAgcHJldiA9IHN5bWJvbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJldiAhPSBudWxsKSB7XG4gICAgICAgICAgICB4cG9zICs9IHByZXYuV2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHhwb3M7XG4gICAgfVxuXG4gICAgLyoqIERyYXcgdGhlIGJsYWNrIGNpcmNsZSBub3Rlcy5cbiAgICAgKiBAcGFyYW0geXRvcCBUaGUgeWxvY2F0aW9uIChpbiBwaXhlbHMpIHdoZXJlIHRoZSB0b3Agb2YgdGhlIHN0YWZmIHN0YXJ0cy5cbiAgICAgKiBAcGFyYW0gdG9wc3RhZmYgVGhlIHdoaXRlIG5vdGUgb2YgdGhlIHRvcCBvZiB0aGUgc3RhZmYuXG4gICAgICovXG4gICAgcHVibGljIHZvaWQgRHJhd05vdGVzKEdyYXBoaWNzIGcsIFBlbiBwZW4sIGludCB5dG9wLCBXaGl0ZU5vdGUgdG9wc3RhZmYpIHtcbiAgICAgICAgcGVuLldpZHRoID0gMTtcbiAgICAgICAgZm9yZWFjaCAoTm90ZURhdGEgbm90ZSBpbiBub3RlZGF0YSkge1xuICAgICAgICAgICAgLyogR2V0IHRoZSB4LHkgcG9zaXRpb24gdG8gZHJhdyB0aGUgbm90ZSAqL1xuICAgICAgICAgICAgaW50IHlub3RlID0geXRvcCArIHRvcHN0YWZmLkRpc3Qobm90ZS53aGl0ZW5vdGUpICogXG4gICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLk5vdGVIZWlnaHQvMjtcblxuICAgICAgICAgICAgaW50IHhub3RlID0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNDtcbiAgICAgICAgICAgIGlmICghbm90ZS5sZWZ0c2lkZSlcbiAgICAgICAgICAgICAgICB4bm90ZSArPSBTaGVldE11c2ljLk5vdGVXaWR0aDtcblxuICAgICAgICAgICAgLyogRHJhdyByb3RhdGVkIGVsbGlwc2UuICBZb3UgbXVzdCBmaXJzdCB0cmFuc2xhdGUgKDAsMClcbiAgICAgICAgICAgICAqIHRvIHRoZSBjZW50ZXIgb2YgdGhlIGVsbGlwc2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKHhub3RlICsgU2hlZXRNdXNpYy5Ob3RlV2lkdGgvMiArIDEsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeW5vdGUgLSBTaGVldE11c2ljLkxpbmVXaWR0aCArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzIpO1xuICAgICAgICAgICAgZy5Sb3RhdGVUcmFuc2Zvcm0oLTQ1KTtcblxuICAgICAgICAgICAgaWYgKHNoZWV0bXVzaWMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHBlbi5Db2xvciA9IHNoZWV0bXVzaWMuTm90ZUNvbG9yKG5vdGUubnVtYmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlbi5Db2xvciA9IENvbG9yLkJsYWNrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobm90ZS5kdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uV2hvbGUgfHwgXG4gICAgICAgICAgICAgICAgbm90ZS5kdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uSGFsZiB8fFxuICAgICAgICAgICAgICAgIG5vdGUuZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLkRvdHRlZEhhbGYpIHtcblxuICAgICAgICAgICAgICAgIGcuRHJhd0VsbGlwc2UocGVuLCAtU2hlZXRNdXNpYy5Ob3RlV2lkdGgvMiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLk5vdGVXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZUhlaWdodC0xKTtcblxuICAgICAgICAgICAgICAgIGcuRHJhd0VsbGlwc2UocGVuLCAtU2hlZXRNdXNpYy5Ob3RlV2lkdGgvMiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzIgKyAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLk5vdGVIZWlnaHQtMik7XG5cbiAgICAgICAgICAgICAgICBnLkRyYXdFbGxpcHNlKHBlbiwgLVNoZWV0TXVzaWMuTm90ZVdpZHRoLzIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLVNoZWV0TXVzaWMuTm90ZUhlaWdodC8yICsgMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZVdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LTMpO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBCcnVzaCBicnVzaCA9IEJydXNoZXMuQmxhY2s7XG4gICAgICAgICAgICAgICAgaWYgKHBlbi5Db2xvciAhPSBDb2xvci5CbGFjaykge1xuICAgICAgICAgICAgICAgICAgICBicnVzaCA9IG5ldyBTb2xpZEJydXNoKHBlbi5Db2xvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGcuRmlsbEVsbGlwc2UoYnJ1c2gsIC1TaGVldE11c2ljLk5vdGVXaWR0aC8yLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC1TaGVldE11c2ljLk5vdGVIZWlnaHQvMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZVdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LTEpO1xuICAgICAgICAgICAgICAgIGlmIChwZW4uQ29sb3IgIT0gQ29sb3IuQmxhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgYnJ1c2guRGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGVuLkNvbG9yID0gQ29sb3IuQmxhY2s7XG4gICAgICAgICAgICBnLkRyYXdFbGxpcHNlKHBlbiwgLVNoZWV0TXVzaWMuTm90ZVdpZHRoLzIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAtU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLk5vdGVXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZUhlaWdodC0xKTtcblxuICAgICAgICAgICAgZy5Sb3RhdGVUcmFuc2Zvcm0oNDUpO1xuICAgICAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oIC0gKHhub3RlICsgU2hlZXRNdXNpYy5Ob3RlV2lkdGgvMiArIDEpLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtICh5bm90ZSAtIFNoZWV0TXVzaWMuTGluZVdpZHRoICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzIpKTtcblxuICAgICAgICAgICAgLyogRHJhdyBhIGRvdCBpZiB0aGlzIGlzIGEgZG90dGVkIGR1cmF0aW9uLiAqL1xuICAgICAgICAgICAgaWYgKG5vdGUuZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLkRvdHRlZEhhbGYgfHxcbiAgICAgICAgICAgICAgICBub3RlLmR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRRdWFydGVyIHx8XG4gICAgICAgICAgICAgICAgbm90ZS5kdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uRG90dGVkRWlnaHRoKSB7XG5cbiAgICAgICAgICAgICAgICBnLkZpbGxFbGxpcHNlKEJydXNoZXMuQmxhY2ssIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeG5vdGUgKyBTaGVldE11c2ljLk5vdGVXaWR0aCArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5MaW5lU3BhY2UvMyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlub3RlICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UvMywgNCwgNCk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogRHJhdyBob3Jpem9udGFsIGxpbmVzIGlmIG5vdGUgaXMgYWJvdmUvYmVsb3cgdGhlIHN0YWZmICovXG4gICAgICAgICAgICBXaGl0ZU5vdGUgdG9wID0gdG9wc3RhZmYuQWRkKDEpO1xuICAgICAgICAgICAgaW50IGRpc3QgPSBub3RlLndoaXRlbm90ZS5EaXN0KHRvcCk7XG4gICAgICAgICAgICBpbnQgeSA9IHl0b3AgLSBTaGVldE11c2ljLkxpbmVXaWR0aDtcblxuICAgICAgICAgICAgaWYgKGRpc3QgPj0gMikge1xuICAgICAgICAgICAgICAgIGZvciAoaW50IGkgPSAyOyBpIDw9IGRpc3Q7IGkgKz0gMikge1xuICAgICAgICAgICAgICAgICAgICB5IC09IFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgZy5EcmF3TGluZShwZW4sIHhub3RlIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNCwgeSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4bm90ZSArIFNoZWV0TXVzaWMuTm90ZVdpZHRoICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLkxpbmVTcGFjZS80LCB5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIFdoaXRlTm90ZSBib3R0b20gPSB0b3AuQWRkKC04KTtcbiAgICAgICAgICAgIHkgPSB5dG9wICsgKFNoZWV0TXVzaWMuTGluZVNwYWNlICsgU2hlZXRNdXNpYy5MaW5lV2lkdGgpICogNCAtIDE7XG4gICAgICAgICAgICBkaXN0ID0gYm90dG9tLkRpc3Qobm90ZS53aGl0ZW5vdGUpO1xuICAgICAgICAgICAgaWYgKGRpc3QgPj0gMikge1xuICAgICAgICAgICAgICAgIGZvciAoaW50IGkgPSAyOyBpIDw9IGRpc3Q7IGkrPSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHkgKz0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBnLkRyYXdMaW5lKHBlbiwgeG5vdGUgLSBTaGVldE11c2ljLkxpbmVTcGFjZS80LCB5LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhub3RlICsgU2hlZXRNdXNpYy5Ob3RlV2lkdGggKyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTGluZVNwYWNlLzQsIHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIEVuZCBkcmF3aW5nIGhvcml6b250YWwgbGluZXMgKi9cblxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIERyYXcgdGhlIG5vdGUgbGV0dGVycyAoQSwgQSMsIEJiLCBldGMpIG5leHQgdG8gdGhlIG5vdGUgY2lyY2xlcy5cbiAgICAgKiBAcGFyYW0geXRvcCBUaGUgeWxvY2F0aW9uIChpbiBwaXhlbHMpIHdoZXJlIHRoZSB0b3Agb2YgdGhlIHN0YWZmIHN0YXJ0cy5cbiAgICAgKiBAcGFyYW0gdG9wc3RhZmYgVGhlIHdoaXRlIG5vdGUgb2YgdGhlIHRvcCBvZiB0aGUgc3RhZmYuXG4gICAgICovXG4gICAgcHVibGljIHZvaWQgRHJhd05vdGVMZXR0ZXJzKEdyYXBoaWNzIGcsIFBlbiBwZW4sIGludCB5dG9wLCBXaGl0ZU5vdGUgdG9wc3RhZmYpIHtcbiAgICAgICAgYm9vbCBvdmVybGFwID0gTm90ZXNPdmVybGFwKG5vdGVkYXRhLCAwLCBub3RlZGF0YS5MZW5ndGgpO1xuICAgICAgICBwZW4uV2lkdGggPSAxO1xuXG4gICAgICAgIGZvcmVhY2ggKE5vdGVEYXRhIG5vdGUgaW4gbm90ZWRhdGEpIHtcbiAgICAgICAgICAgIGlmICghbm90ZS5sZWZ0c2lkZSkge1xuICAgICAgICAgICAgICAgIC8qIFRoZXJlJ3Mgbm90IGVub3VnaHQgcGl4ZWwgcm9vbSB0byBzaG93IHRoZSBsZXR0ZXIgKi9cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogR2V0IHRoZSB4LHkgcG9zaXRpb24gdG8gZHJhdyB0aGUgbm90ZSAqL1xuICAgICAgICAgICAgaW50IHlub3RlID0geXRvcCArIHRvcHN0YWZmLkRpc3Qobm90ZS53aGl0ZW5vdGUpICogXG4gICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLk5vdGVIZWlnaHQvMjtcblxuICAgICAgICAgICAgLyogRHJhdyB0aGUgbGV0dGVyIHRvIHRoZSByaWdodCBzaWRlIG9mIHRoZSBub3RlICovXG4gICAgICAgICAgICBpbnQgeG5vdGUgPSBTaGVldE11c2ljLk5vdGVXaWR0aCArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzQ7XG5cbiAgICAgICAgICAgIGlmIChub3RlLmR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRIYWxmIHx8XG4gICAgICAgICAgICAgICAgbm90ZS5kdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uRG90dGVkUXVhcnRlciB8fFxuICAgICAgICAgICAgICAgIG5vdGUuZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLkRvdHRlZEVpZ2h0aCB8fCBvdmVybGFwKSB7XG5cbiAgICAgICAgICAgICAgICB4bm90ZSArPSBTaGVldE11c2ljLk5vdGVXaWR0aC8yO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIGcuRHJhd1N0cmluZyhOb3RlTmFtZShub3RlLm51bWJlciwgbm90ZS53aGl0ZW5vdGUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTGV0dGVyRm9udCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgQnJ1c2hlcy5CbGFjayxcbiAgICAgICAgICAgICAgICAgICAgICAgICB4bm90ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICB5bm90ZSAtIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqIFJldHVybiB0cnVlIGlmIHRoZSBjaG9yZHMgY2FuIGJlIGNvbm5lY3RlZCwgd2hlcmUgdGhlaXIgc3RlbXMgYXJlXG4gICAgICogam9pbmVkIGJ5IGEgaG9yaXpvbnRhbCBiZWFtLiBJbiBvcmRlciB0byBjcmVhdGUgdGhlIGJlYW06XG4gICAgICpcbiAgICAgKiAtIFRoZSBjaG9yZHMgbXVzdCBiZSBpbiB0aGUgc2FtZSBtZWFzdXJlLlxuICAgICAqIC0gVGhlIGNob3JkIHN0ZW1zIHNob3VsZCBub3QgYmUgYSBkb3R0ZWQgZHVyYXRpb24uXG4gICAgICogLSBUaGUgY2hvcmQgc3RlbXMgbXVzdCBiZSB0aGUgc2FtZSBkdXJhdGlvbiwgd2l0aCBvbmUgZXhjZXB0aW9uXG4gICAgICogICAoRG90dGVkIEVpZ2h0aCB0byBTaXh0ZWVudGgpLlxuICAgICAqIC0gVGhlIHN0ZW1zIG11c3QgYWxsIHBvaW50IGluIHRoZSBzYW1lIGRpcmVjdGlvbiAodXAgb3IgZG93bikuXG4gICAgICogLSBUaGUgY2hvcmQgY2Fubm90IGFscmVhZHkgYmUgcGFydCBvZiBhIGJlYW0uXG4gICAgICpcbiAgICAgKiAtIDYtY2hvcmQgYmVhbXMgbXVzdCBiZSA4dGggbm90ZXMgaW4gMy80LCA2LzgsIG9yIDYvNCB0aW1lXG4gICAgICogLSAzLWNob3JkIGJlYW1zIG11c3QgYmUgZWl0aGVyIHRyaXBsZXRzLCBvciA4dGggbm90ZXMgKDEyLzggdGltZSBzaWduYXR1cmUpXG4gICAgICogLSA0LWNob3JkIGJlYW1zIGFyZSBvayBmb3IgMi8yLCAyLzQgb3IgNC80IHRpbWUsIGFueSBkdXJhdGlvblxuICAgICAqIC0gNC1jaG9yZCBiZWFtcyBhcmUgb2sgZm9yIG90aGVyIHRpbWVzIGlmIHRoZSBkdXJhdGlvbiBpcyAxNnRoXG4gICAgICogLSAyLWNob3JkIGJlYW1zIGFyZSBvayBmb3IgYW55IGR1cmF0aW9uXG4gICAgICpcbiAgICAgKiBJZiBzdGFydFF1YXJ0ZXIgaXMgdHJ1ZSwgdGhlIGZpcnN0IG5vdGUgc2hvdWxkIHN0YXJ0IG9uIGEgcXVhcnRlciBub3RlXG4gICAgICogKG9ubHkgYXBwbGllcyB0byAyLWNob3JkIGJlYW1zKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIFxuICAgIGJvb2wgQ2FuQ3JlYXRlQmVhbShDaG9yZFN5bWJvbFtdIGNob3JkcywgVGltZVNpZ25hdHVyZSB0aW1lLCBib29sIHN0YXJ0UXVhcnRlcikge1xuICAgICAgICBpbnQgbnVtQ2hvcmRzID0gY2hvcmRzLkxlbmd0aDtcbiAgICAgICAgU3RlbSBmaXJzdFN0ZW0gPSBjaG9yZHNbMF0uU3RlbTtcbiAgICAgICAgU3RlbSBsYXN0U3RlbSA9IGNob3Jkc1tjaG9yZHMuTGVuZ3RoLTFdLlN0ZW07XG4gICAgICAgIGlmIChmaXJzdFN0ZW0gPT0gbnVsbCB8fCBsYXN0U3RlbSA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaW50IG1lYXN1cmUgPSBjaG9yZHNbMF0uU3RhcnRUaW1lIC8gdGltZS5NZWFzdXJlO1xuICAgICAgICBOb3RlRHVyYXRpb24gZHVyID0gZmlyc3RTdGVtLkR1cmF0aW9uO1xuICAgICAgICBOb3RlRHVyYXRpb24gZHVyMiA9IGxhc3RTdGVtLkR1cmF0aW9uO1xuXG4gICAgICAgIGJvb2wgZG90dGVkOF90b18xNiA9IGZhbHNlO1xuICAgICAgICBpZiAoY2hvcmRzLkxlbmd0aCA9PSAyICYmIGR1ciA9PSBOb3RlRHVyYXRpb24uRG90dGVkRWlnaHRoICYmXG4gICAgICAgICAgICBkdXIyID09IE5vdGVEdXJhdGlvbi5TaXh0ZWVudGgpIHtcbiAgICAgICAgICAgIGRvdHRlZDhfdG9fMTYgPSB0cnVlO1xuICAgICAgICB9IFxuXG4gICAgICAgIGlmIChkdXIgPT0gTm90ZUR1cmF0aW9uLldob2xlIHx8IGR1ciA9PSBOb3RlRHVyYXRpb24uSGFsZiB8fFxuICAgICAgICAgICAgZHVyID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRIYWxmIHx8IGR1ciA9PSBOb3RlRHVyYXRpb24uUXVhcnRlciB8fFxuICAgICAgICAgICAgZHVyID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRRdWFydGVyIHx8XG4gICAgICAgICAgICAoZHVyID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRFaWdodGggJiYgIWRvdHRlZDhfdG9fMTYpKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChudW1DaG9yZHMgPT0gNikge1xuICAgICAgICAgICAgaWYgKGR1ciAhPSBOb3RlRHVyYXRpb24uRWlnaHRoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYm9vbCBjb3JyZWN0VGltZSA9IFxuICAgICAgICAgICAgICAgKCh0aW1lLk51bWVyYXRvciA9PSAzICYmIHRpbWUuRGVub21pbmF0b3IgPT0gNCkgfHxcbiAgICAgICAgICAgICAgICAodGltZS5OdW1lcmF0b3IgPT0gNiAmJiB0aW1lLkRlbm9taW5hdG9yID09IDgpIHx8XG4gICAgICAgICAgICAgICAgKHRpbWUuTnVtZXJhdG9yID09IDYgJiYgdGltZS5EZW5vbWluYXRvciA9PSA0KSApO1xuXG4gICAgICAgICAgICBpZiAoIWNvcnJlY3RUaW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGltZS5OdW1lcmF0b3IgPT0gNiAmJiB0aW1lLkRlbm9taW5hdG9yID09IDQpIHtcbiAgICAgICAgICAgICAgICAvKiBmaXJzdCBjaG9yZCBtdXN0IHN0YXJ0IGF0IDFzdCBvciA0dGggcXVhcnRlciBub3RlICovXG4gICAgICAgICAgICAgICAgaW50IGJlYXQgPSB0aW1lLlF1YXJ0ZXIgKiAzO1xuICAgICAgICAgICAgICAgIGlmICgoY2hvcmRzWzBdLlN0YXJ0VGltZSAlIGJlYXQpID4gdGltZS5RdWFydGVyLzYpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobnVtQ2hvcmRzID09IDQpIHtcbiAgICAgICAgICAgIGlmICh0aW1lLk51bWVyYXRvciA9PSAzICYmIHRpbWUuRGVub21pbmF0b3IgPT0gOCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJvb2wgY29ycmVjdFRpbWUgPSBcbiAgICAgICAgICAgICAgKHRpbWUuTnVtZXJhdG9yID09IDIgfHwgdGltZS5OdW1lcmF0b3IgPT0gNCB8fCB0aW1lLk51bWVyYXRvciA9PSA4KTtcbiAgICAgICAgICAgIGlmICghY29ycmVjdFRpbWUgJiYgZHVyICE9IE5vdGVEdXJhdGlvbi5TaXh0ZWVudGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIGNob3JkIG11c3Qgc3RhcnQgb24gcXVhcnRlciBub3RlICovXG4gICAgICAgICAgICBpbnQgYmVhdCA9IHRpbWUuUXVhcnRlcjtcbiAgICAgICAgICAgIGlmIChkdXIgPT0gTm90ZUR1cmF0aW9uLkVpZ2h0aCkge1xuICAgICAgICAgICAgICAgIC8qIDh0aCBub3RlIGNob3JkIG11c3Qgc3RhcnQgb24gMXN0IG9yIDNyZCBxdWFydGVyIG5vdGUgKi9cbiAgICAgICAgICAgICAgICBiZWF0ID0gdGltZS5RdWFydGVyICogMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGR1ciA9PSBOb3RlRHVyYXRpb24uVGhpcnR5U2Vjb25kKSB7XG4gICAgICAgICAgICAgICAgLyogMzJuZCBub3RlIG11c3Qgc3RhcnQgb24gYW4gOHRoIGJlYXQgKi9cbiAgICAgICAgICAgICAgICBiZWF0ID0gdGltZS5RdWFydGVyIC8gMjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKChjaG9yZHNbMF0uU3RhcnRUaW1lICUgYmVhdCkgPiB0aW1lLlF1YXJ0ZXIvNikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChudW1DaG9yZHMgPT0gMykge1xuICAgICAgICAgICAgYm9vbCB2YWxpZCA9IChkdXIgPT0gTm90ZUR1cmF0aW9uLlRyaXBsZXQpIHx8IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAoZHVyID09IE5vdGVEdXJhdGlvbi5FaWdodGggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWUuTnVtZXJhdG9yID09IDEyICYmIHRpbWUuRGVub21pbmF0b3IgPT0gOCk7XG4gICAgICAgICAgICBpZiAoIXZhbGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBjaG9yZCBtdXN0IHN0YXJ0IG9uIHF1YXJ0ZXIgbm90ZSAqL1xuICAgICAgICAgICAgaW50IGJlYXQgPSB0aW1lLlF1YXJ0ZXI7XG4gICAgICAgICAgICBpZiAodGltZS5OdW1lcmF0b3IgPT0gMTIgJiYgdGltZS5EZW5vbWluYXRvciA9PSA4KSB7XG4gICAgICAgICAgICAgICAgLyogSW4gMTIvOCB0aW1lLCBjaG9yZCBtdXN0IHN0YXJ0IG9uIDMqOHRoIGJlYXQgKi9cbiAgICAgICAgICAgICAgICBiZWF0ID0gdGltZS5RdWFydGVyLzIgKiAzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKChjaG9yZHNbMF0uU3RhcnRUaW1lICUgYmVhdCkgPiB0aW1lLlF1YXJ0ZXIvNikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKG51bUNob3JkcyA9PSAyKSB7XG4gICAgICAgICAgICBpZiAoc3RhcnRRdWFydGVyKSB7XG4gICAgICAgICAgICAgICAgaW50IGJlYXQgPSB0aW1lLlF1YXJ0ZXI7XG4gICAgICAgICAgICAgICAgaWYgKChjaG9yZHNbMF0uU3RhcnRUaW1lICUgYmVhdCkgPiB0aW1lLlF1YXJ0ZXIvNikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yZWFjaCAoQ2hvcmRTeW1ib2wgY2hvcmQgaW4gY2hvcmRzKSB7XG4gICAgICAgICAgICBpZiAoKGNob3JkLlN0YXJ0VGltZSAvIHRpbWUuTWVhc3VyZSkgIT0gbWVhc3VyZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAoY2hvcmQuU3RlbSA9PSBudWxsKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmIChjaG9yZC5TdGVtLkR1cmF0aW9uICE9IGR1ciAmJiAhZG90dGVkOF90b18xNilcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAoY2hvcmQuU3RlbS5pc0JlYW0pXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogQ2hlY2sgdGhhdCBhbGwgc3RlbXMgY2FuIHBvaW50IGluIHNhbWUgZGlyZWN0aW9uICovXG4gICAgICAgIGJvb2wgaGFzVHdvU3RlbXMgPSBmYWxzZTtcbiAgICAgICAgaW50IGRpcmVjdGlvbiA9IFN0ZW0uVXA7IFxuICAgICAgICBmb3JlYWNoIChDaG9yZFN5bWJvbCBjaG9yZCBpbiBjaG9yZHMpIHtcbiAgICAgICAgICAgIGlmIChjaG9yZC5IYXNUd29TdGVtcykge1xuICAgICAgICAgICAgICAgIGlmIChoYXNUd29TdGVtcyAmJiBjaG9yZC5TdGVtLkRpcmVjdGlvbiAhPSBkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBoYXNUd29TdGVtcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gY2hvcmQuU3RlbS5EaXJlY3Rpb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiBHZXQgdGhlIGZpbmFsIHN0ZW0gZGlyZWN0aW9uICovXG4gICAgICAgIGlmICghaGFzVHdvU3RlbXMpIHtcbiAgICAgICAgICAgIFdoaXRlTm90ZSBub3RlMTtcbiAgICAgICAgICAgIFdoaXRlTm90ZSBub3RlMjtcbiAgICAgICAgICAgIG5vdGUxID0gKGZpcnN0U3RlbS5EaXJlY3Rpb24gPT0gU3RlbS5VcCA/IGZpcnN0U3RlbS5Ub3AgOiBmaXJzdFN0ZW0uQm90dG9tKTtcbiAgICAgICAgICAgIG5vdGUyID0gKGxhc3RTdGVtLkRpcmVjdGlvbiA9PSBTdGVtLlVwID8gbGFzdFN0ZW0uVG9wIDogbGFzdFN0ZW0uQm90dG9tKTtcbiAgICAgICAgICAgIGRpcmVjdGlvbiA9IFN0ZW1EaXJlY3Rpb24obm90ZTEsIG5vdGUyLCBjaG9yZHNbMF0uQ2xlZik7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBJZiB0aGUgbm90ZXMgYXJlIHRvbyBmYXIgYXBhcnQsIGRvbid0IHVzZSBhIGJlYW0gKi9cbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PSBTdGVtLlVwKSB7XG4gICAgICAgICAgICBpZiAoTWF0aC5BYnMoZmlyc3RTdGVtLlRvcC5EaXN0KGxhc3RTdGVtLlRvcCkpID49IDExKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKE1hdGguQWJzKGZpcnN0U3RlbS5Cb3R0b20uRGlzdChsYXN0U3RlbS5Cb3R0b20pKSA+PSAxMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cblxuICAgIC8qKiBDb25uZWN0IHRoZSBjaG9yZHMgdXNpbmcgYSBob3Jpem9udGFsIGJlYW0uIFxuICAgICAqXG4gICAgICogc3BhY2luZyBpcyB0aGUgaG9yaXpvbnRhbCBkaXN0YW5jZSAoaW4gcGl4ZWxzKSBiZXR3ZWVuIHRoZSByaWdodCBzaWRlIFxuICAgICAqIG9mIHRoZSBmaXJzdCBjaG9yZCwgYW5kIHRoZSByaWdodCBzaWRlIG9mIHRoZSBsYXN0IGNob3JkLlxuICAgICAqXG4gICAgICogVG8gbWFrZSB0aGUgYmVhbTpcbiAgICAgKiAtIENoYW5nZSB0aGUgc3RlbSBkaXJlY3Rpb25zIGZvciBlYWNoIGNob3JkLCBzbyB0aGV5IG1hdGNoLlxuICAgICAqIC0gSW4gdGhlIGZpcnN0IGNob3JkLCBwYXNzIHRoZSBzdGVtIGxvY2F0aW9uIG9mIHRoZSBsYXN0IGNob3JkLCBhbmRcbiAgICAgKiAgIHRoZSBob3Jpem9udGFsIHNwYWNpbmcgdG8gdGhhdCBsYXN0IHN0ZW0uXG4gICAgICogLSBNYXJrIGFsbCBjaG9yZHMgKGV4Y2VwdCB0aGUgZmlyc3QpIGFzIFwicmVjZWl2ZXJcIiBwYWlycywgc28gdGhhdCBcbiAgICAgKiAgIHRoZXkgZG9uJ3QgZHJhdyBhIGN1cnZ5IHN0ZW0uXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBcbiAgICB2b2lkIENyZWF0ZUJlYW0oQ2hvcmRTeW1ib2xbXSBjaG9yZHMsIGludCBzcGFjaW5nKSB7XG4gICAgICAgIFN0ZW0gZmlyc3RTdGVtID0gY2hvcmRzWzBdLlN0ZW07XG4gICAgICAgIFN0ZW0gbGFzdFN0ZW0gPSBjaG9yZHNbY2hvcmRzLkxlbmd0aC0xXS5TdGVtO1xuXG4gICAgICAgIC8qIENhbGN1bGF0ZSB0aGUgbmV3IHN0ZW0gZGlyZWN0aW9uICovXG4gICAgICAgIGludCBuZXdkaXJlY3Rpb24gPSAtMTtcbiAgICAgICAgZm9yZWFjaCAoQ2hvcmRTeW1ib2wgY2hvcmQgaW4gY2hvcmRzKSB7XG4gICAgICAgICAgICBpZiAoY2hvcmQuSGFzVHdvU3RlbXMpIHtcbiAgICAgICAgICAgICAgICBuZXdkaXJlY3Rpb24gPSBjaG9yZC5TdGVtLkRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZXdkaXJlY3Rpb24gPT0gLTEpIHtcbiAgICAgICAgICAgIFdoaXRlTm90ZSBub3RlMTtcbiAgICAgICAgICAgIFdoaXRlTm90ZSBub3RlMjtcbiAgICAgICAgICAgIG5vdGUxID0gKGZpcnN0U3RlbS5EaXJlY3Rpb24gPT0gU3RlbS5VcCA/IGZpcnN0U3RlbS5Ub3AgOiBmaXJzdFN0ZW0uQm90dG9tKTtcbiAgICAgICAgICAgIG5vdGUyID0gKGxhc3RTdGVtLkRpcmVjdGlvbiA9PSBTdGVtLlVwID8gbGFzdFN0ZW0uVG9wIDogbGFzdFN0ZW0uQm90dG9tKTtcbiAgICAgICAgICAgIG5ld2RpcmVjdGlvbiA9IFN0ZW1EaXJlY3Rpb24obm90ZTEsIG5vdGUyLCBjaG9yZHNbMF0uQ2xlZik7XG4gICAgICAgIH1cbiAgICAgICAgZm9yZWFjaCAoQ2hvcmRTeW1ib2wgY2hvcmQgaW4gY2hvcmRzKSB7XG4gICAgICAgICAgICBjaG9yZC5TdGVtLkRpcmVjdGlvbiA9IG5ld2RpcmVjdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaG9yZHMuTGVuZ3RoID09IDIpIHtcbiAgICAgICAgICAgIEJyaW5nU3RlbXNDbG9zZXIoY2hvcmRzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIExpbmVVcFN0ZW1FbmRzKGNob3Jkcyk7XG4gICAgICAgIH1cblxuICAgICAgICBmaXJzdFN0ZW0uU2V0UGFpcihsYXN0U3RlbSwgc3BhY2luZyk7XG4gICAgICAgIGZvciAoaW50IGkgPSAxOyBpIDwgY2hvcmRzLkxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjaG9yZHNbaV0uU3RlbS5SZWNlaXZlciA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogV2UncmUgY29ubmVjdGluZyB0aGUgc3RlbXMgb2YgdHdvIGNob3JkcyB1c2luZyBhIGhvcml6b250YWwgYmVhbS5cbiAgICAgKiAgQWRqdXN0IHRoZSB2ZXJ0aWNhbCBlbmRwb2ludCBvZiB0aGUgc3RlbXMsIHNvIHRoYXQgdGhleSdyZSBjbG9zZXJcbiAgICAgKiAgdG9nZXRoZXIuICBGb3IgYSBkb3R0ZWQgOHRoIHRvIDE2dGggYmVhbSwgaW5jcmVhc2UgdGhlIHN0ZW0gb2YgdGhlXG4gICAgICogIGRvdHRlZCBlaWdodGgsIHNvIHRoYXQgaXQncyBhcyBsb25nIGFzIGEgMTZ0aCBzdGVtLlxuICAgICAqL1xuICAgIHN0YXRpYyB2b2lkXG4gICAgQnJpbmdTdGVtc0Nsb3NlcihDaG9yZFN5bWJvbFtdIGNob3Jkcykge1xuICAgICAgICBTdGVtIGZpcnN0U3RlbSA9IGNob3Jkc1swXS5TdGVtO1xuICAgICAgICBTdGVtIGxhc3RTdGVtID0gY2hvcmRzWzFdLlN0ZW07XG5cbiAgICAgICAgLyogSWYgd2UncmUgY29ubmVjdGluZyBhIGRvdHRlZCA4dGggdG8gYSAxNnRoLCBpbmNyZWFzZVxuICAgICAgICAgKiB0aGUgc3RlbSBlbmQgb2YgdGhlIGRvdHRlZCBlaWdodGguXG4gICAgICAgICAqL1xuICAgICAgICBpZiAoZmlyc3RTdGVtLkR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRFaWdodGggJiZcbiAgICAgICAgICAgIGxhc3RTdGVtLkR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5TaXh0ZWVudGgpIHtcbiAgICAgICAgICAgIGlmIChmaXJzdFN0ZW0uRGlyZWN0aW9uID09IFN0ZW0uVXApIHtcbiAgICAgICAgICAgICAgICBmaXJzdFN0ZW0uRW5kID0gZmlyc3RTdGVtLkVuZC5BZGQoMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmaXJzdFN0ZW0uRW5kID0gZmlyc3RTdGVtLkVuZC5BZGQoLTIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyogQnJpbmcgdGhlIHN0ZW0gZW5kcyBjbG9zZXIgdG9nZXRoZXIgKi9cbiAgICAgICAgaW50IGRpc3RhbmNlID0gTWF0aC5BYnMoZmlyc3RTdGVtLkVuZC5EaXN0KGxhc3RTdGVtLkVuZCkpO1xuICAgICAgICBpZiAoZmlyc3RTdGVtLkRpcmVjdGlvbiA9PSBTdGVtLlVwKSB7XG4gICAgICAgICAgICBpZiAoV2hpdGVOb3RlLk1heChmaXJzdFN0ZW0uRW5kLCBsYXN0U3RlbS5FbmQpID09IGZpcnN0U3RlbS5FbmQpXG4gICAgICAgICAgICAgICAgbGFzdFN0ZW0uRW5kID0gbGFzdFN0ZW0uRW5kLkFkZChkaXN0YW5jZS8yKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBmaXJzdFN0ZW0uRW5kID0gZmlyc3RTdGVtLkVuZC5BZGQoZGlzdGFuY2UvMik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoV2hpdGVOb3RlLk1pbihmaXJzdFN0ZW0uRW5kLCBsYXN0U3RlbS5FbmQpID09IGZpcnN0U3RlbS5FbmQpXG4gICAgICAgICAgICAgICAgbGFzdFN0ZW0uRW5kID0gbGFzdFN0ZW0uRW5kLkFkZCgtZGlzdGFuY2UvMik7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZmlyc3RTdGVtLkVuZCA9IGZpcnN0U3RlbS5FbmQuQWRkKC1kaXN0YW5jZS8yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBXZSdyZSBjb25uZWN0aW5nIHRoZSBzdGVtcyBvZiB0aHJlZSBvciBtb3JlIGNob3JkcyB1c2luZyBhIGhvcml6b250YWwgYmVhbS5cbiAgICAgKiAgQWRqdXN0IHRoZSB2ZXJ0aWNhbCBlbmRwb2ludCBvZiB0aGUgc3RlbXMsIHNvIHRoYXQgdGhlIG1pZGRsZSBjaG9yZCBzdGVtc1xuICAgICAqICBhcmUgdmVydGljYWxseSBpbiBiZXR3ZWVuIHRoZSBmaXJzdCBhbmQgbGFzdCBzdGVtLlxuICAgICAqL1xuICAgIHN0YXRpYyB2b2lkXG4gICAgTGluZVVwU3RlbUVuZHMoQ2hvcmRTeW1ib2xbXSBjaG9yZHMpIHtcbiAgICAgICAgU3RlbSBmaXJzdFN0ZW0gPSBjaG9yZHNbMF0uU3RlbTtcbiAgICAgICAgU3RlbSBsYXN0U3RlbSA9IGNob3Jkc1tjaG9yZHMuTGVuZ3RoLTFdLlN0ZW07XG4gICAgICAgIFN0ZW0gbWlkZGxlU3RlbSA9IGNob3Jkc1sxXS5TdGVtO1xuXG4gICAgICAgIGlmIChmaXJzdFN0ZW0uRGlyZWN0aW9uID09IFN0ZW0uVXApIHtcbiAgICAgICAgICAgIC8qIEZpbmQgdGhlIGhpZ2hlc3Qgc3RlbS4gVGhlIGJlYW0gd2lsbCBlaXRoZXI6XG4gICAgICAgICAgICAgKiAtIFNsYW50IGRvd253YXJkcyAoZmlyc3Qgc3RlbSBpcyBoaWdoZXN0KVxuICAgICAgICAgICAgICogLSBTbGFudCB1cHdhcmRzIChsYXN0IHN0ZW0gaXMgaGlnaGVzdClcbiAgICAgICAgICAgICAqIC0gQmUgc3RyYWlnaHQgKG1pZGRsZSBzdGVtIGlzIGhpZ2hlc3QpXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFdoaXRlTm90ZSB0b3AgPSBmaXJzdFN0ZW0uRW5kO1xuICAgICAgICAgICAgZm9yZWFjaCAoQ2hvcmRTeW1ib2wgY2hvcmQgaW4gY2hvcmRzKSB7XG4gICAgICAgICAgICAgICAgdG9wID0gV2hpdGVOb3RlLk1heCh0b3AsIGNob3JkLlN0ZW0uRW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0b3AgPT0gZmlyc3RTdGVtLkVuZCAmJiB0b3AuRGlzdChsYXN0U3RlbS5FbmQpID49IDIpIHtcbiAgICAgICAgICAgICAgICBmaXJzdFN0ZW0uRW5kID0gdG9wO1xuICAgICAgICAgICAgICAgIG1pZGRsZVN0ZW0uRW5kID0gdG9wLkFkZCgtMSk7XG4gICAgICAgICAgICAgICAgbGFzdFN0ZW0uRW5kID0gdG9wLkFkZCgtMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0b3AgPT0gbGFzdFN0ZW0uRW5kICYmIHRvcC5EaXN0KGZpcnN0U3RlbS5FbmQpID49IDIpIHtcbiAgICAgICAgICAgICAgICBmaXJzdFN0ZW0uRW5kID0gdG9wLkFkZCgtMik7XG4gICAgICAgICAgICAgICAgbWlkZGxlU3RlbS5FbmQgPSB0b3AuQWRkKC0xKTtcbiAgICAgICAgICAgICAgICBsYXN0U3RlbS5FbmQgPSB0b3A7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmaXJzdFN0ZW0uRW5kID0gdG9wO1xuICAgICAgICAgICAgICAgIG1pZGRsZVN0ZW0uRW5kID0gdG9wO1xuICAgICAgICAgICAgICAgIGxhc3RTdGVtLkVuZCA9IHRvcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8qIEZpbmQgdGhlIGJvdHRvbW1vc3Qgc3RlbS4gVGhlIGJlYW0gd2lsbCBlaXRoZXI6XG4gICAgICAgICAgICAgKiAtIFNsYW50IHVwd2FyZHMgKGZpcnN0IHN0ZW0gaXMgbG93ZXN0KVxuICAgICAgICAgICAgICogLSBTbGFudCBkb3dud2FyZHMgKGxhc3Qgc3RlbSBpcyBsb3dlc3QpXG4gICAgICAgICAgICAgKiAtIEJlIHN0cmFpZ2h0IChtaWRkbGUgc3RlbSBpcyBoaWdoZXN0KVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBXaGl0ZU5vdGUgYm90dG9tID0gZmlyc3RTdGVtLkVuZDtcbiAgICAgICAgICAgIGZvcmVhY2ggKENob3JkU3ltYm9sIGNob3JkIGluIGNob3Jkcykge1xuICAgICAgICAgICAgICAgIGJvdHRvbSA9IFdoaXRlTm90ZS5NaW4oYm90dG9tLCBjaG9yZC5TdGVtLkVuZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChib3R0b20gPT0gZmlyc3RTdGVtLkVuZCAmJiBsYXN0U3RlbS5FbmQuRGlzdChib3R0b20pID49IDIpIHtcbiAgICAgICAgICAgICAgICBtaWRkbGVTdGVtLkVuZCA9IGJvdHRvbS5BZGQoMSk7XG4gICAgICAgICAgICAgICAgbGFzdFN0ZW0uRW5kID0gYm90dG9tLkFkZCgyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGJvdHRvbSA9PSBsYXN0U3RlbS5FbmQgJiYgZmlyc3RTdGVtLkVuZC5EaXN0KGJvdHRvbSkgPj0gMikge1xuICAgICAgICAgICAgICAgIG1pZGRsZVN0ZW0uRW5kID0gYm90dG9tLkFkZCgxKTtcbiAgICAgICAgICAgICAgICBmaXJzdFN0ZW0uRW5kID0gYm90dG9tLkFkZCgyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZpcnN0U3RlbS5FbmQgPSBib3R0b207XG4gICAgICAgICAgICAgICAgbWlkZGxlU3RlbS5FbmQgPSBib3R0b207XG4gICAgICAgICAgICAgICAgbGFzdFN0ZW0uRW5kID0gYm90dG9tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyogQWxsIG1pZGRsZSBzdGVtcyBoYXZlIHRoZSBzYW1lIGVuZCAqL1xuICAgICAgICBmb3IgKGludCBpID0gMTsgaSA8IGNob3Jkcy5MZW5ndGgtMTsgaSsrKSB7XG4gICAgICAgICAgICBTdGVtIHN0ZW0gPSBjaG9yZHNbaV0uU3RlbTtcbiAgICAgICAgICAgIHN0ZW0uRW5kID0gbWlkZGxlU3RlbS5FbmQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgb3ZlcnJpZGUgc3RyaW5nIFRvU3RyaW5nKCkge1xuICAgICAgICBzdHJpbmcgcmVzdWx0ID0gc3RyaW5nLkZvcm1hdChcIkNob3JkU3ltYm9sIGNsZWY9ezB9IHN0YXJ0PXsxfSBlbmQ9ezJ9IHdpZHRoPXszfSBoYXN0d29zdGVtcz17NH0gXCIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVmLCBTdGFydFRpbWUsIEVuZFRpbWUsIFdpZHRoLCBoYXN0d29zdGVtcyk7XG4gICAgICAgIGZvcmVhY2ggKEFjY2lkU3ltYm9sIHN5bWJvbCBpbiBhY2NpZHN5bWJvbHMpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBzeW1ib2wuVG9TdHJpbmcoKSArIFwiIFwiO1xuICAgICAgICB9XG4gICAgICAgIGZvcmVhY2ggKE5vdGVEYXRhIG5vdGUgaW4gbm90ZWRhdGEpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBzdHJpbmcuRm9ybWF0KFwiTm90ZSB3aGl0ZW5vdGU9ezB9IGR1cmF0aW9uPXsxfSBsZWZ0c2lkZT17Mn0gXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RlLndoaXRlbm90ZSwgbm90ZS5kdXJhdGlvbiwgbm90ZS5sZWZ0c2lkZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0ZW0xICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBzdGVtMS5Ub1N0cmluZygpICsgXCIgXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0ZW0yICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBzdGVtMi5Ub1N0cmluZygpICsgXCIgXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDsgXG4gICAgfVxuXG59XG5cblxufVxuXG5cbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMSBNYWRoYXYgVmFpZHlhbmF0aGFuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cblxudXNpbmcgU3lzdGVtO1xudXNpbmcgU3lzdGVtLklPO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG51c2luZyBTeXN0ZW0uVGV4dDtcblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljIHtcblxuLyoqIFRoZSBwb3NzaWJsZSBjbGVmcywgVHJlYmxlIG9yIEJhc3MgKi9cbnB1YmxpYyBlbnVtIENsZWYgeyBUcmVibGUsIEJhc3MgfTtcblxuLyoqIEBjbGFzcyBDbGVmU3ltYm9sIFxuICogQSBDbGVmU3ltYm9sIHJlcHJlc2VudHMgZWl0aGVyIGEgVHJlYmxlIG9yIEJhc3MgQ2xlZiBpbWFnZS5cbiAqIFRoZSBjbGVmIGNhbiBiZSBlaXRoZXIgbm9ybWFsIG9yIHNtYWxsIHNpemUuICBOb3JtYWwgc2l6ZSBpc1xuICogdXNlZCBhdCB0aGUgYmVnaW5uaW5nIG9mIGEgbmV3IHN0YWZmLCBvbiB0aGUgbGVmdCBzaWRlLiAgVGhlXG4gKiBzbWFsbCBzeW1ib2xzIGFyZSB1c2VkIHRvIHNob3cgY2xlZiBjaGFuZ2VzIHdpdGhpbiBhIHN0YWZmLlxuICovXG5cbnB1YmxpYyBjbGFzcyBDbGVmU3ltYm9sIDogTXVzaWNTeW1ib2wge1xuICAgIHByaXZhdGUgc3RhdGljIEltYWdlIHRyZWJsZTsgIC8qKiBUaGUgdHJlYmxlIGNsZWYgaW1hZ2UgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBJbWFnZSBiYXNzOyAgICAvKiogVGhlIGJhc3MgY2xlZiBpbWFnZSAqL1xuXG4gICAgcHJpdmF0ZSBpbnQgc3RhcnR0aW1lOyAgICAgICAgLyoqIFN0YXJ0IHRpbWUgb2YgdGhlIHN5bWJvbCAqL1xuICAgIHByaXZhdGUgYm9vbCBzbWFsbHNpemU7ICAgICAgIC8qKiBUcnVlIGlmIHRoaXMgaXMgYSBzbWFsbCBjbGVmLCBmYWxzZSBvdGhlcndpc2UgKi9cbiAgICBwcml2YXRlIENsZWYgY2xlZjsgICAgICAgICAgICAvKiogVGhlIGNsZWYsIFRyZWJsZSBvciBCYXNzICovXG4gICAgcHJpdmF0ZSBpbnQgd2lkdGg7XG5cbiAgICAvKiogQ3JlYXRlIGEgbmV3IENsZWZTeW1ib2wsIHdpdGggdGhlIGdpdmVuIGNsZWYsIHN0YXJ0dGltZSwgYW5kIHNpemUgKi9cbiAgICBwdWJsaWMgQ2xlZlN5bWJvbChDbGVmIGNsZWYsIGludCBzdGFydHRpbWUsIGJvb2wgc21hbGwpIHtcbiAgICAgICAgdGhpcy5jbGVmID0gY2xlZjtcbiAgICAgICAgdGhpcy5zdGFydHRpbWUgPSBzdGFydHRpbWU7XG4gICAgICAgIHNtYWxsc2l6ZSA9IHNtYWxsO1xuICAgICAgICBMb2FkSW1hZ2VzKCk7XG4gICAgICAgIHdpZHRoID0gTWluV2lkdGg7XG4gICAgfVxuXG4gICAgLyoqIExvYWQgdGhlIFRyZWJsZS9CYXNzIGNsZWYgaW1hZ2VzIGludG8gbWVtb3J5LiAqL1xuICAgIHByaXZhdGUgc3RhdGljIHZvaWQgTG9hZEltYWdlcygpIHtcbiAgICAgICAgaWYgKHRyZWJsZSA9PSBudWxsKVxuICAgICAgICAgICAgdHJlYmxlID0gbmV3IEJpdG1hcCh0eXBlb2YoQ2xlZlN5bWJvbCksIFwiUmVzb3VyY2VzLkltYWdlcy50cmVibGUucG5nXCIpO1xuXG4gICAgICAgIGlmIChiYXNzID09IG51bGwpXG4gICAgICAgICAgICBiYXNzID0gbmV3IEJpdG1hcCh0eXBlb2YoQ2xlZlN5bWJvbCksIFwiUmVzb3VyY2VzLkltYWdlcy5iYXNzLnBuZ1wiKTtcblxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIHRpbWUgKGluIHB1bHNlcykgdGhpcyBzeW1ib2wgb2NjdXJzIGF0LlxuICAgICAqIFRoaXMgaXMgdXNlZCB0byBkZXRlcm1pbmUgdGhlIG1lYXN1cmUgdGhpcyBzeW1ib2wgYmVsb25ncyB0by5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IFN0YXJ0VGltZSB7IFxuICAgICAgICBnZXQgeyByZXR1cm4gc3RhcnR0aW1lOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbWluaW11bSB3aWR0aCAoaW4gcGl4ZWxzKSBuZWVkZWQgdG8gZHJhdyB0aGlzIHN5bWJvbCAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgTWluV2lkdGgge1xuICAgICAgICBnZXQgeyBcbiAgICAgICAgICAgIGlmIChzbWFsbHNpemUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFNoZWV0TXVzaWMuTm90ZVdpZHRoICogMjtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gU2hlZXRNdXNpYy5Ob3RlV2lkdGggKiAzO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIEdldC9TZXQgdGhlIHdpZHRoIChpbiBwaXhlbHMpIG9mIHRoaXMgc3ltYm9sLiBUaGUgd2lkdGggaXMgc2V0XG4gICAgICogaW4gU2hlZXRNdXNpYy5BbGlnblN5bWJvbHMoKSB0byB2ZXJ0aWNhbGx5IGFsaWduIHN5bWJvbHMuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBXaWR0aCB7XG4gICAgICAgZ2V0IHsgcmV0dXJuIHdpZHRoOyB9XG4gICAgICAgc2V0IHsgd2lkdGggPSB2YWx1ZTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBwaXhlbHMgdGhpcyBzeW1ib2wgZXh0ZW5kcyBhYm92ZSB0aGUgc3RhZmYuIFVzZWRcbiAgICAgKiAgdG8gZGV0ZXJtaW5lIHRoZSBtaW5pbXVtIGhlaWdodCBuZWVkZWQgZm9yIHRoZSBzdGFmZiAoU3RhZmYuRmluZEJvdW5kcykuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBBYm92ZVN0YWZmIHsgXG4gICAgICAgIGdldCB7IFxuICAgICAgICAgICAgaWYgKGNsZWYgPT0gQ2xlZi5UcmVibGUgJiYgIXNtYWxsc2l6ZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0ICogMjtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBwaXhlbHMgdGhpcyBzeW1ib2wgZXh0ZW5kcyBiZWxvdyB0aGUgc3RhZmYuIFVzZWRcbiAgICAgKiAgdG8gZGV0ZXJtaW5lIHRoZSBtaW5pbXVtIGhlaWdodCBuZWVkZWQgZm9yIHRoZSBzdGFmZiAoU3RhZmYuRmluZEJvdW5kcykuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBCZWxvd1N0YWZmIHtcbiAgICAgICAgZ2V0IHtcbiAgICAgICAgICAgIGlmIChjbGVmID09IENsZWYuVHJlYmxlICYmICFzbWFsbHNpemUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFNoZWV0TXVzaWMuTm90ZUhlaWdodCAqIDI7XG4gICAgICAgICAgICBlbHNlIGlmIChjbGVmID09IENsZWYuVHJlYmxlICYmIHNtYWxsc2l6ZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIERyYXcgdGhlIHN5bWJvbC5cbiAgICAgKiBAcGFyYW0geXRvcCBUaGUgeWxvY2F0aW9uIChpbiBwaXhlbHMpIHdoZXJlIHRoZSB0b3Agb2YgdGhlIHN0YWZmIHN0YXJ0cy5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgXG4gICAgdm9pZCBEcmF3KEdyYXBoaWNzIGcsIFBlbiBwZW4sIGludCB5dG9wKSB7XG4gICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKFdpZHRoIC0gTWluV2lkdGgsIDApO1xuICAgICAgICBpbnQgeSA9IHl0b3A7XG4gICAgICAgIEltYWdlIGltYWdlO1xuICAgICAgICBpbnQgaGVpZ2h0O1xuXG4gICAgICAgIC8qIEdldCB0aGUgaW1hZ2UsIGhlaWdodCwgYW5kIHRvcCB5IHBpeGVsLCBkZXBlbmRpbmcgb24gdGhlIGNsZWZcbiAgICAgICAgICogYW5kIHRoZSBpbWFnZSBzaXplLlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKGNsZWYgPT0gQ2xlZi5UcmVibGUpIHtcbiAgICAgICAgICAgIGltYWdlID0gdHJlYmxlO1xuICAgICAgICAgICAgaWYgKHNtYWxsc2l6ZSkge1xuICAgICAgICAgICAgICAgIGhlaWdodCA9IFNoZWV0TXVzaWMuU3RhZmZIZWlnaHQgKyBTaGVldE11c2ljLlN0YWZmSGVpZ2h0LzQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhlaWdodCA9IDMgKiBTaGVldE11c2ljLlN0YWZmSGVpZ2h0LzIgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQvMjtcbiAgICAgICAgICAgICAgICB5ID0geXRvcCAtIFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGltYWdlID0gYmFzcztcbiAgICAgICAgICAgIGlmIChzbWFsbHNpemUpIHtcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSBTaGVldE11c2ljLlN0YWZmSGVpZ2h0IC0gMypTaGVldE11c2ljLk5vdGVIZWlnaHQvMjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gU2hlZXRNdXNpYy5TdGFmZkhlaWdodCAtIFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qIFNjYWxlIHRoZSBpbWFnZSB3aWR0aCB0byBtYXRjaCB0aGUgaGVpZ2h0ICovXG4gICAgICAgIGludCBpbWd3aWR0aCA9IGltYWdlLldpZHRoICogaGVpZ2h0IC8gaW1hZ2UuSGVpZ2h0O1xuICAgICAgICBnLkRyYXdJbWFnZShpbWFnZSwgMCwgeSwgaW1nd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC0oV2lkdGggLSBNaW5XaWR0aCksIDApO1xuICAgIH1cblxuICAgIHB1YmxpYyBvdmVycmlkZSBzdHJpbmcgVG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcuRm9ybWF0KFwiQ2xlZlN5bWJvbCBjbGVmPXswfSBzbWFsbD17MX0gd2lkdGg9ezJ9XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWYsIHNtYWxsc2l6ZSwgd2lkdGgpO1xuICAgIH1cbn1cblxuXG59XG5cbiIsInVzaW5nIFN5c3RlbTtcclxudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XHJcbnVzaW5nIFN5c3RlbS5UZXh0O1xyXG5cclxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljXHJcbntcclxuICAgIHB1YmxpYyBjbGFzcyBGaWxlU3RyZWFtOlN0cmVhbVxyXG4gICAge1xyXG4gICAgICAgIHB1YmxpYyBGaWxlU3RyZWFtKHN0cmluZyBmaWxlbmFtZSwgRmlsZU1vZGUgbW9kZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiIsIi8qXHJcbiAqIENvcHlyaWdodCAoYykgMjAwOS0yMDEyIE1hZGhhdiBWYWlkeWFuYXRoYW5cclxuICpcclxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cclxuICpcclxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcbiAqL1xyXG5cclxudXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uSU87XHJcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xyXG51c2luZyBTeXN0ZW0uVGV4dDtcclxuXHJcbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyB7XHJcblxyXG5cclxuLyoqIEBjbGFzcyBQaWFub1xyXG4gKlxyXG4gKiBUaGUgUGlhbm8gQ29udHJvbCBpcyB0aGUgcGFuZWwgYXQgdGhlIHRvcCB0aGF0IGRpc3BsYXlzIHRoZVxyXG4gKiBwaWFubywgYW5kIGhpZ2hsaWdodHMgdGhlIHBpYW5vIG5vdGVzIGR1cmluZyBwbGF5YmFjay5cclxuICogVGhlIG1haW4gbWV0aG9kcyBhcmU6XHJcbiAqXHJcbiAqIFNldE1pZGlGaWxlKCkgLSBTZXQgdGhlIE1pZGkgZmlsZSB0byB1c2UgZm9yIHNoYWRpbmcuICBUaGUgTWlkaSBmaWxlXHJcbiAqICAgICAgICAgICAgICAgICBpcyBuZWVkZWQgdG8gZGV0ZXJtaW5lIHdoaWNoIG5vdGVzIHRvIHNoYWRlLlxyXG4gKlxyXG4gKiBTaGFkZU5vdGVzKCkgLSBTaGFkZSBub3RlcyBvbiB0aGUgcGlhbm8gdGhhdCBvY2N1ciBhdCBhIGdpdmVuIHB1bHNlIHRpbWUuXHJcbiAqXHJcbiAqL1xyXG5wdWJsaWMgY2xhc3MgUGlhbm8gOiBDb250cm9sIHtcclxuICAgIHB1YmxpYyBjb25zdCBpbnQgS2V5c1Blck9jdGF2ZSA9IDc7XHJcbiAgICBwdWJsaWMgY29uc3QgaW50IE1heE9jdGF2ZSA9IDc7XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgaW50IFdoaXRlS2V5V2lkdGg7ICAvKiogV2lkdGggb2YgYSBzaW5nbGUgd2hpdGUga2V5ICovXHJcbiAgICBwcml2YXRlIHN0YXRpYyBpbnQgV2hpdGVLZXlIZWlnaHQ7IC8qKiBIZWlnaHQgb2YgYSBzaW5nbGUgd2hpdGUga2V5ICovXHJcbiAgICBwcml2YXRlIHN0YXRpYyBpbnQgQmxhY2tLZXlXaWR0aDsgIC8qKiBXaWR0aCBvZiBhIHNpbmdsZSBibGFjayBrZXkgKi9cclxuICAgIHByaXZhdGUgc3RhdGljIGludCBCbGFja0tleUhlaWdodDsgLyoqIEhlaWdodCBvZiBhIHNpbmdsZSBibGFjayBrZXkgKi9cclxuICAgIHByaXZhdGUgc3RhdGljIGludCBtYXJnaW47ICAgICAgICAgLyoqIFRoZSB0b3AvbGVmdCBtYXJnaW4gdG8gdGhlIHBpYW5vICovXHJcbiAgICBwcml2YXRlIHN0YXRpYyBpbnQgQmxhY2tCb3JkZXI7ICAgIC8qKiBUaGUgd2lkdGggb2YgdGhlIGJsYWNrIGJvcmRlciBhcm91bmQgdGhlIGtleXMgKi9cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBpbnRbXSBibGFja0tleU9mZnNldHM7ICAgLyoqIFRoZSB4IHBpeGxlcyBvZiB0aGUgYmxhY2sga2V5cyAqL1xyXG5cclxuICAgIC8qIFRoZSBncmF5MVBlbnMgZm9yIGRyYXdpbmcgYmxhY2svZ3JheSBsaW5lcyAqL1xyXG4gICAgcHJpdmF0ZSBQZW4gZ3JheTFQZW4sIGdyYXkyUGVuLCBncmF5M1BlbjtcclxuXHJcbiAgICAvKiBUaGUgYnJ1c2hlcyBmb3IgZmlsbGluZyB0aGUga2V5cyAqL1xyXG4gICAgcHJpdmF0ZSBCcnVzaCBncmF5MUJydXNoLCBncmF5MkJydXNoLCBzaGFkZUJydXNoLCBzaGFkZTJCcnVzaDtcclxuXHJcbiAgICBwcml2YXRlIGJvb2wgdXNlVHdvQ29sb3JzOyAgICAgICAgICAgICAgLyoqIElmIHRydWUsIHVzZSB0d28gY29sb3JzIGZvciBoaWdobGlnaHRpbmcgKi9cclxuICAgIHByaXZhdGUgTGlzdDxNaWRpTm90ZT4gbm90ZXM7ICAgICAgICAgICAvKiogVGhlIE1pZGkgbm90ZXMgZm9yIHNoYWRpbmcgKi9cclxuICAgIHByaXZhdGUgaW50IG1heFNoYWRlRHVyYXRpb247ICAgICAgICAgICAvKiogVGhlIG1heGltdW0gZHVyYXRpb24gd2UnbGwgc2hhZGUgYSBub3RlIGZvciAqL1xyXG4gICAgcHJpdmF0ZSBpbnQgc2hvd05vdGVMZXR0ZXJzOyAgICAgICAgICAgIC8qKiBEaXNwbGF5IHRoZSBsZXR0ZXIgZm9yIGVhY2ggcGlhbm8gbm90ZSAqL1xyXG4gICAgcHJpdmF0ZSBHcmFwaGljcyBncmFwaGljczsgICAgICAgICAgICAgIC8qKiBUaGUgZ3JhcGhpY3MgZm9yIHNoYWRpbmcgdGhlIG5vdGVzICovXHJcblxyXG4gICAgLyoqIENyZWF0ZSBhIG5ldyBQaWFuby4gKi9cclxuICAgIHB1YmxpYyBQaWFubygpIHtcclxuICAgICAgICBpbnQgc2NyZWVud2lkdGggPSAxMDI0OyAvL1N5c3RlbS5XaW5kb3dzLkZvcm1zLlNjcmVlbi5QcmltYXJ5U2NyZWVuLkJvdW5kcy5XaWR0aDtcclxuICAgICAgICBpZiAoc2NyZWVud2lkdGggPj0gMzIwMCkge1xyXG4gICAgICAgICAgICAvKiBMaW51eC9Nb25vIGlzIHJlcG9ydGluZyB3aWR0aCBvZiA0IHNjcmVlbnMgKi9cclxuICAgICAgICAgICAgc2NyZWVud2lkdGggPSBzY3JlZW53aWR0aCAvIDQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNjcmVlbndpZHRoID0gc2NyZWVud2lkdGggKiA5NS8xMDA7XHJcbiAgICAgICAgV2hpdGVLZXlXaWR0aCA9IChpbnQpKHNjcmVlbndpZHRoIC8gKDIuMCArIEtleXNQZXJPY3RhdmUgKiBNYXhPY3RhdmUpKTtcclxuICAgICAgICBpZiAoV2hpdGVLZXlXaWR0aCAlIDIgIT0gMCkge1xyXG4gICAgICAgICAgICBXaGl0ZUtleVdpZHRoLS07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1hcmdpbiA9IDA7XHJcbiAgICAgICAgQmxhY2tCb3JkZXIgPSBXaGl0ZUtleVdpZHRoLzI7XHJcbiAgICAgICAgV2hpdGVLZXlIZWlnaHQgPSBXaGl0ZUtleVdpZHRoICogNTtcclxuICAgICAgICBCbGFja0tleVdpZHRoID0gV2hpdGVLZXlXaWR0aCAvIDI7XHJcbiAgICAgICAgQmxhY2tLZXlIZWlnaHQgPSBXaGl0ZUtleUhlaWdodCAqIDUgLyA5OyBcclxuXHJcbiAgICAgICAgV2lkdGggPSBtYXJnaW4qMiArIEJsYWNrQm9yZGVyKjIgKyBXaGl0ZUtleVdpZHRoICogS2V5c1Blck9jdGF2ZSAqIE1heE9jdGF2ZTtcclxuICAgICAgICBIZWlnaHQgPSBtYXJnaW4qMiArIEJsYWNrQm9yZGVyKjMgKyBXaGl0ZUtleUhlaWdodDtcclxuICAgICAgICBpZiAoYmxhY2tLZXlPZmZzZXRzID09IG51bGwpIHtcclxuICAgICAgICAgICAgYmxhY2tLZXlPZmZzZXRzID0gbmV3IGludFtdIHsgXHJcbiAgICAgICAgICAgICAgICBXaGl0ZUtleVdpZHRoIC0gQmxhY2tLZXlXaWR0aC8yIC0gMSxcclxuICAgICAgICAgICAgICAgIFdoaXRlS2V5V2lkdGggKyBCbGFja0tleVdpZHRoLzIgLSAxLFxyXG4gICAgICAgICAgICAgICAgMipXaGl0ZUtleVdpZHRoIC0gQmxhY2tLZXlXaWR0aC8yLFxyXG4gICAgICAgICAgICAgICAgMipXaGl0ZUtleVdpZHRoICsgQmxhY2tLZXlXaWR0aC8yLFxyXG4gICAgICAgICAgICAgICAgNCpXaGl0ZUtleVdpZHRoIC0gQmxhY2tLZXlXaWR0aC8yIC0gMSxcclxuICAgICAgICAgICAgICAgIDQqV2hpdGVLZXlXaWR0aCArIEJsYWNrS2V5V2lkdGgvMiAtIDEsXHJcbiAgICAgICAgICAgICAgICA1KldoaXRlS2V5V2lkdGggLSBCbGFja0tleVdpZHRoLzIsXHJcbiAgICAgICAgICAgICAgICA1KldoaXRlS2V5V2lkdGggKyBCbGFja0tleVdpZHRoLzIsXHJcbiAgICAgICAgICAgICAgICA2KldoaXRlS2V5V2lkdGggLSBCbGFja0tleVdpZHRoLzIsXHJcbiAgICAgICAgICAgICAgICA2KldoaXRlS2V5V2lkdGggKyBCbGFja0tleVdpZHRoLzJcclxuICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBDb2xvciBncmF5MSA9IENvbG9yLkZyb21SZ2IoMTYsIDE2LCAxNik7XHJcbiAgICAgICAgQ29sb3IgZ3JheTIgPSBDb2xvci5Gcm9tUmdiKDkwLCA5MCwgOTApO1xyXG4gICAgICAgIENvbG9yIGdyYXkzID0gQ29sb3IuRnJvbVJnYigyMDAsIDIwMCwgMjAwKTtcclxuICAgICAgICBDb2xvciBzaGFkZTEgPSBDb2xvci5Gcm9tUmdiKDIxMCwgMjA1LCAyMjApO1xyXG4gICAgICAgIENvbG9yIHNoYWRlMiA9IENvbG9yLkZyb21SZ2IoMTUwLCAyMDAsIDIyMCk7XHJcblxyXG4gICAgICAgIGdyYXkxUGVuID0gbmV3IFBlbihncmF5MSwgMSk7XHJcbiAgICAgICAgZ3JheTJQZW4gPSBuZXcgUGVuKGdyYXkyLCAxKTtcclxuICAgICAgICBncmF5M1BlbiA9IG5ldyBQZW4oZ3JheTMsIDEpO1xyXG5cclxuICAgICAgICBncmF5MUJydXNoID0gbmV3IFNvbGlkQnJ1c2goZ3JheTEpO1xyXG4gICAgICAgIGdyYXkyQnJ1c2ggPSBuZXcgU29saWRCcnVzaChncmF5Mik7XHJcbiAgICAgICAgc2hhZGVCcnVzaCA9IG5ldyBTb2xpZEJydXNoKHNoYWRlMSk7XHJcbiAgICAgICAgc2hhZGUyQnJ1c2ggPSBuZXcgU29saWRCcnVzaChzaGFkZTIpO1xyXG4gICAgICAgIHNob3dOb3RlTGV0dGVycyA9IE1pZGlPcHRpb25zLk5vdGVOYW1lTm9uZTtcclxuICAgICAgICBCYWNrQ29sb3IgPSBDb2xvci5MaWdodEdyYXk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFNldCB0aGUgTWlkaUZpbGUgdG8gdXNlLlxyXG4gICAgICogIFNhdmUgdGhlIGxpc3Qgb2YgbWlkaSBub3Rlcy4gRWFjaCBtaWRpIG5vdGUgaW5jbHVkZXMgdGhlIG5vdGUgTnVtYmVyIFxyXG4gICAgICogIGFuZCBTdGFydFRpbWUgKGluIHB1bHNlcyksIHNvIHdlIGtub3cgd2hpY2ggbm90ZXMgdG8gc2hhZGUgZ2l2ZW4gdGhlXHJcbiAgICAgKiAgY3VycmVudCBwdWxzZSB0aW1lLlxyXG4gICAgICovIFxyXG4gICAgcHVibGljIHZvaWQgU2V0TWlkaUZpbGUoTWlkaUZpbGUgbWlkaWZpbGUsIE1pZGlPcHRpb25zIG9wdGlvbnMpIHtcclxuICAgICAgICBpZiAobWlkaWZpbGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBub3RlcyA9IG51bGw7XHJcbiAgICAgICAgICAgIHVzZVR3b0NvbG9ycyA9IGZhbHNlO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBMaXN0PE1pZGlUcmFjaz4gdHJhY2tzID0gbWlkaWZpbGUuQ2hhbmdlTWlkaU5vdGVzKG9wdGlvbnMpO1xyXG4gICAgICAgIE1pZGlUcmFjayB0cmFjayA9IE1pZGlGaWxlLkNvbWJpbmVUb1NpbmdsZVRyYWNrKHRyYWNrcyk7XHJcbiAgICAgICAgbm90ZXMgPSB0cmFjay5Ob3RlcztcclxuXHJcbiAgICAgICAgbWF4U2hhZGVEdXJhdGlvbiA9IG1pZGlmaWxlLlRpbWUuUXVhcnRlciAqIDI7XHJcblxyXG4gICAgICAgIC8qIFdlIHdhbnQgdG8ga25vdyB3aGljaCB0cmFjayB0aGUgbm90ZSBjYW1lIGZyb20uXHJcbiAgICAgICAgICogVXNlIHRoZSAnY2hhbm5lbCcgZmllbGQgdG8gc3RvcmUgdGhlIHRyYWNrLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZvciAoaW50IHRyYWNrbnVtID0gMDsgdHJhY2tudW0gPCB0cmFja3MuQ291bnQ7IHRyYWNrbnVtKyspIHtcclxuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaU5vdGUgbm90ZSBpbiB0cmFja3NbdHJhY2tudW1dLk5vdGVzKSB7XHJcbiAgICAgICAgICAgICAgICBub3RlLkNoYW5uZWwgPSB0cmFja251bTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyogV2hlbiB3ZSBoYXZlIGV4YWN0bHkgdHdvIHRyYWNrcywgd2UgYXNzdW1lIHRoaXMgaXMgYSBwaWFubyBzb25nLFxyXG4gICAgICAgICAqIGFuZCB3ZSB1c2UgZGlmZmVyZW50IGNvbG9ycyBmb3IgaGlnaGxpZ2h0aW5nIHRoZSBsZWZ0IGhhbmQgYW5kXHJcbiAgICAgICAgICogcmlnaHQgaGFuZCBub3Rlcy5cclxuICAgICAgICAgKi9cclxuICAgICAgICB1c2VUd29Db2xvcnMgPSBmYWxzZTtcclxuICAgICAgICBpZiAodHJhY2tzLkNvdW50ID09IDIpIHtcclxuICAgICAgICAgICAgdXNlVHdvQ29sb3JzID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNob3dOb3RlTGV0dGVycyA9IG9wdGlvbnMuc2hvd05vdGVMZXR0ZXJzO1xyXG4gICAgICAgIHRoaXMuSW52YWxpZGF0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBTZXQgdGhlIGNvbG9ycyB0byB1c2UgZm9yIHNoYWRpbmcgKi9cclxuICAgIHB1YmxpYyB2b2lkIFNldFNoYWRlQ29sb3JzKENvbG9yIGMxLCBDb2xvciBjMikge1xyXG4gICAgICAgIHNoYWRlQnJ1c2guRGlzcG9zZSgpO1xyXG4gICAgICAgIHNoYWRlMkJydXNoLkRpc3Bvc2UoKTtcclxuICAgICAgICBzaGFkZUJydXNoID0gbmV3IFNvbGlkQnJ1c2goYzEpO1xyXG4gICAgICAgIHNoYWRlMkJydXNoID0gbmV3IFNvbGlkQnJ1c2goYzIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBEcmF3IHRoZSBvdXRsaW5lIG9mIGEgMTItbm90ZSAoNyB3aGl0ZSBub3RlKSBwaWFubyBvY3RhdmUgKi9cclxuICAgIHByaXZhdGUgdm9pZCBEcmF3T2N0YXZlT3V0bGluZShHcmFwaGljcyBnKSB7XHJcbiAgICAgICAgaW50IHJpZ2h0ID0gV2hpdGVLZXlXaWR0aCAqIEtleXNQZXJPY3RhdmU7XHJcblxyXG4gICAgICAgIC8vIERyYXcgdGhlIGJvdW5kaW5nIHJlY3RhbmdsZSwgZnJvbSBDIHRvIEJcclxuICAgICAgICBnLkRyYXdMaW5lKGdyYXkxUGVuLCAwLCAwLCAwLCBXaGl0ZUtleUhlaWdodCk7XHJcbiAgICAgICAgZy5EcmF3TGluZShncmF5MVBlbiwgcmlnaHQsIDAsIHJpZ2h0LCBXaGl0ZUtleUhlaWdodCk7XHJcbiAgICAgICAgLy8gZy5EcmF3TGluZShncmF5MVBlbiwgMCwgMCwgcmlnaHQsIDApO1xyXG4gICAgICAgIGcuRHJhd0xpbmUoZ3JheTFQZW4sIDAsIFdoaXRlS2V5SGVpZ2h0LCByaWdodCwgV2hpdGVLZXlIZWlnaHQpO1xyXG4gICAgICAgIGcuRHJhd0xpbmUoZ3JheTNQZW4sIHJpZ2h0LTEsIDAsIHJpZ2h0LTEsIFdoaXRlS2V5SGVpZ2h0KTtcclxuICAgICAgICBnLkRyYXdMaW5lKGdyYXkzUGVuLCAxLCAwLCAxLCBXaGl0ZUtleUhlaWdodCk7XHJcblxyXG4gICAgICAgIC8vIERyYXcgdGhlIGxpbmUgYmV0d2VlbiBFIGFuZCBGXHJcbiAgICAgICAgZy5EcmF3TGluZShncmF5MVBlbiwgMypXaGl0ZUtleVdpZHRoLCAwLCAzKldoaXRlS2V5V2lkdGgsIFdoaXRlS2V5SGVpZ2h0KTtcclxuICAgICAgICBnLkRyYXdMaW5lKGdyYXkzUGVuLCAzKldoaXRlS2V5V2lkdGggLSAxLCAwLCAzKldoaXRlS2V5V2lkdGggLSAxLCBXaGl0ZUtleUhlaWdodCk7XHJcbiAgICAgICAgZy5EcmF3TGluZShncmF5M1BlbiwgMypXaGl0ZUtleVdpZHRoICsgMSwgMCwgMypXaGl0ZUtleVdpZHRoICsgMSwgV2hpdGVLZXlIZWlnaHQpO1xyXG5cclxuICAgICAgICAvLyBEcmF3IHRoZSBzaWRlcy9ib3R0b20gb2YgdGhlIGJsYWNrIGtleXNcclxuICAgICAgICBmb3IgKGludCBpID0wOyBpIDwgMTA7IGkgKz0gMikge1xyXG4gICAgICAgICAgICBpbnQgeDEgPSBibGFja0tleU9mZnNldHNbaV07XHJcbiAgICAgICAgICAgIGludCB4MiA9IGJsYWNrS2V5T2Zmc2V0c1tpKzFdO1xyXG5cclxuICAgICAgICAgICAgZy5EcmF3TGluZShncmF5MVBlbiwgeDEsIDAsIHgxLCBCbGFja0tleUhlaWdodCk7IFxyXG4gICAgICAgICAgICBnLkRyYXdMaW5lKGdyYXkxUGVuLCB4MiwgMCwgeDIsIEJsYWNrS2V5SGVpZ2h0KTsgXHJcbiAgICAgICAgICAgIGcuRHJhd0xpbmUoZ3JheTFQZW4sIHgxLCBCbGFja0tleUhlaWdodCwgeDIsIEJsYWNrS2V5SGVpZ2h0KTtcclxuICAgICAgICAgICAgZy5EcmF3TGluZShncmF5MlBlbiwgeDEtMSwgMCwgeDEtMSwgQmxhY2tLZXlIZWlnaHQrMSk7IFxyXG4gICAgICAgICAgICBnLkRyYXdMaW5lKGdyYXkyUGVuLCB4MisxLCAwLCB4MisxLCBCbGFja0tleUhlaWdodCsxKTsgXHJcbiAgICAgICAgICAgIGcuRHJhd0xpbmUoZ3JheTJQZW4sIHgxLTEsIEJsYWNrS2V5SGVpZ2h0KzEsIHgyKzEsIEJsYWNrS2V5SGVpZ2h0KzEpO1xyXG4gICAgICAgICAgICBnLkRyYXdMaW5lKGdyYXkzUGVuLCB4MS0yLCAwLCB4MS0yLCBCbGFja0tleUhlaWdodCsyKTsgXHJcbiAgICAgICAgICAgIGcuRHJhd0xpbmUoZ3JheTNQZW4sIHgyKzIsIDAsIHgyKzIsIEJsYWNrS2V5SGVpZ2h0KzIpOyBcclxuICAgICAgICAgICAgZy5EcmF3TGluZShncmF5M1BlbiwgeDEtMiwgQmxhY2tLZXlIZWlnaHQrMiwgeDIrMiwgQmxhY2tLZXlIZWlnaHQrMik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEcmF3IHRoZSBib3R0b20taGFsZiBvZiB0aGUgd2hpdGUga2V5c1xyXG4gICAgICAgIGZvciAoaW50IGkgPSAxOyBpIDwgS2V5c1Blck9jdGF2ZTsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChpID09IDMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlOyAgLy8gd2UgZHJhdyB0aGUgbGluZSBiZXR3ZWVuIEUgYW5kIEYgYWJvdmVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBnLkRyYXdMaW5lKGdyYXkxUGVuLCBpKldoaXRlS2V5V2lkdGgsIEJsYWNrS2V5SGVpZ2h0LCBpKldoaXRlS2V5V2lkdGgsIFdoaXRlS2V5SGVpZ2h0KTtcclxuICAgICAgICAgICAgUGVuIHBlbjEgPSBncmF5MlBlbjtcclxuICAgICAgICAgICAgUGVuIHBlbjIgPSBncmF5M1BlbjtcclxuICAgICAgICAgICAgZy5EcmF3TGluZShwZW4xLCBpKldoaXRlS2V5V2lkdGggLSAxLCBCbGFja0tleUhlaWdodCsxLCBpKldoaXRlS2V5V2lkdGggLSAxLCBXaGl0ZUtleUhlaWdodCk7XHJcbiAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuMiwgaSpXaGl0ZUtleVdpZHRoICsgMSwgQmxhY2tLZXlIZWlnaHQrMSwgaSpXaGl0ZUtleVdpZHRoICsgMSwgV2hpdGVLZXlIZWlnaHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgLyoqIERyYXcgYW4gb3V0bGluZSBvZiB0aGUgcGlhbm8gZm9yIDcgb2N0YXZlcyAqL1xyXG4gICAgcHJpdmF0ZSB2b2lkIERyYXdPdXRsaW5lKEdyYXBoaWNzIGcpIHtcclxuICAgICAgICBmb3IgKGludCBvY3RhdmUgPSAwOyBvY3RhdmUgPCBNYXhPY3RhdmU7IG9jdGF2ZSsrKSB7XHJcbiAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKG9jdGF2ZSAqIFdoaXRlS2V5V2lkdGggKiBLZXlzUGVyT2N0YXZlLCAwKTtcclxuICAgICAgICAgICAgRHJhd09jdGF2ZU91dGxpbmUoZyk7XHJcbiAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC0ob2N0YXZlICogV2hpdGVLZXlXaWR0aCAqIEtleXNQZXJPY3RhdmUpLCAwKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiBcclxuICAgIC8qIERyYXcgdGhlIEJsYWNrIGtleXMgKi9cclxuICAgIHByaXZhdGUgdm9pZCBEcmF3QmxhY2tLZXlzKEdyYXBoaWNzIGcpIHtcclxuICAgICAgICBmb3IgKGludCBvY3RhdmUgPSAwOyBvY3RhdmUgPCBNYXhPY3RhdmU7IG9jdGF2ZSsrKSB7XHJcbiAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKG9jdGF2ZSAqIFdoaXRlS2V5V2lkdGggKiBLZXlzUGVyT2N0YXZlLCAwKTtcclxuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCAxMDsgaSArPSAyKSB7XHJcbiAgICAgICAgICAgICAgICBpbnQgeDEgPSBibGFja0tleU9mZnNldHNbaV07XHJcbiAgICAgICAgICAgICAgICBpbnQgeDIgPSBibGFja0tleU9mZnNldHNbaSsxXTtcclxuICAgICAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShncmF5MUJydXNoLCB4MSwgMCwgQmxhY2tLZXlXaWR0aCwgQmxhY2tLZXlIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGdyYXkyQnJ1c2gsIHgxKzEsIEJsYWNrS2V5SGVpZ2h0IC0gQmxhY2tLZXlIZWlnaHQvOCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQmxhY2tLZXlXaWR0aC0yLCBCbGFja0tleUhlaWdodC84KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgtKG9jdGF2ZSAqIFdoaXRlS2V5V2lkdGggKiBLZXlzUGVyT2N0YXZlKSwgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qIERyYXcgdGhlIGJsYWNrIGJvcmRlciBhcmVhIHN1cnJvdW5kaW5nIHRoZSBwaWFubyBrZXlzLlxyXG4gICAgICogQWxzbywgZHJhdyBncmF5IG91dGxpbmVzIGF0IHRoZSBib3R0b20gb2YgdGhlIHdoaXRlIGtleXMuXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgdm9pZCBEcmF3QmxhY2tCb3JkZXIoR3JhcGhpY3MgZykge1xyXG4gICAgICAgIGludCBQaWFub1dpZHRoID0gV2hpdGVLZXlXaWR0aCAqIEtleXNQZXJPY3RhdmUgKiBNYXhPY3RhdmU7XHJcbiAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGdyYXkxQnJ1c2gsIG1hcmdpbiwgbWFyZ2luLCBQaWFub1dpZHRoICsgQmxhY2tCb3JkZXIqMiwgQmxhY2tCb3JkZXItMik7XHJcbiAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGdyYXkxQnJ1c2gsIG1hcmdpbiwgbWFyZ2luLCBCbGFja0JvcmRlciwgV2hpdGVLZXlIZWlnaHQgKyBCbGFja0JvcmRlciAqIDMpO1xyXG4gICAgICAgIGcuRmlsbFJlY3RhbmdsZShncmF5MUJydXNoLCBtYXJnaW4sIG1hcmdpbiArIEJsYWNrQm9yZGVyICsgV2hpdGVLZXlIZWlnaHQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCbGFja0JvcmRlcioyICsgUGlhbm9XaWR0aCwgQmxhY2tCb3JkZXIqMik7XHJcbiAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGdyYXkxQnJ1c2gsIG1hcmdpbiArIEJsYWNrQm9yZGVyICsgUGlhbm9XaWR0aCwgbWFyZ2luLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQmxhY2tCb3JkZXIsIFdoaXRlS2V5SGVpZ2h0ICsgQmxhY2tCb3JkZXIqMyk7XHJcblxyXG4gICAgICAgIGcuRHJhd0xpbmUoZ3JheTJQZW4sIG1hcmdpbiArIEJsYWNrQm9yZGVyLCBtYXJnaW4gKyBCbGFja0JvcmRlciAtMSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luICsgQmxhY2tCb3JkZXIgKyBQaWFub1dpZHRoLCBtYXJnaW4gKyBCbGFja0JvcmRlciAtMSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0obWFyZ2luICsgQmxhY2tCb3JkZXIsIG1hcmdpbiArIEJsYWNrQm9yZGVyKTsgXHJcblxyXG4gICAgICAgIC8vIERyYXcgdGhlIGdyYXkgYm90dG9tcyBvZiB0aGUgd2hpdGUga2V5cyAgXHJcbiAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCBLZXlzUGVyT2N0YXZlICogTWF4T2N0YXZlOyBpKyspIHtcclxuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGdyYXkyQnJ1c2gsIGkqV2hpdGVLZXlXaWR0aCsxLCBXaGl0ZUtleUhlaWdodCsyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFdoaXRlS2V5V2lkdGgtMiwgQmxhY2tCb3JkZXIvMik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC0obWFyZ2luICsgQmxhY2tCb3JkZXIpLCAtKG1hcmdpbiArIEJsYWNrQm9yZGVyKSk7IFxyXG4gICAgfVxyXG5cclxuICAgIC8qKiBEcmF3IHRoZSBub3RlIGxldHRlcnMgdW5kZXJuZWF0aCBlYWNoIHdoaXRlIG5vdGUgKi9cclxuICAgIHByaXZhdGUgdm9pZCBEcmF3Tm90ZUxldHRlcnMoR3JhcGhpY3MgZykge1xyXG4gICAgICAgIHN0cmluZ1tdIGxldHRlcnMgPSB7IFwiQ1wiLCBcIkRcIiwgXCJFXCIsIFwiRlwiLCBcIkdcIiwgXCJBXCIsIFwiQlwiIH07XHJcbiAgICAgICAgc3RyaW5nW10gbnVtYmVycyA9IHsgXCIxXCIsIFwiM1wiLCBcIjVcIiwgXCI2XCIsIFwiOFwiLCBcIjEwXCIsIFwiMTJcIiB9O1xyXG4gICAgICAgIHN0cmluZ1tdIG5hbWVzO1xyXG4gICAgICAgIGlmIChzaG93Tm90ZUxldHRlcnMgPT0gTWlkaU9wdGlvbnMuTm90ZU5hbWVMZXR0ZXIpIHtcclxuICAgICAgICAgICAgbmFtZXMgPSBsZXR0ZXJzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChzaG93Tm90ZUxldHRlcnMgPT0gTWlkaU9wdGlvbnMuTm90ZU5hbWVGaXhlZE51bWJlcikge1xyXG4gICAgICAgICAgICBuYW1lcyA9IG51bWJlcnM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKG1hcmdpbiArIEJsYWNrQm9yZGVyLCBtYXJnaW4gKyBCbGFja0JvcmRlcik7IFxyXG4gICAgICAgIGZvciAoaW50IG9jdGF2ZSA9IDA7IG9jdGF2ZSA8IE1heE9jdGF2ZTsgb2N0YXZlKyspIHtcclxuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCBLZXlzUGVyT2N0YXZlOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGcuRHJhd1N0cmluZyhuYW1lc1tpXSwgU2hlZXRNdXNpYy5MZXR0ZXJGb250LCBCcnVzaGVzLldoaXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIChvY3RhdmUqS2V5c1Blck9jdGF2ZSArIGkpICogV2hpdGVLZXlXaWR0aCArIFdoaXRlS2V5V2lkdGgvMyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBXaGl0ZUtleUhlaWdodCArIEJsYWNrQm9yZGVyICogMy80KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgtKG1hcmdpbiArIEJsYWNrQm9yZGVyKSwgLShtYXJnaW4gKyBCbGFja0JvcmRlcikpOyBcclxuICAgIH1cclxuXHJcbiAgICAvKiogRHJhdyB0aGUgUGlhbm8uICovXHJcbiAgICBwcm90ZWN0ZWQgLypvdmVycmlkZSovIHZvaWQgT25QYWludChQYWludEV2ZW50QXJncyBlKSB7XHJcbiAgICAgICAgR3JhcGhpY3MgZyA9IGUuR3JhcGhpY3MoKTtcclxuICAgICAgICBnLlNtb290aGluZ01vZGUgPSBTbW9vdGhpbmdNb2RlLk5vbmU7XHJcbiAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0obWFyZ2luICsgQmxhY2tCb3JkZXIsIG1hcmdpbiArIEJsYWNrQm9yZGVyKTsgXHJcbiAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKEJydXNoZXMuV2hpdGUsIDAsIDAsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBXaGl0ZUtleVdpZHRoICogS2V5c1Blck9jdGF2ZSAqIE1heE9jdGF2ZSwgV2hpdGVLZXlIZWlnaHQpO1xyXG4gICAgICAgIERyYXdCbGFja0tleXMoZyk7XHJcbiAgICAgICAgRHJhd091dGxpbmUoZyk7XHJcbiAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oLShtYXJnaW4gKyBCbGFja0JvcmRlciksIC0obWFyZ2luICsgQmxhY2tCb3JkZXIpKTtcclxuICAgICAgICBEcmF3QmxhY2tCb3JkZXIoZyk7XHJcbiAgICAgICAgaWYgKHNob3dOb3RlTGV0dGVycyAhPSBNaWRpT3B0aW9ucy5Ob3RlTmFtZU5vbmUpIHtcclxuICAgICAgICAgICAgRHJhd05vdGVMZXR0ZXJzKGcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBnLlNtb290aGluZ01vZGUgPSBTbW9vdGhpbmdNb2RlLkFudGlBbGlhcztcclxuICAgIH1cclxuXHJcbiAgICAvKiBTaGFkZSB0aGUgZ2l2ZW4gbm90ZSB3aXRoIHRoZSBnaXZlbiBicnVzaC5cclxuICAgICAqIFdlIG9ubHkgZHJhdyBub3RlcyBmcm9tIG5vdGVudW1iZXIgMjQgdG8gOTYuXHJcbiAgICAgKiAoTWlkZGxlLUMgaXMgNjApLlxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHZvaWQgU2hhZGVPbmVOb3RlKEdyYXBoaWNzIGcsIGludCBub3RlbnVtYmVyLCBCcnVzaCBicnVzaCkge1xyXG4gICAgICAgIGludCBvY3RhdmUgPSBub3RlbnVtYmVyIC8gMTI7XHJcbiAgICAgICAgaW50IG5vdGVzY2FsZSA9IG5vdGVudW1iZXIgJSAxMjtcclxuXHJcbiAgICAgICAgb2N0YXZlIC09IDI7XHJcbiAgICAgICAgaWYgKG9jdGF2ZSA8IDAgfHwgb2N0YXZlID49IE1heE9jdGF2ZSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybShvY3RhdmUgKiBXaGl0ZUtleVdpZHRoICogS2V5c1Blck9jdGF2ZSwgMCk7XHJcbiAgICAgICAgaW50IHgxLCB4MiwgeDM7XHJcblxyXG4gICAgICAgIGludCBib3R0b21IYWxmSGVpZ2h0ID0gV2hpdGVLZXlIZWlnaHQgLSAoQmxhY2tLZXlIZWlnaHQrMyk7XHJcblxyXG4gICAgICAgIC8qIG5vdGVzY2FsZSBnb2VzIGZyb20gMCB0byAxMSwgZnJvbSBDIHRvIEIuICovXHJcbiAgICAgICAgc3dpdGNoIChub3Rlc2NhbGUpIHtcclxuICAgICAgICBjYXNlIDA6IC8qIEMgKi9cclxuICAgICAgICAgICAgeDEgPSAyO1xyXG4gICAgICAgICAgICB4MiA9IGJsYWNrS2V5T2Zmc2V0c1swXSAtIDI7XHJcbiAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShicnVzaCwgeDEsIDAsIHgyIC0geDEsIEJsYWNrS2V5SGVpZ2h0KzMpO1xyXG4gICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoYnJ1c2gsIHgxLCBCbGFja0tleUhlaWdodCszLCBXaGl0ZUtleVdpZHRoLTMsIGJvdHRvbUhhbGZIZWlnaHQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDE6IC8qIEMjICovXHJcbiAgICAgICAgICAgIHgxID0gYmxhY2tLZXlPZmZzZXRzWzBdOyBcclxuICAgICAgICAgICAgeDIgPSBibGFja0tleU9mZnNldHNbMV07XHJcbiAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShicnVzaCwgeDEsIDAsIHgyIC0geDEsIEJsYWNrS2V5SGVpZ2h0KTtcclxuICAgICAgICAgICAgaWYgKGJydXNoID09IGdyYXkxQnJ1c2gpIHtcclxuICAgICAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShncmF5MkJydXNoLCB4MSsxLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCbGFja0tleUhlaWdodCAtIEJsYWNrS2V5SGVpZ2h0LzgsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJsYWNrS2V5V2lkdGgtMiwgQmxhY2tLZXlIZWlnaHQvOCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOiAvKiBEICovXHJcbiAgICAgICAgICAgIHgxID0gV2hpdGVLZXlXaWR0aCArIDI7XHJcbiAgICAgICAgICAgIHgyID0gYmxhY2tLZXlPZmZzZXRzWzFdICsgMztcclxuICAgICAgICAgICAgeDMgPSBibGFja0tleU9mZnNldHNbMl0gLSAyOyBcclxuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MiwgMCwgeDMgLSB4MiwgQmxhY2tLZXlIZWlnaHQrMyk7XHJcbiAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShicnVzaCwgeDEsIEJsYWNrS2V5SGVpZ2h0KzMsIFdoaXRlS2V5V2lkdGgtMywgYm90dG9tSGFsZkhlaWdodCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzogLyogRCMgKi9cclxuICAgICAgICAgICAgeDEgPSBibGFja0tleU9mZnNldHNbMl07IFxyXG4gICAgICAgICAgICB4MiA9IGJsYWNrS2V5T2Zmc2V0c1szXTtcclxuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MSwgMCwgQmxhY2tLZXlXaWR0aCwgQmxhY2tLZXlIZWlnaHQpO1xyXG4gICAgICAgICAgICBpZiAoYnJ1c2ggPT0gZ3JheTFCcnVzaCkge1xyXG4gICAgICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGdyYXkyQnJ1c2gsIHgxKzEsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJsYWNrS2V5SGVpZ2h0IC0gQmxhY2tLZXlIZWlnaHQvOCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQmxhY2tLZXlXaWR0aC0yLCBCbGFja0tleUhlaWdodC84KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDQ6IC8qIEUgKi9cclxuICAgICAgICAgICAgeDEgPSBXaGl0ZUtleVdpZHRoICogMiArIDI7XHJcbiAgICAgICAgICAgIHgyID0gYmxhY2tLZXlPZmZzZXRzWzNdICsgMzsgXHJcbiAgICAgICAgICAgIHgzID0gV2hpdGVLZXlXaWR0aCAqIDMgLSAxO1xyXG4gICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoYnJ1c2gsIHgyLCAwLCB4MyAtIHgyLCBCbGFja0tleUhlaWdodCszKTtcclxuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MSwgQmxhY2tLZXlIZWlnaHQrMywgV2hpdGVLZXlXaWR0aC0zLCBib3R0b21IYWxmSGVpZ2h0KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA1OiAvKiBGICovXHJcbiAgICAgICAgICAgIHgxID0gV2hpdGVLZXlXaWR0aCAqIDMgKyAyO1xyXG4gICAgICAgICAgICB4MiA9IGJsYWNrS2V5T2Zmc2V0c1s0XSAtIDI7IFxyXG4gICAgICAgICAgICB4MyA9IFdoaXRlS2V5V2lkdGggKiA0IC0gMjtcclxuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MSwgMCwgeDIgLSB4MSwgQmxhY2tLZXlIZWlnaHQrMyk7XHJcbiAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShicnVzaCwgeDEsIEJsYWNrS2V5SGVpZ2h0KzMsIFdoaXRlS2V5V2lkdGgtMywgYm90dG9tSGFsZkhlaWdodCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgNjogLyogRiMgKi9cclxuICAgICAgICAgICAgeDEgPSBibGFja0tleU9mZnNldHNbNF07IFxyXG4gICAgICAgICAgICB4MiA9IGJsYWNrS2V5T2Zmc2V0c1s1XTtcclxuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MSwgMCwgQmxhY2tLZXlXaWR0aCwgQmxhY2tLZXlIZWlnaHQpO1xyXG4gICAgICAgICAgICBpZiAoYnJ1c2ggPT0gZ3JheTFCcnVzaCkge1xyXG4gICAgICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGdyYXkyQnJ1c2gsIHgxKzEsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJsYWNrS2V5SGVpZ2h0IC0gQmxhY2tLZXlIZWlnaHQvOCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQmxhY2tLZXlXaWR0aC0yLCBCbGFja0tleUhlaWdodC84KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDc6IC8qIEcgKi9cclxuICAgICAgICAgICAgeDEgPSBXaGl0ZUtleVdpZHRoICogNCArIDI7XHJcbiAgICAgICAgICAgIHgyID0gYmxhY2tLZXlPZmZzZXRzWzVdICsgMzsgXHJcbiAgICAgICAgICAgIHgzID0gYmxhY2tLZXlPZmZzZXRzWzZdIC0gMjsgXHJcbiAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShicnVzaCwgeDIsIDAsIHgzIC0geDIsIEJsYWNrS2V5SGVpZ2h0KzMpO1xyXG4gICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoYnJ1c2gsIHgxLCBCbGFja0tleUhlaWdodCszLCBXaGl0ZUtleVdpZHRoLTMsIGJvdHRvbUhhbGZIZWlnaHQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDg6IC8qIEcjICovXHJcbiAgICAgICAgICAgIHgxID0gYmxhY2tLZXlPZmZzZXRzWzZdOyBcclxuICAgICAgICAgICAgeDIgPSBibGFja0tleU9mZnNldHNbN107XHJcbiAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShicnVzaCwgeDEsIDAsIEJsYWNrS2V5V2lkdGgsIEJsYWNrS2V5SGVpZ2h0KTtcclxuICAgICAgICAgICAgaWYgKGJydXNoID09IGdyYXkxQnJ1c2gpIHtcclxuICAgICAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShncmF5MkJydXNoLCB4MSsxLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCbGFja0tleUhlaWdodCAtIEJsYWNrS2V5SGVpZ2h0LzgsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJsYWNrS2V5V2lkdGgtMiwgQmxhY2tLZXlIZWlnaHQvOCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA5OiAvKiBBICovXHJcbiAgICAgICAgICAgIHgxID0gV2hpdGVLZXlXaWR0aCAqIDUgKyAyO1xyXG4gICAgICAgICAgICB4MiA9IGJsYWNrS2V5T2Zmc2V0c1s3XSArIDM7IFxyXG4gICAgICAgICAgICB4MyA9IGJsYWNrS2V5T2Zmc2V0c1s4XSAtIDI7IFxyXG4gICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoYnJ1c2gsIHgyLCAwLCB4MyAtIHgyLCBCbGFja0tleUhlaWdodCszKTtcclxuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MSwgQmxhY2tLZXlIZWlnaHQrMywgV2hpdGVLZXlXaWR0aC0zLCBib3R0b21IYWxmSGVpZ2h0KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAxMDogLyogQSMgKi9cclxuICAgICAgICAgICAgeDEgPSBibGFja0tleU9mZnNldHNbOF07IFxyXG4gICAgICAgICAgICB4MiA9IGJsYWNrS2V5T2Zmc2V0c1s5XTtcclxuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MSwgMCwgQmxhY2tLZXlXaWR0aCwgQmxhY2tLZXlIZWlnaHQpO1xyXG4gICAgICAgICAgICBpZiAoYnJ1c2ggPT0gZ3JheTFCcnVzaCkge1xyXG4gICAgICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGdyYXkyQnJ1c2gsIHgxKzEsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJsYWNrS2V5SGVpZ2h0IC0gQmxhY2tLZXlIZWlnaHQvOCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQmxhY2tLZXlXaWR0aC0yLCBCbGFja0tleUhlaWdodC84KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDExOiAvKiBCICovXHJcbiAgICAgICAgICAgIHgxID0gV2hpdGVLZXlXaWR0aCAqIDYgKyAyO1xyXG4gICAgICAgICAgICB4MiA9IGJsYWNrS2V5T2Zmc2V0c1s5XSArIDM7IFxyXG4gICAgICAgICAgICB4MyA9IFdoaXRlS2V5V2lkdGggKiBLZXlzUGVyT2N0YXZlIC0gMTtcclxuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MiwgMCwgeDMgLSB4MiwgQmxhY2tLZXlIZWlnaHQrMyk7XHJcbiAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShicnVzaCwgeDEsIEJsYWNrS2V5SGVpZ2h0KzMsIFdoaXRlS2V5V2lkdGgtMywgYm90dG9tSGFsZkhlaWdodCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgtKG9jdGF2ZSAqIFdoaXRlS2V5V2lkdGggKiBLZXlzUGVyT2N0YXZlKSwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIEZpbmQgdGhlIE1pZGlOb3RlIHdpdGggdGhlIHN0YXJ0VGltZSBjbG9zZXN0IHRvIHRoZSBnaXZlbiB0aW1lLlxyXG4gICAgICogIFJldHVybiB0aGUgaW5kZXggb2YgdGhlIG5vdGUuICBVc2UgYSBiaW5hcnkgc2VhcmNoIG1ldGhvZC5cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBpbnQgRmluZENsb3Nlc3RTdGFydFRpbWUoaW50IHB1bHNlVGltZSkge1xyXG4gICAgICAgIGludCBsZWZ0ID0gMDtcclxuICAgICAgICBpbnQgcmlnaHQgPSBub3Rlcy5Db3VudC0xO1xyXG5cclxuICAgICAgICB3aGlsZSAocmlnaHQgLSBsZWZ0ID4gMSkge1xyXG4gICAgICAgICAgICBpbnQgaSA9IChyaWdodCArIGxlZnQpLzI7XHJcbiAgICAgICAgICAgIGlmIChub3Rlc1tsZWZ0XS5TdGFydFRpbWUgPT0gcHVsc2VUaW1lKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKG5vdGVzW2ldLlN0YXJ0VGltZSA8PSBwdWxzZVRpbWUpXHJcbiAgICAgICAgICAgICAgICBsZWZ0ID0gaTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmlnaHQgPSBpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB3aGlsZSAobGVmdCA+PSAxICYmIChub3Rlc1tsZWZ0LTFdLlN0YXJ0VGltZSA9PSBub3Rlc1tsZWZ0XS5TdGFydFRpbWUpKSB7XHJcbiAgICAgICAgICAgIGxlZnQtLTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxlZnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFJldHVybiB0aGUgbmV4dCBTdGFydFRpbWUgdGhhdCBvY2N1cnMgYWZ0ZXIgdGhlIE1pZGlOb3RlXHJcbiAgICAgKiAgYXQgb2Zmc2V0IGksIHRoYXQgaXMgYWxzbyBpbiB0aGUgc2FtZSB0cmFjay9jaGFubmVsLlxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIGludCBOZXh0U3RhcnRUaW1lU2FtZVRyYWNrKGludCBpKSB7XHJcbiAgICAgICAgaW50IHN0YXJ0ID0gbm90ZXNbaV0uU3RhcnRUaW1lO1xyXG4gICAgICAgIGludCBlbmQgPSBub3Rlc1tpXS5FbmRUaW1lO1xyXG4gICAgICAgIGludCB0cmFjayA9IG5vdGVzW2ldLkNoYW5uZWw7XHJcblxyXG4gICAgICAgIHdoaWxlIChpIDwgbm90ZXMuQ291bnQpIHtcclxuICAgICAgICAgICAgaWYgKG5vdGVzW2ldLkNoYW5uZWwgIT0gdHJhY2spIHtcclxuICAgICAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChub3Rlc1tpXS5TdGFydFRpbWUgPiBzdGFydCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vdGVzW2ldLlN0YXJ0VGltZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbmQgPSBNYXRoLk1heChlbmQsIG5vdGVzW2ldLkVuZFRpbWUpO1xyXG4gICAgICAgICAgICBpKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBlbmQ7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKiBSZXR1cm4gdGhlIG5leHQgU3RhcnRUaW1lIHRoYXQgb2NjdXJzIGFmdGVyIHRoZSBNaWRpTm90ZVxyXG4gICAgICogIGF0IG9mZnNldCBpLiAgSWYgYWxsIHRoZSBzdWJzZXF1ZW50IG5vdGVzIGhhdmUgdGhlIHNhbWVcclxuICAgICAqICBTdGFydFRpbWUsIHRoZW4gcmV0dXJuIHRoZSBsYXJnZXN0IEVuZFRpbWUuXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgaW50IE5leHRTdGFydFRpbWUoaW50IGkpIHtcclxuICAgICAgICBpbnQgc3RhcnQgPSBub3Rlc1tpXS5TdGFydFRpbWU7XHJcbiAgICAgICAgaW50IGVuZCA9IG5vdGVzW2ldLkVuZFRpbWU7XHJcblxyXG4gICAgICAgIHdoaWxlIChpIDwgbm90ZXMuQ291bnQpIHtcclxuICAgICAgICAgICAgaWYgKG5vdGVzW2ldLlN0YXJ0VGltZSA+IHN0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbm90ZXNbaV0uU3RhcnRUaW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVuZCA9IE1hdGguTWF4KGVuZCwgbm90ZXNbaV0uRW5kVGltZSk7XHJcbiAgICAgICAgICAgIGkrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVuZDtcclxuICAgIH1cclxuXHJcbiAgICAvKiogRmluZCB0aGUgTWlkaSBub3RlcyB0aGF0IG9jY3VyIGluIHRoZSBjdXJyZW50IHRpbWUuXHJcbiAgICAgKiAgU2hhZGUgdGhvc2Ugbm90ZXMgb24gdGhlIHBpYW5vIGRpc3BsYXllZC5cclxuICAgICAqICBVbi1zaGFkZSB0aGUgdGhvc2Ugbm90ZXMgcGxheWVkIGluIHRoZSBwcmV2aW91cyB0aW1lLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgdm9pZCBTaGFkZU5vdGVzKGludCBjdXJyZW50UHVsc2VUaW1lLCBpbnQgcHJldlB1bHNlVGltZSkge1xyXG4gICAgICAgIGlmIChub3RlcyA9PSBudWxsIHx8IG5vdGVzLkNvdW50ID09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZ3JhcGhpY3MgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBncmFwaGljcyA9IENyZWF0ZUdyYXBoaWNzKFwic2hhZGVOb3Rlc19waWFub1wiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZ3JhcGhpY3MuU21vb3RoaW5nTW9kZSA9IFNtb290aGluZ01vZGUuTm9uZTtcclxuICAgICAgICBncmFwaGljcy5UcmFuc2xhdGVUcmFuc2Zvcm0obWFyZ2luICsgQmxhY2tCb3JkZXIsIG1hcmdpbiArIEJsYWNrQm9yZGVyKTtcclxuXHJcbiAgICAgICAgLyogTG9vcCB0aHJvdWdoIHRoZSBNaWRpIG5vdGVzLlxyXG4gICAgICAgICAqIFVuc2hhZGUgbm90ZXMgd2hlcmUgU3RhcnRUaW1lIDw9IHByZXZQdWxzZVRpbWUgPCBuZXh0IFN0YXJ0VGltZVxyXG4gICAgICAgICAqIFNoYWRlIG5vdGVzIHdoZXJlIFN0YXJ0VGltZSA8PSBjdXJyZW50UHVsc2VUaW1lIDwgbmV4dCBTdGFydFRpbWVcclxuICAgICAgICAgKi9cclxuICAgICAgICBpbnQgbGFzdFNoYWRlZEluZGV4ID0gRmluZENsb3Nlc3RTdGFydFRpbWUocHJldlB1bHNlVGltZSAtIG1heFNoYWRlRHVyYXRpb24gKiAyKTtcclxuICAgICAgICBmb3IgKGludCBpID0gbGFzdFNoYWRlZEluZGV4OyBpIDwgbm90ZXMuQ291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICBpbnQgc3RhcnQgPSBub3Rlc1tpXS5TdGFydFRpbWU7XHJcbiAgICAgICAgICAgIGludCBlbmQgPSBub3Rlc1tpXS5FbmRUaW1lO1xyXG4gICAgICAgICAgICBpbnQgbm90ZW51bWJlciA9IG5vdGVzW2ldLk51bWJlcjtcclxuICAgICAgICAgICAgaW50IG5leHRTdGFydCA9IE5leHRTdGFydFRpbWUoaSk7XHJcbiAgICAgICAgICAgIGludCBuZXh0U3RhcnRUcmFjayA9IE5leHRTdGFydFRpbWVTYW1lVHJhY2soaSk7XHJcbiAgICAgICAgICAgIGVuZCA9IE1hdGguTWF4KGVuZCwgbmV4dFN0YXJ0VHJhY2spO1xyXG4gICAgICAgICAgICBlbmQgPSBNYXRoLk1pbihlbmQsIHN0YXJ0ICsgbWF4U2hhZGVEdXJhdGlvbi0xKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvKiBJZiB3ZSd2ZSBwYXN0IHRoZSBwcmV2aW91cyBhbmQgY3VycmVudCB0aW1lcywgd2UncmUgZG9uZS4gKi9cclxuICAgICAgICAgICAgaWYgKChzdGFydCA+IHByZXZQdWxzZVRpbWUpICYmIChzdGFydCA+IGN1cnJlbnRQdWxzZVRpbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLyogSWYgc2hhZGVkIG5vdGVzIGFyZSB0aGUgc2FtZSwgd2UncmUgZG9uZSAqL1xyXG4gICAgICAgICAgICBpZiAoKHN0YXJ0IDw9IGN1cnJlbnRQdWxzZVRpbWUpICYmIChjdXJyZW50UHVsc2VUaW1lIDwgbmV4dFN0YXJ0KSAmJlxyXG4gICAgICAgICAgICAgICAgKGN1cnJlbnRQdWxzZVRpbWUgPCBlbmQpICYmIFxyXG4gICAgICAgICAgICAgICAgKHN0YXJ0IDw9IHByZXZQdWxzZVRpbWUpICYmIChwcmV2UHVsc2VUaW1lIDwgbmV4dFN0YXJ0KSAmJlxyXG4gICAgICAgICAgICAgICAgKHByZXZQdWxzZVRpbWUgPCBlbmQpKSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLyogSWYgdGhlIG5vdGUgaXMgaW4gdGhlIGN1cnJlbnQgdGltZSwgc2hhZGUgaXQgKi9cclxuICAgICAgICAgICAgaWYgKChzdGFydCA8PSBjdXJyZW50UHVsc2VUaW1lKSAmJiAoY3VycmVudFB1bHNlVGltZSA8IGVuZCkpIHtcclxuICAgICAgICAgICAgICAgIGlmICh1c2VUd29Db2xvcnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobm90ZXNbaV0uQ2hhbm5lbCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFNoYWRlT25lTm90ZShncmFwaGljcywgbm90ZW51bWJlciwgc2hhZGUyQnJ1c2gpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgU2hhZGVPbmVOb3RlKGdyYXBoaWNzLCBub3RlbnVtYmVyLCBzaGFkZUJydXNoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBTaGFkZU9uZU5vdGUoZ3JhcGhpY3MsIG5vdGVudW1iZXIsIHNoYWRlQnJ1c2gpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvKiBJZiB0aGUgbm90ZSBpcyBpbiB0aGUgcHJldmlvdXMgdGltZSwgdW4tc2hhZGUgaXQsIGRyYXcgaXQgd2hpdGUuICovXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKChzdGFydCA8PSBwcmV2UHVsc2VUaW1lKSAmJiAocHJldlB1bHNlVGltZSA8IGVuZCkpIHtcclxuICAgICAgICAgICAgICAgIGludCBudW0gPSBub3RlbnVtYmVyICUgMTI7XHJcbiAgICAgICAgICAgICAgICBpZiAobnVtID09IDEgfHwgbnVtID09IDMgfHwgbnVtID09IDYgfHwgbnVtID09IDggfHwgbnVtID09IDEwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgU2hhZGVPbmVOb3RlKGdyYXBoaWNzLCBub3RlbnVtYmVyLCBncmF5MUJydXNoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIFNoYWRlT25lTm90ZShncmFwaGljcywgbm90ZW51bWJlciwgQnJ1c2hlcy5XaGl0ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZ3JhcGhpY3MuVHJhbnNsYXRlVHJhbnNmb3JtKC0obWFyZ2luICsgQmxhY2tCb3JkZXIpLCAtKG1hcmdpbiArIEJsYWNrQm9yZGVyKSk7XHJcbiAgICAgICAgZ3JhcGhpY3MuU21vb3RoaW5nTW9kZSA9IFNtb290aGluZ01vZGUuQW50aUFsaWFzO1xyXG4gICAgfVxyXG59XHJcblxyXG59XHJcbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMSBNYWRoYXYgVmFpZHlhbmF0aGFuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cblxudXNpbmcgU3lzdGVtO1xudXNpbmcgU3lzdGVtLklPO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG51c2luZyBTeXN0ZW0uVGV4dDtcblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljIHtcblxuXG4vKiBAY2xhc3MgUmVzdFN5bWJvbFxuICogQSBSZXN0IHN5bWJvbCByZXByZXNlbnRzIGEgcmVzdCAtIHdob2xlLCBoYWxmLCBxdWFydGVyLCBvciBlaWdodGguXG4gKiBUaGUgUmVzdCBzeW1ib2wgaGFzIGEgc3RhcnR0aW1lIGFuZCBhIGR1cmF0aW9uLCBqdXN0IGxpa2UgYSByZWd1bGFyXG4gKiBub3RlLlxuICovXG5wdWJsaWMgY2xhc3MgUmVzdFN5bWJvbCA6IE11c2ljU3ltYm9sIHtcbiAgICBwcml2YXRlIGludCBzdGFydHRpbWU7ICAgICAgICAgIC8qKiBUaGUgc3RhcnR0aW1lIG9mIHRoZSByZXN0ICovXG4gICAgcHJpdmF0ZSBOb3RlRHVyYXRpb24gZHVyYXRpb247ICAvKiogVGhlIHJlc3QgZHVyYXRpb24gKGVpZ2h0aCwgcXVhcnRlciwgaGFsZiwgd2hvbGUpICovXG4gICAgcHJpdmF0ZSBpbnQgd2lkdGg7ICAgICAgICAgICAgICAvKiogVGhlIHdpZHRoIGluIHBpeGVscyAqL1xuXG4gICAgLyoqIENyZWF0ZSBhIG5ldyByZXN0IHN5bWJvbCB3aXRoIHRoZSBnaXZlbiBzdGFydCB0aW1lIGFuZCBkdXJhdGlvbiAqL1xuICAgIHB1YmxpYyBSZXN0U3ltYm9sKGludCBzdGFydCwgTm90ZUR1cmF0aW9uIGR1cikge1xuICAgICAgICBzdGFydHRpbWUgPSBzdGFydDtcbiAgICAgICAgZHVyYXRpb24gPSBkdXI7IFxuICAgICAgICB3aWR0aCA9IE1pbldpZHRoO1xuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIHRpbWUgKGluIHB1bHNlcykgdGhpcyBzeW1ib2wgb2NjdXJzIGF0LlxuICAgICAqIFRoaXMgaXMgdXNlZCB0byBkZXRlcm1pbmUgdGhlIG1lYXN1cmUgdGhpcyBzeW1ib2wgYmVsb25ncyB0by5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IFN0YXJ0VGltZSB7IFxuICAgICAgICBnZXQgeyByZXR1cm4gc3RhcnR0aW1lOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldC9TZXQgdGhlIHdpZHRoIChpbiBwaXhlbHMpIG9mIHRoaXMgc3ltYm9sLiBUaGUgd2lkdGggaXMgc2V0XG4gICAgICogaW4gU2hlZXRNdXNpYy5BbGlnblN5bWJvbHMoKSB0byB2ZXJ0aWNhbGx5IGFsaWduIHN5bWJvbHMuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBXaWR0aCB7XG4gICAgICAgIGdldCB7IHJldHVybiB3aWR0aDsgfVxuICAgICAgICBzZXQgeyB3aWR0aCA9IHZhbHVlOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbWluaW11bSB3aWR0aCAoaW4gcGl4ZWxzKSBuZWVkZWQgdG8gZHJhdyB0aGlzIHN5bWJvbCAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgTWluV2lkdGgge1xuICAgICAgICBnZXQgeyByZXR1cm4gMiAqIFNoZWV0TXVzaWMuTm90ZUhlaWdodCArIFxuICAgICAgICAgICAgICBTaGVldE11c2ljLk5vdGVIZWlnaHQvMjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBwaXhlbHMgdGhpcyBzeW1ib2wgZXh0ZW5kcyBhYm92ZSB0aGUgc3RhZmYuIFVzZWRcbiAgICAgKiAgdG8gZGV0ZXJtaW5lIHRoZSBtaW5pbXVtIGhlaWdodCBuZWVkZWQgZm9yIHRoZSBzdGFmZiAoU3RhZmYuRmluZEJvdW5kcykuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBBYm92ZVN0YWZmIHsgXG4gICAgICAgIGdldCB7IHJldHVybiAwOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbnVtYmVyIG9mIHBpeGVscyB0aGlzIHN5bWJvbCBleHRlbmRzIGJlbG93IHRoZSBzdGFmZi4gVXNlZFxuICAgICAqICB0byBkZXRlcm1pbmUgdGhlIG1pbmltdW0gaGVpZ2h0IG5lZWRlZCBmb3IgdGhlIHN0YWZmIChTdGFmZi5GaW5kQm91bmRzKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IEJlbG93U3RhZmYgeyBcbiAgICAgICAgZ2V0IHsgcmV0dXJuIDA7IH1cbiAgICB9XG5cbiAgICAvKiogRHJhdyB0aGUgc3ltYm9sLlxuICAgICAqIEBwYXJhbSB5dG9wIFRoZSB5bG9jYXRpb24gKGluIHBpeGVscykgd2hlcmUgdGhlIHRvcCBvZiB0aGUgc3RhZmYgc3RhcnRzLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBcbiAgICB2b2lkIERyYXcoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHl0b3ApIHtcbiAgICAgICAgLyogQWxpZ24gdGhlIHJlc3Qgc3ltYm9sIHRvIHRoZSByaWdodCAqL1xuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybShXaWR0aCAtIE1pbldpZHRoLCAwKTtcbiAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzIsIDApO1xuXG4gICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uV2hvbGUpIHtcbiAgICAgICAgICAgIERyYXdXaG9sZShnLCBwZW4sIHl0b3ApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5IYWxmKSB7XG4gICAgICAgICAgICBEcmF3SGFsZihnLCBwZW4sIHl0b3ApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5RdWFydGVyKSB7XG4gICAgICAgICAgICBEcmF3UXVhcnRlcihnLCBwZW4sIHl0b3ApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5FaWdodGgpIHtcbiAgICAgICAgICAgIERyYXdFaWdodGgoZywgcGVuLCB5dG9wKTtcbiAgICAgICAgfVxuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgtU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzIsIDApO1xuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgtKFdpZHRoIC0gTWluV2lkdGgpLCAwKTtcbiAgICB9XG5cblxuICAgIC8qKiBEcmF3IGEgd2hvbGUgcmVzdCBzeW1ib2wsIGEgcmVjdGFuZ2xlIGJlbG93IGEgc3RhZmYgbGluZS5cbiAgICAgKiBAcGFyYW0geXRvcCBUaGUgeWxvY2F0aW9uIChpbiBwaXhlbHMpIHdoZXJlIHRoZSB0b3Agb2YgdGhlIHN0YWZmIHN0YXJ0cy5cbiAgICAgKi9cbiAgICBwdWJsaWMgdm9pZCBEcmF3V2hvbGUoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHl0b3ApIHtcbiAgICAgICAgaW50IHkgPSB5dG9wICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuXG4gICAgICAgIGcuRmlsbFJlY3RhbmdsZShCcnVzaGVzLkJsYWNrLCAwLCB5LCBcbiAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZVdpZHRoLCBTaGVldE11c2ljLk5vdGVIZWlnaHQvMik7XG4gICAgfVxuXG4gICAgLyoqIERyYXcgYSBoYWxmIHJlc3Qgc3ltYm9sLCBhIHJlY3RhbmdsZSBhYm92ZSBhIHN0YWZmIGxpbmUuXG4gICAgICogQHBhcmFtIHl0b3AgVGhlIHlsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICovXG4gICAgcHVibGljIHZvaWQgRHJhd0hhbGYoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHl0b3ApIHtcbiAgICAgICAgaW50IHkgPSB5dG9wICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0ICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7XG5cbiAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKEJydXNoZXMuQmxhY2ssIDAsIHksIFxuICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlV2lkdGgsIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yKTtcbiAgICB9XG5cbiAgICAvKiogRHJhdyBhIHF1YXJ0ZXIgcmVzdCBzeW1ib2wuXG4gICAgICogQHBhcmFtIHl0b3AgVGhlIHlsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICovXG4gICAgcHVibGljIHZvaWQgRHJhd1F1YXJ0ZXIoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHl0b3ApIHtcbiAgICAgICAgcGVuLkVuZENhcCA9IExpbmVDYXAuRmxhdDtcblxuICAgICAgICBpbnQgeSA9IHl0b3AgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQvMjtcbiAgICAgICAgaW50IHggPSAyO1xuICAgICAgICBpbnQgeGVuZCA9IHggKyAyKlNoZWV0TXVzaWMuTm90ZUhlaWdodC8zO1xuICAgICAgICBwZW4uV2lkdGggPSAxO1xuICAgICAgICBnLkRyYXdMaW5lKHBlbiwgeCwgeSwgeGVuZC0xLCB5ICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LTEpO1xuXG4gICAgICAgIHBlbi5XaWR0aCA9IFNoZWV0TXVzaWMuTGluZVNwYWNlLzI7XG4gICAgICAgIHkgID0geXRvcCArIFNoZWV0TXVzaWMuTm90ZUhlaWdodCArIDE7XG4gICAgICAgIGcuRHJhd0xpbmUocGVuLCB4ZW5kLTIsIHksIHgsIHkgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQpO1xuXG4gICAgICAgIHBlbi5XaWR0aCA9IDE7XG4gICAgICAgIHkgPSB5dG9wICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0KjIgLSAxO1xuICAgICAgICBnLkRyYXdMaW5lKHBlbiwgMCwgeSwgeGVuZCsyLCB5ICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0KTsgXG5cbiAgICAgICAgcGVuLldpZHRoID0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvMjtcbiAgICAgICAgaWYgKFNoZWV0TXVzaWMuTm90ZUhlaWdodCA9PSA2KSB7XG4gICAgICAgICAgICBnLkRyYXdMaW5lKHBlbiwgeGVuZCwgeSArIDEgKyAzKlNoZWV0TXVzaWMuTm90ZUhlaWdodC80LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHgvMiwgeSArIDEgKyAzKlNoZWV0TXVzaWMuTm90ZUhlaWdodC80KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHsgIC8qIE5vdGVIZWlnaHQgPT0gOCAqL1xuICAgICAgICAgICAgZy5EcmF3TGluZShwZW4sIHhlbmQsIHkgKyAzKlNoZWV0TXVzaWMuTm90ZUhlaWdodC80LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHgvMiwgeSArIDMqU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcGVuLldpZHRoID0gMTtcbiAgICAgICAgZy5EcmF3TGluZShwZW4sIDAsIHkgKyAyKlNoZWV0TXVzaWMuTm90ZUhlaWdodC8zICsgMSwgXG4gICAgICAgICAgICAgICAgICAgICAgICB4ZW5kIC0gMSwgeSArIDMqU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzIpO1xuICAgIH1cblxuICAgIC8qKiBEcmF3IGFuIGVpZ2h0aCByZXN0IHN5bWJvbC5cbiAgICAgKiBAcGFyYW0geXRvcCBUaGUgeWxvY2F0aW9uIChpbiBwaXhlbHMpIHdoZXJlIHRoZSB0b3Agb2YgdGhlIHN0YWZmIHN0YXJ0cy5cbiAgICAgKi9cbiAgICBwdWJsaWMgdm9pZCBEcmF3RWlnaHRoKEdyYXBoaWNzIGcsIFBlbiBwZW4sIGludCB5dG9wKSB7XG4gICAgICAgIGludCB5ID0geXRvcCArIFNoZWV0TXVzaWMuTm90ZUhlaWdodCAtIDE7XG4gICAgICAgIGcuRmlsbEVsbGlwc2UoQnJ1c2hlcy5CbGFjaywgMCwgeSsxLCBcbiAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLkxpbmVTcGFjZS0xLCBTaGVldE11c2ljLkxpbmVTcGFjZS0xKTtcbiAgICAgICAgcGVuLldpZHRoID0gMTtcbiAgICAgICAgZy5EcmF3TGluZShwZW4sIChTaGVldE11c2ljLkxpbmVTcGFjZS0yKS8yLCB5ICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDMqU2hlZXRNdXNpYy5MaW5lU3BhY2UvMiwgeSArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzIpO1xuICAgICAgICBnLkRyYXdMaW5lKHBlbiwgMypTaGVldE11c2ljLkxpbmVTcGFjZS8yLCB5ICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UvMixcbiAgICAgICAgICAgICAgICAgICAgICAgIDMqU2hlZXRNdXNpYy5MaW5lU3BhY2UvNCwgeSArIFNoZWV0TXVzaWMuTm90ZUhlaWdodCoyKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb3ZlcnJpZGUgc3RyaW5nIFRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gc3RyaW5nLkZvcm1hdChcIlJlc3RTeW1ib2wgc3RhcnR0aW1lPXswfSBkdXJhdGlvbj17MX0gd2lkdGg9ezJ9XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0dGltZSwgZHVyYXRpb24sIHdpZHRoKTtcbiAgICB9XG5cbn1cblxuXG59XG5cbiIsIi8qXHJcbiAqIENvcHlyaWdodCAoYykgMjAwNy0yMDEyIE1hZGhhdiBWYWlkeWFuYXRoYW5cclxuICpcclxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cclxuICpcclxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcbiAqL1xyXG5cclxudXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uTGlucTtcclxudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XHJcbnVzaW5nIFN5c3RlbS5UZXh0O1xyXG5cclxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljXHJcbntcclxuXHJcblxyXG4gICAgLyoqIEBjbGFzcyBTaGVldE11c2ljXHJcbiAgICAgKlxyXG4gICAgICogVGhlIFNoZWV0TXVzaWMgQ29udHJvbCBpcyB0aGUgbWFpbiBjbGFzcyBmb3IgZGlzcGxheWluZyB0aGUgc2hlZXQgbXVzaWMuXHJcbiAgICAgKiBUaGUgU2hlZXRNdXNpYyBjbGFzcyBoYXMgdGhlIGZvbGxvd2luZyBwdWJsaWMgbWV0aG9kczpcclxuICAgICAqXHJcbiAgICAgKiBTaGVldE11c2ljKClcclxuICAgICAqICAgQ3JlYXRlIGEgbmV3IFNoZWV0TXVzaWMgY29udHJvbCBmcm9tIHRoZSBnaXZlbiBtaWRpIGZpbGUgYW5kIG9wdGlvbnMuXHJcbiAgICAgKiBcclxuICAgICAqIFNldFpvb20oKVxyXG4gICAgICogICBTZXQgdGhlIHpvb20gbGV2ZWwgdG8gZGlzcGxheSB0aGUgc2hlZXQgbXVzaWMgYXQuXHJcbiAgICAgKlxyXG4gICAgICogRG9QcmludCgpXHJcbiAgICAgKiAgIFByaW50IGEgc2luZ2xlIHBhZ2Ugb2Ygc2hlZXQgbXVzaWMuXHJcbiAgICAgKlxyXG4gICAgICogR2V0VG90YWxQYWdlcygpXHJcbiAgICAgKiAgIEdldCB0aGUgdG90YWwgbnVtYmVyIG9mIHNoZWV0IG11c2ljIHBhZ2VzLlxyXG4gICAgICpcclxuICAgICAqIE9uUGFpbnQoKVxyXG4gICAgICogICBNZXRob2QgY2FsbGVkIHRvIGRyYXcgdGhlIFNoZWV0TXVpc2NcclxuICAgICAqXHJcbiAgICAgKiBUaGVzZSBwdWJsaWMgbWV0aG9kcyBhcmUgY2FsbGVkIGZyb20gdGhlIE1pZGlTaGVldE11c2ljIEZvcm0gV2luZG93LlxyXG4gICAgICpcclxuICAgICAqL1xyXG4gICAgcHVibGljIGNsYXNzIFNoZWV0TXVzaWMgOiBDb250cm9sXHJcbiAgICB7XHJcblxyXG4gICAgICAgIC8qIE1lYXN1cmVtZW50cyB1c2VkIHdoZW4gZHJhd2luZy4gIEFsbCBtZWFzdXJlbWVudHMgYXJlIGluIHBpeGVscy5cclxuICAgICAgICAgKiBUaGUgdmFsdWVzIGRlcGVuZCBvbiB3aGV0aGVyIHRoZSBtZW51ICdMYXJnZSBOb3Rlcycgb3IgJ1NtYWxsIE5vdGVzJyBpcyBzZWxlY3RlZC5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwdWJsaWMgY29uc3QgaW50IExpbmVXaWR0aCA9IDE7ICAgIC8qKiBUaGUgd2lkdGggb2YgYSBsaW5lICovXHJcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBMZWZ0TWFyZ2luID0gNDsgICAvKiogVGhlIGxlZnQgbWFyZ2luICovXHJcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBUaXRsZUhlaWdodCA9IDE0OyAvKiogVGhlIGhlaWdodCBmb3IgdGhlIHRpdGxlIG9uIHRoZSBmaXJzdCBwYWdlICovXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBpbnQgTGluZVNwYWNlOyAgICAgICAgLyoqIFRoZSBzcGFjZSBiZXR3ZWVuIGxpbmVzIGluIHRoZSBzdGFmZiAqL1xyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgaW50IFN0YWZmSGVpZ2h0OyAgICAgIC8qKiBUaGUgaGVpZ2h0IGJldHdlZW4gdGhlIDUgaG9yaXpvbnRhbCBsaW5lcyBvZiB0aGUgc3RhZmYgKi9cclxuICAgICAgICBwdWJsaWMgc3RhdGljIGludCBOb3RlSGVpZ2h0OyAgICAgIC8qKiBUaGUgaGVpZ2h0IG9mIGEgd2hvbGUgbm90ZSAqL1xyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgaW50IE5vdGVXaWR0aDsgICAgICAgLyoqIFRoZSB3aWR0aCBvZiBhIHdob2xlIG5vdGUgKi9cclxuXHJcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBQYWdlV2lkdGggPSA4MDA7ICAgIC8qKiBUaGUgd2lkdGggb2YgZWFjaCBwYWdlICovXHJcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBQYWdlSGVpZ2h0ID0gMTA1MDsgIC8qKiBUaGUgaGVpZ2h0IG9mIGVhY2ggcGFnZSAod2hlbiBwcmludGluZykgKi9cclxuICAgICAgICBwdWJsaWMgc3RhdGljIEZvbnQgTGV0dGVyRm9udDsgICAgICAgLyoqIFRoZSBmb250IGZvciBkcmF3aW5nIHRoZSBsZXR0ZXJzICovXHJcblxyXG4gICAgICAgIHByaXZhdGUgTGlzdDxTdGFmZj4gc3RhZmZzOyAvKiogVGhlIGFycmF5IG9mIHN0YWZmcyB0byBkaXNwbGF5IChmcm9tIHRvcCB0byBib3R0b20pICovXHJcbiAgICAgICAgcHJpdmF0ZSBLZXlTaWduYXR1cmUgbWFpbmtleTsgLyoqIFRoZSBtYWluIGtleSBzaWduYXR1cmUgKi9cclxuICAgICAgICBwcml2YXRlIGludCBudW10cmFja3M7ICAgICAvKiogVGhlIG51bWJlciBvZiB0cmFja3MgKi9cclxuICAgICAgICBwcml2YXRlIGZsb2F0IHpvb207ICAgICAgICAgIC8qKiBUaGUgem9vbSBsZXZlbCB0byBkcmF3IGF0ICgxLjAgPT0gMTAwJSkgKi9cclxuICAgICAgICBwcml2YXRlIGJvb2wgc2Nyb2xsVmVydDsgICAgLyoqIFdoZXRoZXIgdG8gc2Nyb2xsIHZlcnRpY2FsbHkgb3IgaG9yaXpvbnRhbGx5ICovXHJcbiAgICAgICAgcHJpdmF0ZSBzdHJpbmcgZmlsZW5hbWU7ICAgICAgLyoqIFRoZSBuYW1lIG9mIHRoZSBtaWRpIGZpbGUgKi9cclxuICAgICAgICBwcml2YXRlIGludCBzaG93Tm90ZUxldHRlcnM7ICAgIC8qKiBEaXNwbGF5IHRoZSBub3RlIGxldHRlcnMgKi9cclxuICAgICAgICBwcml2YXRlIENvbG9yW10gTm90ZUNvbG9yczsgICAgIC8qKiBUaGUgbm90ZSBjb2xvcnMgdG8gdXNlICovXHJcbiAgICAgICAgcHJpdmF0ZSBTb2xpZEJydXNoIHNoYWRlQnJ1c2g7ICAvKiogVGhlIGJydXNoIGZvciBzaGFkaW5nICovXHJcbiAgICAgICAgcHJpdmF0ZSBTb2xpZEJydXNoIHNoYWRlMkJydXNoOyAvKiogVGhlIGJydXNoIGZvciBzaGFkaW5nIGxlZnQtaGFuZCBwaWFubyAqL1xyXG4gICAgICAgIHByaXZhdGUgU29saWRCcnVzaCBkZXNlbGVjdGVkU2hhZGVCcnVzaCA9IG5ldyBTb2xpZEJydXNoKENvbG9yLkxpZ2h0R3JheSk7IC8qKiBUaGUgYnJ1c2ggZm9yIHNoYWRpbmcgZGVzZWxlY3RlZCBhcmVhcyAqL1xyXG4gICAgICAgIHByaXZhdGUgUGVuIHBlbjsgICAgICAgICAgICAgICAgLyoqIFRoZSBibGFjayBwZW4gZm9yIGRyYXdpbmcgKi9cclxuXHJcbiAgICAgICAgcHVibGljIGludCBTZWxlY3Rpb25TdGFydFB1bHNlIHsgZ2V0OyBzZXQ7IH1cclxuICAgICAgICBwdWJsaWMgaW50IFNlbGVjdGlvbkVuZFB1bHNlIHsgZ2V0OyBzZXQ7IH1cclxuXHJcbiAgICAgICAgLyoqIEluaXRpYWxpemUgdGhlIGRlZmF1bHQgbm90ZSBzaXplcy4gICovXHJcbiAgICAgICAgc3RhdGljIFNoZWV0TXVzaWMoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgU2V0Tm90ZVNpemUoZmFsc2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIENyZWF0ZSBhIG5ldyBTaGVldE11c2ljIGNvbnRyb2wsIHVzaW5nIHRoZSBnaXZlbiBwYXJzZWQgTWlkaUZpbGUuXHJcbiAgICAgICAgICogIFRoZSBvcHRpb25zIGNhbiBiZSBudWxsLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHB1YmxpYyBTaGVldE11c2ljKE1pZGlGaWxlIGZpbGUsIE1pZGlPcHRpb25zIG9wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbml0KGZpbGUsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIFNoZWV0TXVzaWMoTWlkaUZpbGUgZmlsZSwgTWlkaU9wdGlvbnMgb3B0aW9ucywgTGlzdDxNaWRpVHJhY2s+IHRyYWNrcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGluaXQoZmlsZSwgb3B0aW9ucywgdHJhY2tzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBDcmVhdGUgYSBuZXcgU2hlZXRNdXNpYyBjb250cm9sLCB1c2luZyB0aGUgZ2l2ZW4gcmF3IG1pZGkgYnl0ZVtdIGRhdGEuXHJcbiAgICAgICAgICogIFRoZSBvcHRpb25zIGNhbiBiZSBudWxsLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHB1YmxpYyBTaGVldE11c2ljKGJ5dGVbXSBkYXRhLCBzdHJpbmcgdGl0bGUsIE1pZGlPcHRpb25zIG9wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBNaWRpRmlsZSBmaWxlID0gbmV3IE1pZGlGaWxlKGRhdGEsIHRpdGxlKTtcclxuICAgICAgICAgICAgaW5pdChmaWxlLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIGluaXQoTWlkaUZpbGUgZmlsZSwgTWlkaU9wdGlvbnMgb3B0aW9ucywgTGlzdDxNaWRpVHJhY2s+IHRyYWNrcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHpvb20gPSAxLjBmO1xyXG4gICAgICAgICAgICBmaWxlbmFtZSA9IGZpbGUuRmlsZU5hbWU7XHJcblxyXG4gICAgICAgICAgICBTZXRDb2xvcnMob3B0aW9ucy5jb2xvcnMsIG9wdGlvbnMuc2hhZGVDb2xvciwgb3B0aW9ucy5zaGFkZTJDb2xvcik7XHJcbiAgICAgICAgICAgIHBlbiA9IG5ldyBQZW4oQ29sb3IuQmxhY2ssIDEpO1xyXG5cclxuICAgICAgICAgICAgU2V0Tm90ZVNpemUob3B0aW9ucy5sYXJnZU5vdGVTaXplKTtcclxuICAgICAgICAgICAgc2Nyb2xsVmVydCA9IG9wdGlvbnMuc2Nyb2xsVmVydDtcclxuICAgICAgICAgICAgc2hvd05vdGVMZXR0ZXJzID0gb3B0aW9ucy5zaG93Tm90ZUxldHRlcnM7XHJcbiAgICAgICAgICAgIFRpbWVTaWduYXR1cmUgdGltZSA9IGZpbGUuVGltZTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMudGltZSAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aW1lID0gb3B0aW9ucy50aW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmtleSA9PSAtMSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbWFpbmtleSA9IEdldEtleVNpZ25hdHVyZSh0cmFja3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbWFpbmtleSA9IG5ldyBLZXlTaWduYXR1cmUob3B0aW9ucy5rZXkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBudW10cmFja3MgPSB0cmFja3MuQ291bnQ7XHJcblxyXG4gICAgICAgICAgICBpbnQgbGFzdFN0YXJ0ID0gZmlsZS5FbmRUaW1lKCkgKyBvcHRpb25zLnNoaWZ0dGltZTtcclxuXHJcbiAgICAgICAgICAgIC8qIENyZWF0ZSBhbGwgdGhlIG11c2ljIHN5bWJvbHMgKG5vdGVzLCByZXN0cywgdmVydGljYWwgYmFycywgYW5kXHJcbiAgICAgICAgICAgICAqIGNsZWYgY2hhbmdlcykuICBUaGUgc3ltYm9scyB2YXJpYWJsZSBjb250YWlucyBhIGxpc3Qgb2YgbXVzaWMgXHJcbiAgICAgICAgICAgICAqIHN5bWJvbHMgZm9yIGVhY2ggdHJhY2suICBUaGUgbGlzdCBkb2VzIG5vdCBpbmNsdWRlIHRoZSBsZWZ0LXNpZGUgXHJcbiAgICAgICAgICAgICAqIENsZWYgYW5kIGtleSBzaWduYXR1cmUgc3ltYm9scy4gIFRob3NlIGNhbiBvbmx5IGJlIGNhbGN1bGF0ZWQgXHJcbiAgICAgICAgICAgICAqIHdoZW4gd2UgY3JlYXRlIHRoZSBzdGFmZnMuXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBMaXN0PE11c2ljU3ltYm9sPltdIHN5bWJvbHMgPSBuZXcgTGlzdDxNdXNpY1N5bWJvbD5bbnVtdHJhY2tzXTtcclxuICAgICAgICAgICAgZm9yIChpbnQgdHJhY2tudW0gPSAwOyB0cmFja251bSA8IG51bXRyYWNrczsgdHJhY2tudW0rKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgTWlkaVRyYWNrIHRyYWNrID0gdHJhY2tzW3RyYWNrbnVtXTtcclxuICAgICAgICAgICAgICAgIENsZWZNZWFzdXJlcyBjbGVmcyA9IG5ldyBDbGVmTWVhc3VyZXModHJhY2suTm90ZXMsIHRpbWUuTWVhc3VyZSk7XHJcbiAgICAgICAgICAgICAgICBMaXN0PENob3JkU3ltYm9sPiBjaG9yZHMgPSBDcmVhdGVDaG9yZHModHJhY2suTm90ZXMsIG1haW5rZXksIHRpbWUsIGNsZWZzKTtcclxuICAgICAgICAgICAgICAgIHN5bWJvbHNbdHJhY2tudW1dID0gQ3JlYXRlU3ltYm9scyhjaG9yZHMsIGNsZWZzLCB0aW1lLCBsYXN0U3RhcnQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBMaXN0PEx5cmljU3ltYm9sPltdIGx5cmljcyA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNob3dMeXJpY3MpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGx5cmljcyA9IEdldEx5cmljcyh0cmFja3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvKiBWZXJ0aWNhbGx5IGFsaWduIHRoZSBtdXNpYyBzeW1ib2xzICovXHJcbiAgICAgICAgICAgIFN5bWJvbFdpZHRocyB3aWR0aHMgPSBuZXcgU3ltYm9sV2lkdGhzKHN5bWJvbHMsIGx5cmljcyk7XHJcbiAgICAgICAgICAgIEFsaWduU3ltYm9scyhzeW1ib2xzLCB3aWR0aHMsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAgICAgc3RhZmZzID0gQ3JlYXRlU3RhZmZzKHN5bWJvbHMsIG1haW5rZXksIG9wdGlvbnMsIHRpbWUuTWVhc3VyZSk7XHJcbiAgICAgICAgICAgIENyZWF0ZUFsbEJlYW1lZENob3JkcyhzeW1ib2xzLCB0aW1lKTtcclxuICAgICAgICAgICAgaWYgKGx5cmljcyAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBBZGRMeXJpY3NUb1N0YWZmcyhzdGFmZnMsIGx5cmljcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8qIEFmdGVyIG1ha2luZyBjaG9yZCBwYWlycywgdGhlIHN0ZW0gZGlyZWN0aW9ucyBjYW4gY2hhbmdlLFxyXG4gICAgICAgICAgICAgKiB3aGljaCBhZmZlY3RzIHRoZSBzdGFmZiBoZWlnaHQuICBSZS1jYWxjdWxhdGUgdGhlIHN0YWZmIGhlaWdodC5cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGZvcmVhY2ggKFN0YWZmIHN0YWZmIGluIHN0YWZmcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc3RhZmYuQ2FsY3VsYXRlSGVpZ2h0KCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIEJhY2tDb2xvciA9IENvbG9yLldoaXRlO1xyXG5cclxuICAgICAgICAgICAgU2V0Wm9vbSgxLjBmKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBDcmVhdGUgYSBuZXcgU2hlZXRNdXNpYyBjb250cm9sLlxyXG4gICAgICAgICAqIE1pZGlGaWxlIGlzIHRoZSBwYXJzZWQgbWlkaSBmaWxlIHRvIGRpc3BsYXkuXHJcbiAgICAgICAgICogU2hlZXRNdXNpYyBPcHRpb25zIGFyZSB0aGUgbWVudSBvcHRpb25zIHRoYXQgd2VyZSBzZWxlY3RlZC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIC0gQXBwbHkgYWxsIHRoZSBNZW51IE9wdGlvbnMgdG8gdGhlIE1pZGlGaWxlIHRyYWNrcy5cclxuICAgICAgICAgKiAtIENhbGN1bGF0ZSB0aGUga2V5IHNpZ25hdHVyZVxyXG4gICAgICAgICAqIC0gRm9yIGVhY2ggdHJhY2ssIGNyZWF0ZSBhIGxpc3Qgb2YgTXVzaWNTeW1ib2xzIChub3RlcywgcmVzdHMsIGJhcnMsIGV0YylcclxuICAgICAgICAgKiAtIFZlcnRpY2FsbHkgYWxpZ24gdGhlIG11c2ljIHN5bWJvbHMgaW4gYWxsIHRoZSB0cmFja3NcclxuICAgICAgICAgKiAtIFBhcnRpdGlvbiB0aGUgbXVzaWMgbm90ZXMgaW50byBob3Jpem9udGFsIHN0YWZmc1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHB1YmxpYyB2b2lkIGluaXQoTWlkaUZpbGUgZmlsZSwgTWlkaU9wdGlvbnMgb3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zID09IG51bGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBuZXcgTWlkaU9wdGlvbnMoZmlsZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgTGlzdDxNaWRpVHJhY2s+IHRyYWNrcyA9IGZpbGUuQ2hhbmdlTWlkaU5vdGVzKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBpbml0KGZpbGUsIG9wdGlvbnMsIHRyYWNrcyk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qKiBHZXQgdGhlIGJlc3Qga2V5IHNpZ25hdHVyZSBnaXZlbiB0aGUgbWlkaSBub3RlcyBpbiBhbGwgdGhlIHRyYWNrcy4gKi9cclxuICAgICAgICBwcml2YXRlIEtleVNpZ25hdHVyZSBHZXRLZXlTaWduYXR1cmUoTGlzdDxNaWRpVHJhY2s+IHRyYWNrcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIExpc3Q8aW50PiBub3RlbnVtcyA9IG5ldyBMaXN0PGludD4oKTtcclxuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaVRyYWNrIHRyYWNrIGluIHRyYWNrcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yZWFjaCAoTWlkaU5vdGUgbm90ZSBpbiB0cmFjay5Ob3RlcylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBub3RlbnVtcy5BZGQobm90ZS5OdW1iZXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBLZXlTaWduYXR1cmUuR3Vlc3Mobm90ZW51bXMpO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qKiBDcmVhdGUgdGhlIGNob3JkIHN5bWJvbHMgZm9yIGEgc2luZ2xlIHRyYWNrLlxyXG4gICAgICAgICAqIEBwYXJhbSBtaWRpbm90ZXMgIFRoZSBNaWRpbm90ZXMgaW4gdGhlIHRyYWNrLlxyXG4gICAgICAgICAqIEBwYXJhbSBrZXkgICAgICAgIFRoZSBLZXkgU2lnbmF0dXJlLCBmb3IgZGV0ZXJtaW5pbmcgc2hhcnBzL2ZsYXRzLlxyXG4gICAgICAgICAqIEBwYXJhbSB0aW1lICAgICAgIFRoZSBUaW1lIFNpZ25hdHVyZSwgZm9yIGRldGVybWluaW5nIHRoZSBtZWFzdXJlcy5cclxuICAgICAgICAgKiBAcGFyYW0gY2xlZnMgICAgICBUaGUgY2xlZnMgdG8gdXNlIGZvciBlYWNoIG1lYXN1cmUuXHJcbiAgICAgICAgICogQHJldCBBbiBhcnJheSBvZiBDaG9yZFN5bWJvbHNcclxuICAgICAgICAgKi9cclxuICAgICAgICBwcml2YXRlXHJcbiAgICAgICAgTGlzdDxDaG9yZFN5bWJvbD4gQ3JlYXRlQ2hvcmRzKExpc3Q8TWlkaU5vdGU+IG1pZGlub3RlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgS2V5U2lnbmF0dXJlIGtleSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGltZVNpZ25hdHVyZSB0aW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDbGVmTWVhc3VyZXMgY2xlZnMpXHJcbiAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgaW50IGkgPSAwO1xyXG4gICAgICAgICAgICBMaXN0PENob3JkU3ltYm9sPiBjaG9yZHMgPSBuZXcgTGlzdDxDaG9yZFN5bWJvbD4oKTtcclxuICAgICAgICAgICAgTGlzdDxNaWRpTm90ZT4gbm90ZWdyb3VwID0gbmV3IExpc3Q8TWlkaU5vdGU+KDEyKTtcclxuICAgICAgICAgICAgaW50IGxlbiA9IG1pZGlub3Rlcy5Db3VudDtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChpIDwgbGVuKVxyXG4gICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgaW50IHN0YXJ0dGltZSA9IG1pZGlub3Rlc1tpXS5TdGFydFRpbWU7XHJcbiAgICAgICAgICAgICAgICBDbGVmIGNsZWYgPSBjbGVmcy5HZXRDbGVmKHN0YXJ0dGltZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLyogR3JvdXAgYWxsIHRoZSBtaWRpIG5vdGVzIHdpdGggdGhlIHNhbWUgc3RhcnQgdGltZVxyXG4gICAgICAgICAgICAgICAgICogaW50byB0aGUgbm90ZXMgbGlzdC5cclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgbm90ZWdyb3VwLkNsZWFyKCk7XHJcbiAgICAgICAgICAgICAgICBub3RlZ3JvdXAuQWRkKG1pZGlub3Rlc1tpXSk7XHJcbiAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IGxlbiAmJiBtaWRpbm90ZXNbaV0uU3RhcnRUaW1lID09IHN0YXJ0dGltZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBub3RlZ3JvdXAuQWRkKG1pZGlub3Rlc1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8qIENyZWF0ZSBhIHNpbmdsZSBjaG9yZCBmcm9tIHRoZSBncm91cCBvZiBtaWRpIG5vdGVzIHdpdGhcclxuICAgICAgICAgICAgICAgICAqIHRoZSBzYW1lIHN0YXJ0IHRpbWUuXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIENob3JkU3ltYm9sIGNob3JkID0gbmV3IENob3JkU3ltYm9sKG5vdGVncm91cCwga2V5LCB0aW1lLCBjbGVmLCB0aGlzKTtcclxuICAgICAgICAgICAgICAgIGNob3Jkcy5BZGQoY2hvcmQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gY2hvcmRzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEdpdmVuIHRoZSBjaG9yZCBzeW1ib2xzIGZvciBhIHRyYWNrLCBjcmVhdGUgYSBuZXcgc3ltYm9sIGxpc3RcclxuICAgICAgICAgKiB0aGF0IGNvbnRhaW5zIHRoZSBjaG9yZCBzeW1ib2xzLCB2ZXJ0aWNhbCBiYXJzLCByZXN0cywgYW5kIGNsZWYgY2hhbmdlcy5cclxuICAgICAgICAgKiBSZXR1cm4gYSBsaXN0IG9mIHN5bWJvbHMgKENob3JkU3ltYm9sLCBCYXJTeW1ib2wsIFJlc3RTeW1ib2wsIENsZWZTeW1ib2wpXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHJpdmF0ZSBMaXN0PE11c2ljU3ltYm9sPlxyXG4gICAgICAgIENyZWF0ZVN5bWJvbHMoTGlzdDxDaG9yZFN5bWJvbD4gY2hvcmRzLCBDbGVmTWVhc3VyZXMgY2xlZnMsXHJcbiAgICAgICAgICAgICAgICAgICAgICBUaW1lU2lnbmF0dXJlIHRpbWUsIGludCBsYXN0U3RhcnQpXHJcbiAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgTGlzdDxNdXNpY1N5bWJvbD4gc3ltYm9scyA9IG5ldyBMaXN0PE11c2ljU3ltYm9sPigpO1xyXG4gICAgICAgICAgICBzeW1ib2xzID0gQWRkQmFycyhjaG9yZHMsIHRpbWUsIGxhc3RTdGFydCk7XHJcbiAgICAgICAgICAgIHN5bWJvbHMgPSBBZGRSZXN0cyhzeW1ib2xzLCB0aW1lKTtcclxuICAgICAgICAgICAgc3ltYm9scyA9IEFkZENsZWZDaGFuZ2VzKHN5bWJvbHMsIGNsZWZzLCB0aW1lKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzeW1ib2xzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEFkZCBpbiB0aGUgdmVydGljYWwgYmFycyBkZWxpbWl0aW5nIG1lYXN1cmVzLiBcclxuICAgICAgICAgKiAgQWxzbywgYWRkIHRoZSB0aW1lIHNpZ25hdHVyZSBzeW1ib2xzLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHByaXZhdGVcclxuICAgICAgICBMaXN0PE11c2ljU3ltYm9sPiBBZGRCYXJzKExpc3Q8Q2hvcmRTeW1ib2w+IGNob3JkcywgVGltZVNpZ25hdHVyZSB0aW1lLCBpbnQgbGFzdFN0YXJ0KVxyXG4gICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgIExpc3Q8TXVzaWNTeW1ib2w+IHN5bWJvbHMgPSBuZXcgTGlzdDxNdXNpY1N5bWJvbD4oKTtcclxuXHJcbiAgICAgICAgICAgIFRpbWVTaWdTeW1ib2wgdGltZXNpZyA9IG5ldyBUaW1lU2lnU3ltYm9sKHRpbWUuTnVtZXJhdG9yLCB0aW1lLkRlbm9taW5hdG9yKTtcclxuICAgICAgICAgICAgc3ltYm9scy5BZGQodGltZXNpZyk7XHJcblxyXG4gICAgICAgICAgICAvKiBUaGUgc3RhcnR0aW1lIG9mIHRoZSBiZWdpbm5pbmcgb2YgdGhlIG1lYXN1cmUgKi9cclxuICAgICAgICAgICAgaW50IG1lYXN1cmV0aW1lID0gMDtcclxuXHJcbiAgICAgICAgICAgIGludCBpID0gMDtcclxuICAgICAgICAgICAgd2hpbGUgKGkgPCBjaG9yZHMuQ291bnQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChtZWFzdXJldGltZSA8PSBjaG9yZHNbaV0uU3RhcnRUaW1lKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHN5bWJvbHMuQWRkKG5ldyBCYXJTeW1ib2wobWVhc3VyZXRpbWUpKTtcclxuICAgICAgICAgICAgICAgICAgICBtZWFzdXJldGltZSArPSB0aW1lLk1lYXN1cmU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3ltYm9scy5BZGQoY2hvcmRzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8qIEtlZXAgYWRkaW5nIGJhcnMgdW50aWwgdGhlIGxhc3QgU3RhcnRUaW1lICh0aGUgZW5kIG9mIHRoZSBzb25nKSAqL1xyXG4gICAgICAgICAgICB3aGlsZSAobWVhc3VyZXRpbWUgPCBsYXN0U3RhcnQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHN5bWJvbHMuQWRkKG5ldyBCYXJTeW1ib2wobWVhc3VyZXRpbWUpKTtcclxuICAgICAgICAgICAgICAgIG1lYXN1cmV0aW1lICs9IHRpbWUuTWVhc3VyZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLyogQWRkIHRoZSBmaW5hbCB2ZXJ0aWNhbCBiYXIgdG8gdGhlIGxhc3QgbWVhc3VyZSAqL1xyXG4gICAgICAgICAgICBzeW1ib2xzLkFkZChuZXcgQmFyU3ltYm9sKG1lYXN1cmV0aW1lKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBzeW1ib2xzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEFkZCByZXN0IHN5bWJvbHMgYmV0d2VlbiBub3Rlcy4gIEFsbCB0aW1lcyBiZWxvdyBhcmUgXHJcbiAgICAgICAgICogbWVhc3VyZWQgaW4gcHVsc2VzLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHByaXZhdGVcclxuICAgICAgICBMaXN0PE11c2ljU3ltYm9sPiBBZGRSZXN0cyhMaXN0PE11c2ljU3ltYm9sPiBzeW1ib2xzLCBUaW1lU2lnbmF0dXJlIHRpbWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnQgcHJldnRpbWUgPSAwO1xyXG5cclxuICAgICAgICAgICAgTGlzdDxNdXNpY1N5bWJvbD4gcmVzdWx0ID0gbmV3IExpc3Q8TXVzaWNTeW1ib2w+KHN5bWJvbHMuQ291bnQpO1xyXG5cclxuICAgICAgICAgICAgZm9yZWFjaCAoTXVzaWNTeW1ib2wgc3ltYm9sIGluIHN5bWJvbHMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGludCBzdGFydHRpbWUgPSBzeW1ib2wuU3RhcnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgUmVzdFN5bWJvbFtdIHJlc3RzID0gR2V0UmVzdHModGltZSwgcHJldnRpbWUsIHN0YXJ0dGltZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdHMgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3JlYWNoIChSZXN0U3ltYm9sIHIgaW4gcmVzdHMpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuQWRkKHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXN1bHQuQWRkKHN5bWJvbCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLyogU2V0IHByZXZ0aW1lIHRvIHRoZSBlbmQgdGltZSBvZiB0aGUgbGFzdCBub3RlL3N5bWJvbC4gKi9cclxuICAgICAgICAgICAgICAgIGlmIChzeW1ib2wgaXMgQ2hvcmRTeW1ib2wpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgQ2hvcmRTeW1ib2wgY2hvcmQgPSAoQ2hvcmRTeW1ib2wpc3ltYm9sO1xyXG4gICAgICAgICAgICAgICAgICAgIHByZXZ0aW1lID0gTWF0aC5NYXgoY2hvcmQuRW5kVGltZSwgcHJldnRpbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHByZXZ0aW1lID0gTWF0aC5NYXgoc3RhcnR0aW1lLCBwcmV2dGltZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBSZXR1cm4gdGhlIHJlc3Qgc3ltYm9scyBuZWVkZWQgdG8gZmlsbCB0aGUgdGltZSBpbnRlcnZhbCBiZXR3ZWVuXHJcbiAgICAgICAgICogc3RhcnQgYW5kIGVuZC4gIElmIG5vIHJlc3RzIGFyZSBuZWVkZWQsIHJldHVybiBuaWwuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHJpdmF0ZVxyXG4gICAgICAgIFJlc3RTeW1ib2xbXSBHZXRSZXN0cyhUaW1lU2lnbmF0dXJlIHRpbWUsIGludCBzdGFydCwgaW50IGVuZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFJlc3RTeW1ib2xbXSByZXN1bHQ7XHJcbiAgICAgICAgICAgIFJlc3RTeW1ib2wgcjEsIHIyO1xyXG5cclxuICAgICAgICAgICAgaWYgKGVuZCAtIHN0YXJ0IDwgMClcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICAgICAgTm90ZUR1cmF0aW9uIGR1ciA9IHRpbWUuR2V0Tm90ZUR1cmF0aW9uKGVuZCAtIHN0YXJ0KTtcclxuICAgICAgICAgICAgc3dpdGNoIChkdXIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgTm90ZUR1cmF0aW9uLldob2xlOlxyXG4gICAgICAgICAgICAgICAgY2FzZSBOb3RlRHVyYXRpb24uSGFsZjpcclxuICAgICAgICAgICAgICAgIGNhc2UgTm90ZUR1cmF0aW9uLlF1YXJ0ZXI6XHJcbiAgICAgICAgICAgICAgICBjYXNlIE5vdGVEdXJhdGlvbi5FaWdodGg6XHJcbiAgICAgICAgICAgICAgICAgICAgcjEgPSBuZXcgUmVzdFN5bWJvbChzdGFydCwgZHVyKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgUmVzdFN5bWJvbFtdIHsgcjEgfTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgTm90ZUR1cmF0aW9uLkRvdHRlZEhhbGY6XHJcbiAgICAgICAgICAgICAgICAgICAgcjEgPSBuZXcgUmVzdFN5bWJvbChzdGFydCwgTm90ZUR1cmF0aW9uLkhhbGYpO1xyXG4gICAgICAgICAgICAgICAgICAgIHIyID0gbmV3IFJlc3RTeW1ib2woc3RhcnQgKyB0aW1lLlF1YXJ0ZXIgKiAyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTm90ZUR1cmF0aW9uLlF1YXJ0ZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBSZXN0U3ltYm9sW10geyByMSwgcjIgfTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgTm90ZUR1cmF0aW9uLkRvdHRlZFF1YXJ0ZXI6XHJcbiAgICAgICAgICAgICAgICAgICAgcjEgPSBuZXcgUmVzdFN5bWJvbChzdGFydCwgTm90ZUR1cmF0aW9uLlF1YXJ0ZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHIyID0gbmV3IFJlc3RTeW1ib2woc3RhcnQgKyB0aW1lLlF1YXJ0ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBOb3RlRHVyYXRpb24uRWlnaHRoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgUmVzdFN5bWJvbFtdIHsgcjEsIHIyIH07XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlIE5vdGVEdXJhdGlvbi5Eb3R0ZWRFaWdodGg6XHJcbiAgICAgICAgICAgICAgICAgICAgcjEgPSBuZXcgUmVzdFN5bWJvbChzdGFydCwgTm90ZUR1cmF0aW9uLkVpZ2h0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcjIgPSBuZXcgUmVzdFN5bWJvbChzdGFydCArIHRpbWUuUXVhcnRlciAvIDIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBOb3RlRHVyYXRpb24uU2l4dGVlbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgUmVzdFN5bWJvbFtdIHsgcjEsIHIyIH07XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogVGhlIGN1cnJlbnQgY2xlZiBpcyBhbHdheXMgc2hvd24gYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RhZmYsIG9uXHJcbiAgICAgICAgICogdGhlIGxlZnQgc2lkZS4gIEhvd2V2ZXIsIHRoZSBjbGVmIGNhbiBhbHNvIGNoYW5nZSBmcm9tIG1lYXN1cmUgdG8gXHJcbiAgICAgICAgICogbWVhc3VyZS4gV2hlbiBpdCBkb2VzLCBhIENsZWYgc3ltYm9sIG11c3QgYmUgc2hvd24gdG8gaW5kaWNhdGUgdGhlIFxyXG4gICAgICAgICAqIGNoYW5nZSBpbiBjbGVmLiAgVGhpcyBmdW5jdGlvbiBhZGRzIHRoZXNlIENsZWYgY2hhbmdlIHN5bWJvbHMuXHJcbiAgICAgICAgICogVGhpcyBmdW5jdGlvbiBkb2VzIG5vdCBhZGQgdGhlIG1haW4gQ2xlZiBTeW1ib2wgdGhhdCBiZWdpbnMgZWFjaFxyXG4gICAgICAgICAqIHN0YWZmLiAgVGhhdCBpcyBkb25lIGluIHRoZSBTdGFmZigpIGNvbnRydWN0b3IuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHJpdmF0ZVxyXG4gICAgICAgIExpc3Q8TXVzaWNTeW1ib2w+IEFkZENsZWZDaGFuZ2VzKExpc3Q8TXVzaWNTeW1ib2w+IHN5bWJvbHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2xlZk1lYXN1cmVzIGNsZWZzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRpbWVTaWduYXR1cmUgdGltZSlcclxuICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICBMaXN0PE11c2ljU3ltYm9sPiByZXN1bHQgPSBuZXcgTGlzdDxNdXNpY1N5bWJvbD4oc3ltYm9scy5Db3VudCk7XHJcbiAgICAgICAgICAgIENsZWYgcHJldmNsZWYgPSBjbGVmcy5HZXRDbGVmKDApO1xyXG4gICAgICAgICAgICBmb3JlYWNoIChNdXNpY1N5bWJvbCBzeW1ib2wgaW4gc3ltYm9scylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLyogQSBCYXJTeW1ib2wgaW5kaWNhdGVzIGEgbmV3IG1lYXN1cmUgKi9cclxuICAgICAgICAgICAgICAgIGlmIChzeW1ib2wgaXMgQmFyU3ltYm9sKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIENsZWYgY2xlZiA9IGNsZWZzLkdldENsZWYoc3ltYm9sLlN0YXJ0VGltZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNsZWYgIT0gcHJldmNsZWYpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuQWRkKG5ldyBDbGVmU3ltYm9sKGNsZWYsIHN5bWJvbC5TdGFydFRpbWUgLSAxLCB0cnVlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHByZXZjbGVmID0gY2xlZjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc3VsdC5BZGQoc3ltYm9sKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qKiBOb3RlcyB3aXRoIHRoZSBzYW1lIHN0YXJ0IHRpbWVzIGluIGRpZmZlcmVudCBzdGFmZnMgc2hvdWxkIGJlXHJcbiAgICAgICAgICogdmVydGljYWxseSBhbGlnbmVkLiAgVGhlIFN5bWJvbFdpZHRocyBjbGFzcyBpcyB1c2VkIHRvIGhlbHAgXHJcbiAgICAgICAgICogdmVydGljYWxseSBhbGlnbiBzeW1ib2xzLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogRmlyc3QsIGVhY2ggdHJhY2sgc2hvdWxkIGhhdmUgYSBzeW1ib2wgZm9yIGV2ZXJ5IHN0YXJ0dGltZSB0aGF0XHJcbiAgICAgICAgICogYXBwZWFycyBpbiB0aGUgTWlkaSBGaWxlLiAgSWYgYSB0cmFjayBkb2Vzbid0IGhhdmUgYSBzeW1ib2wgZm9yIGFcclxuICAgICAgICAgKiBwYXJ0aWN1bGFyIHN0YXJ0dGltZSwgdGhlbiBhZGQgYSBcImJsYW5rXCIgc3ltYm9sIGZvciB0aGF0IHRpbWUuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBOZXh0LCBtYWtlIHN1cmUgdGhlIHN5bWJvbHMgZm9yIGVhY2ggc3RhcnQgdGltZSBhbGwgaGF2ZSB0aGUgc2FtZVxyXG4gICAgICAgICAqIHdpZHRoLCBhY3Jvc3MgYWxsIHRyYWNrcy4gIFRoZSBTeW1ib2xXaWR0aHMgY2xhc3Mgc3RvcmVzXHJcbiAgICAgICAgICogLSBUaGUgc3ltYm9sIHdpZHRoIGZvciBlYWNoIHN0YXJ0dGltZSwgZm9yIGVhY2ggdHJhY2tcclxuICAgICAgICAgKiAtIFRoZSBtYXhpbXVtIHN5bWJvbCB3aWR0aCBmb3IgYSBnaXZlbiBzdGFydHRpbWUsIGFjcm9zcyBhbGwgdHJhY2tzLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogVGhlIG1ldGhvZCBTeW1ib2xXaWR0aHMuR2V0RXh0cmFXaWR0aCgpIHJldHVybnMgdGhlIGV4dHJhIHdpZHRoXHJcbiAgICAgICAgICogbmVlZGVkIGZvciBhIHRyYWNrIHRvIG1hdGNoIHRoZSBtYXhpbXVtIHN5bWJvbCB3aWR0aCBmb3IgYSBnaXZlblxyXG4gICAgICAgICAqIHN0YXJ0dGltZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwcml2YXRlXHJcbiAgICAgICAgdm9pZCBBbGlnblN5bWJvbHMoTGlzdDxNdXNpY1N5bWJvbD5bXSBhbGxzeW1ib2xzLCBTeW1ib2xXaWR0aHMgd2lkdGhzLCBNaWRpT3B0aW9ucyBvcHRpb25zKVxyXG4gICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIHdlIHNob3cgbWVhc3VyZSBudW1iZXJzLCBpbmNyZWFzZSBiYXIgc3ltYm9sIHdpZHRoXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNob3dNZWFzdXJlcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yIChpbnQgdHJhY2sgPSAwOyB0cmFjayA8IGFsbHN5bWJvbHMuTGVuZ3RoOyB0cmFjaysrKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIExpc3Q8TXVzaWNTeW1ib2w+IHN5bWJvbHMgPSBhbGxzeW1ib2xzW3RyYWNrXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3JlYWNoIChNdXNpY1N5bWJvbCBzeW0gaW4gc3ltYm9scylcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzeW0gaXMgQmFyU3ltYm9sKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzeW0uV2lkdGggKz0gU2hlZXRNdXNpYy5Ob3RlV2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAoaW50IHRyYWNrID0gMDsgdHJhY2sgPCBhbGxzeW1ib2xzLkxlbmd0aDsgdHJhY2srKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgTGlzdDxNdXNpY1N5bWJvbD4gc3ltYm9scyA9IGFsbHN5bWJvbHNbdHJhY2tdO1xyXG4gICAgICAgICAgICAgICAgTGlzdDxNdXNpY1N5bWJvbD4gcmVzdWx0ID0gbmV3IExpc3Q8TXVzaWNTeW1ib2w+KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaW50IGkgPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8qIElmIGEgdHJhY2sgZG9lc24ndCBoYXZlIGEgc3ltYm9sIGZvciBhIHN0YXJ0dGltZSxcclxuICAgICAgICAgICAgICAgICAqIGFkZCBhIGJsYW5rIHN5bWJvbC5cclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgZm9yZWFjaCAoaW50IHN0YXJ0IGluIHdpZHRocy5TdGFydFRpbWVzKVxyXG4gICAgICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvKiBCYXJTeW1ib2xzIGFyZSBub3QgaW5jbHVkZWQgaW4gdGhlIFN5bWJvbFdpZHRocyBjYWxjdWxhdGlvbnMgKi9cclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IHN5bWJvbHMuQ291bnQgJiYgKHN5bWJvbHNbaV0gaXMgQmFyU3ltYm9sKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzeW1ib2xzW2ldLlN0YXJ0VGltZSA8PSBzdGFydClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5BZGQoc3ltYm9sc1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpIDwgc3ltYm9scy5Db3VudCAmJiBzeW1ib2xzW2ldLlN0YXJ0VGltZSA9PSBzdGFydClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IHN5bWJvbHMuQ291bnQgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN5bWJvbHNbaV0uU3RhcnRUaW1lID09IHN0YXJ0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LkFkZChzeW1ib2xzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuQWRkKG5ldyBCbGFua1N5bWJvbChzdGFydCwgMCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvKiBGb3IgZWFjaCBzdGFydHRpbWUsIGluY3JlYXNlIHRoZSBzeW1ib2wgd2lkdGggYnlcclxuICAgICAgICAgICAgICAgICAqIFN5bWJvbFdpZHRocy5HZXRFeHRyYVdpZHRoKCkuXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIGkgPSAwO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGkgPCByZXN1bHQuQ291bnQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdFtpXSBpcyBCYXJTeW1ib2wpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpbnQgc3RhcnQgPSByZXN1bHRbaV0uU3RhcnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGludCBleHRyYSA9IHdpZHRocy5HZXRFeHRyYVdpZHRoKHRyYWNrLCBzdGFydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2ldLldpZHRoICs9IGV4dHJhO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvKiBTa2lwIGFsbCByZW1haW5pbmcgc3ltYm9scyB3aXRoIHRoZSBzYW1lIHN0YXJ0dGltZS4gKi9cclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IHJlc3VsdC5Db3VudCAmJiByZXN1bHRbaV0uU3RhcnRUaW1lID09IHN0YXJ0KVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGFsbHN5bWJvbHNbdHJhY2tdID0gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyBib29sIElzQ2hvcmQoTXVzaWNTeW1ib2wgc3ltYm9sKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN5bWJvbCBpcyBDaG9yZFN5bWJvbDtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvKiogRmluZCAyLCAzLCA0LCBvciA2IGNob3JkIHN5bWJvbHMgdGhhdCBvY2N1ciBjb25zZWN1dGl2ZWx5ICh3aXRob3V0IGFueVxyXG4gICAgICAgICAqICByZXN0cyBvciBiYXJzIGluIGJldHdlZW4pLiAgVGhlcmUgY2FuIGJlIEJsYW5rU3ltYm9scyBpbiBiZXR3ZWVuLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogIFRoZSBzdGFydEluZGV4IGlzIHRoZSBpbmRleCBpbiB0aGUgc3ltYm9scyB0byBzdGFydCBsb29raW5nIGZyb20uXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAgU3RvcmUgdGhlIGluZGV4ZXMgb2YgdGhlIGNvbnNlY3V0aXZlIGNob3JkcyBpbiBjaG9yZEluZGV4ZXMuXHJcbiAgICAgICAgICogIFN0b3JlIHRoZSBob3Jpem9udGFsIGRpc3RhbmNlIChwaXhlbHMpIGJldHdlZW4gdGhlIGZpcnN0IGFuZCBsYXN0IGNob3JkLlxyXG4gICAgICAgICAqICBJZiB3ZSBmYWlsZWQgdG8gZmluZCBjb25zZWN1dGl2ZSBjaG9yZHMsIHJldHVybiBmYWxzZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyBib29sXHJcbiAgICAgICAgRmluZENvbnNlY3V0aXZlQ2hvcmRzKExpc3Q8TXVzaWNTeW1ib2w+IHN5bWJvbHMsIFRpbWVTaWduYXR1cmUgdGltZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50IHN0YXJ0SW5kZXgsIGludFtdIGNob3JkSW5kZXhlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmIGludCBob3JpekRpc3RhbmNlKVxyXG4gICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgIGludCBpID0gc3RhcnRJbmRleDtcclxuICAgICAgICAgICAgaW50IG51bUNob3JkcyA9IGNob3JkSW5kZXhlcy5MZW5ndGg7XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaG9yaXpEaXN0YW5jZSA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgLyogRmluZCB0aGUgc3RhcnRpbmcgY2hvcmQgKi9cclxuICAgICAgICAgICAgICAgIHdoaWxlIChpIDwgc3ltYm9scy5Db3VudCAtIG51bUNob3JkcylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc3ltYm9sc1tpXSBpcyBDaG9yZFN5bWJvbClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIENob3JkU3ltYm9sIGMgPSAoQ2hvcmRTeW1ib2wpc3ltYm9sc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGMuU3RlbSAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA+PSBzeW1ib2xzLkNvdW50IC0gbnVtQ2hvcmRzKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNob3JkSW5kZXhlc1swXSA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNob3JkSW5kZXhlc1swXSA9IGk7XHJcbiAgICAgICAgICAgICAgICBib29sIGZvdW5kQ2hvcmRzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGZvciAoaW50IGNob3JkSW5kZXggPSAxOyBjaG9yZEluZGV4IDwgbnVtQ2hvcmRzOyBjaG9yZEluZGV4KyspXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICAgICAgICAgIGludCByZW1haW5pbmcgPSBudW1DaG9yZHMgLSAxIC0gY2hvcmRJbmRleDtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKGkgPCBzeW1ib2xzLkNvdW50IC0gcmVtYWluaW5nKSAmJiAoc3ltYm9sc1tpXSBpcyBCbGFua1N5bWJvbCkpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBob3JpekRpc3RhbmNlICs9IHN5bWJvbHNbaV0uV2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPj0gc3ltYm9scy5Db3VudCAtIHJlbWFpbmluZylcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoc3ltYm9sc1tpXSBpcyBDaG9yZFN5bWJvbCkpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZENob3JkcyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2hvcmRJbmRleGVzW2Nob3JkSW5kZXhdID0gaTtcclxuICAgICAgICAgICAgICAgICAgICBob3JpekRpc3RhbmNlICs9IHN5bWJvbHNbaV0uV2lkdGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoZm91bmRDaG9yZHMpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLyogRWxzZSwgc3RhcnQgc2VhcmNoaW5nIGFnYWluIGZyb20gaW5kZXggaSAqL1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLyoqIENvbm5lY3QgY2hvcmRzIG9mIHRoZSBzYW1lIGR1cmF0aW9uIHdpdGggYSBob3Jpem9udGFsIGJlYW0uXHJcbiAgICAgICAgICogIG51bUNob3JkcyBpcyB0aGUgbnVtYmVyIG9mIGNob3JkcyBwZXIgYmVhbSAoMiwgMywgNCwgb3IgNikuXHJcbiAgICAgICAgICogIGlmIHN0YXJ0QmVhdCBpcyB0cnVlLCB0aGUgZmlyc3QgY2hvcmQgbXVzdCBzdGFydCBvbiBhIHF1YXJ0ZXIgbm90ZSBiZWF0LlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIHZvaWRcclxuICAgICAgICBDcmVhdGVCZWFtZWRDaG9yZHMoTGlzdDxNdXNpY1N5bWJvbD5bXSBhbGxzeW1ib2xzLCBUaW1lU2lnbmF0dXJlIHRpbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGludCBudW1DaG9yZHMsIGJvb2wgc3RhcnRCZWF0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW50W10gY2hvcmRJbmRleGVzID0gbmV3IGludFtudW1DaG9yZHNdO1xyXG4gICAgICAgICAgICBDaG9yZFN5bWJvbFtdIGNob3JkcyA9IG5ldyBDaG9yZFN5bWJvbFtudW1DaG9yZHNdO1xyXG5cclxuICAgICAgICAgICAgZm9yZWFjaCAoTGlzdDxNdXNpY1N5bWJvbD4gc3ltYm9scyBpbiBhbGxzeW1ib2xzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpbnQgc3RhcnRJbmRleCA9IDA7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAodHJ1ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpbnQgaG9yaXpEaXN0YW5jZSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9vbCBmb3VuZCA9IEZpbmRDb25zZWN1dGl2ZUNob3JkcyhzeW1ib2xzLCB0aW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRJbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNob3JkSW5kZXhlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZiBob3JpekRpc3RhbmNlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZvdW5kKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgbnVtQ2hvcmRzOyBpKyspXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaG9yZHNbaV0gPSAoQ2hvcmRTeW1ib2wpc3ltYm9sc1tjaG9yZEluZGV4ZXNbaV1dO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKENob3JkU3ltYm9sLkNhbkNyZWF0ZUJlYW0oY2hvcmRzLCB0aW1lLCBzdGFydEJlYXQpKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgQ2hvcmRTeW1ib2wuQ3JlYXRlQmVhbShjaG9yZHMsIGhvcml6RGlzdGFuY2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydEluZGV4ID0gY2hvcmRJbmRleGVzW251bUNob3JkcyAtIDFdICsgMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRJbmRleCA9IGNob3JkSW5kZXhlc1swXSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvKiBXaGF0IGlzIHRoZSB2YWx1ZSBvZiBzdGFydEluZGV4IGhlcmU/XHJcbiAgICAgICAgICAgICAgICAgICAgICogSWYgd2UgY3JlYXRlZCBhIGJlYW0sIHdlIHN0YXJ0IGFmdGVyIHRoZSBsYXN0IGNob3JkLlxyXG4gICAgICAgICAgICAgICAgICAgICAqIElmIHdlIGZhaWxlZCB0byBjcmVhdGUgYSBiZWFtLCB3ZSBzdGFydCBhZnRlciB0aGUgZmlyc3QgY2hvcmQuXHJcbiAgICAgICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvKiogQ29ubmVjdCBjaG9yZHMgb2YgdGhlIHNhbWUgZHVyYXRpb24gd2l0aCBhIGhvcml6b250YWwgYmVhbS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqICBXZSBjcmVhdGUgYmVhbXMgaW4gdGhlIGZvbGxvd2luZyBvcmRlcjpcclxuICAgICAgICAgKiAgLSA2IGNvbm5lY3RlZCA4dGggbm90ZSBjaG9yZHMsIGluIDMvNCwgNi84LCBvciA2LzQgdGltZVxyXG4gICAgICAgICAqICAtIFRyaXBsZXRzIHRoYXQgc3RhcnQgb24gcXVhcnRlciBub3RlIGJlYXRzXHJcbiAgICAgICAgICogIC0gMyBjb25uZWN0ZWQgY2hvcmRzIHRoYXQgc3RhcnQgb24gcXVhcnRlciBub3RlIGJlYXRzICgxMi84IHRpbWUgb25seSlcclxuICAgICAgICAgKiAgLSA0IGNvbm5lY3RlZCBjaG9yZHMgdGhhdCBzdGFydCBvbiBxdWFydGVyIG5vdGUgYmVhdHMgKDQvNCBvciAyLzQgdGltZSBvbmx5KVxyXG4gICAgICAgICAqICAtIDIgY29ubmVjdGVkIGNob3JkcyB0aGF0IHN0YXJ0IG9uIHF1YXJ0ZXIgbm90ZSBiZWF0c1xyXG4gICAgICAgICAqICAtIDIgY29ubmVjdGVkIGNob3JkcyB0aGF0IHN0YXJ0IG9uIGFueSBiZWF0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgdm9pZFxyXG4gICAgICAgIENyZWF0ZUFsbEJlYW1lZENob3JkcyhMaXN0PE11c2ljU3ltYm9sPltdIGFsbHN5bWJvbHMsIFRpbWVTaWduYXR1cmUgdGltZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICgodGltZS5OdW1lcmF0b3IgPT0gMyAmJiB0aW1lLkRlbm9taW5hdG9yID09IDQpIHx8XHJcbiAgICAgICAgICAgICAgICAodGltZS5OdW1lcmF0b3IgPT0gNiAmJiB0aW1lLkRlbm9taW5hdG9yID09IDgpIHx8XHJcbiAgICAgICAgICAgICAgICAodGltZS5OdW1lcmF0b3IgPT0gNiAmJiB0aW1lLkRlbm9taW5hdG9yID09IDQpKVxyXG4gICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgQ3JlYXRlQmVhbWVkQ2hvcmRzKGFsbHN5bWJvbHMsIHRpbWUsIDYsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIENyZWF0ZUJlYW1lZENob3JkcyhhbGxzeW1ib2xzLCB0aW1lLCAzLCB0cnVlKTtcclxuICAgICAgICAgICAgQ3JlYXRlQmVhbWVkQ2hvcmRzKGFsbHN5bWJvbHMsIHRpbWUsIDQsIHRydWUpO1xyXG4gICAgICAgICAgICBDcmVhdGVCZWFtZWRDaG9yZHMoYWxsc3ltYm9scywgdGltZSwgMiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIENyZWF0ZUJlYW1lZENob3JkcyhhbGxzeW1ib2xzLCB0aW1lLCAyLCBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogR2V0IHRoZSB3aWR0aCAoaW4gcGl4ZWxzKSBuZWVkZWQgdG8gZGlzcGxheSB0aGUga2V5IHNpZ25hdHVyZSAqL1xyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgaW50XHJcbiAgICAgICAgS2V5U2lnbmF0dXJlV2lkdGgoS2V5U2lnbmF0dXJlIGtleSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIENsZWZTeW1ib2wgY2xlZnN5bSA9IG5ldyBDbGVmU3ltYm9sKENsZWYuVHJlYmxlLCAwLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIGludCByZXN1bHQgPSBjbGVmc3ltLk1pbldpZHRoO1xyXG4gICAgICAgICAgICBBY2NpZFN5bWJvbFtdIGtleXMgPSBrZXkuR2V0U3ltYm9scyhDbGVmLlRyZWJsZSk7XHJcbiAgICAgICAgICAgIGZvcmVhY2ggKEFjY2lkU3ltYm9sIHN5bWJvbCBpbiBrZXlzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gc3ltYm9sLk1pbldpZHRoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQgKyBTaGVldE11c2ljLkxlZnRNYXJnaW4gKyA1O1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qKiBHaXZlbiBNdXNpY1N5bWJvbHMgZm9yIGEgdHJhY2ssIGNyZWF0ZSB0aGUgc3RhZmZzIGZvciB0aGF0IHRyYWNrLlxyXG4gICAgICAgICAqICBFYWNoIFN0YWZmIGhhcyBhIG1heG1pbXVtIHdpZHRoIG9mIFBhZ2VXaWR0aCAoODAwIHBpeGVscykuXHJcbiAgICAgICAgICogIEFsc28sIG1lYXN1cmVzIHNob3VsZCBub3Qgc3BhbiBtdWx0aXBsZSBTdGFmZnMuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHJpdmF0ZSBMaXN0PFN0YWZmPlxyXG4gICAgICAgIENyZWF0ZVN0YWZmc0ZvclRyYWNrKExpc3Q8TXVzaWNTeW1ib2w+IHN5bWJvbHMsIGludCBtZWFzdXJlbGVuLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIEtleVNpZ25hdHVyZSBrZXksIE1pZGlPcHRpb25zIG9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50IHRyYWNrLCBpbnQgdG90YWx0cmFja3MpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnQga2V5c2lnV2lkdGggPSBLZXlTaWduYXR1cmVXaWR0aChrZXkpO1xyXG4gICAgICAgICAgICBpbnQgc3RhcnRpbmRleCA9IDA7XHJcbiAgICAgICAgICAgIExpc3Q8U3RhZmY+IHRoZXN0YWZmcyA9IG5ldyBMaXN0PFN0YWZmPihzeW1ib2xzLkNvdW50IC8gNTApO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKHN0YXJ0aW5kZXggPCBzeW1ib2xzLkNvdW50KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvKiBzdGFydGluZGV4IGlzIHRoZSBpbmRleCBvZiB0aGUgZmlyc3Qgc3ltYm9sIGluIHRoZSBzdGFmZi5cclxuICAgICAgICAgICAgICAgICAqIGVuZGluZGV4IGlzIHRoZSBpbmRleCBvZiB0aGUgbGFzdCBzeW1ib2wgaW4gdGhlIHN0YWZmLlxyXG4gICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICBpbnQgZW5kaW5kZXggPSBzdGFydGluZGV4O1xyXG4gICAgICAgICAgICAgICAgaW50IHdpZHRoID0ga2V5c2lnV2lkdGg7XHJcbiAgICAgICAgICAgICAgICBpbnQgbWF4d2lkdGg7XHJcblxyXG4gICAgICAgICAgICAgICAgLyogSWYgd2UncmUgc2Nyb2xsaW5nIHZlcnRpY2FsbHksIHRoZSBtYXhpbXVtIHdpZHRoIGlzIFBhZ2VXaWR0aC4gKi9cclxuICAgICAgICAgICAgICAgIGlmIChzY3JvbGxWZXJ0KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1heHdpZHRoID0gU2hlZXRNdXNpYy5QYWdlV2lkdGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWF4d2lkdGggPSAyMDAwMDAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChlbmRpbmRleCA8IHN5bWJvbHMuQ291bnQgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCArIHN5bWJvbHNbZW5kaW5kZXhdLldpZHRoIDwgbWF4d2lkdGgpXHJcbiAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoICs9IHN5bWJvbHNbZW5kaW5kZXhdLldpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZGluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbmRpbmRleC0tO1xyXG5cclxuICAgICAgICAgICAgICAgIC8qIFRoZXJlJ3MgMyBwb3NzaWJpbGl0aWVzIGF0IHRoaXMgcG9pbnQ6XHJcbiAgICAgICAgICAgICAgICAgKiAxLiBXZSBoYXZlIGFsbCB0aGUgc3ltYm9scyBpbiB0aGUgdHJhY2suXHJcbiAgICAgICAgICAgICAgICAgKiAgICBUaGUgZW5kaW5kZXggc3RheXMgdGhlIHNhbWUuXHJcbiAgICAgICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgICAgICogMi4gV2UgaGF2ZSBzeW1ib2xzIGZvciBsZXNzIHRoYW4gb25lIG1lYXN1cmUuXHJcbiAgICAgICAgICAgICAgICAgKiAgICBUaGUgZW5kaW5kZXggc3RheXMgdGhlIHNhbWUuXHJcbiAgICAgICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgICAgICogMy4gV2UgaGF2ZSBzeW1ib2xzIGZvciAxIG9yIG1vcmUgbWVhc3VyZXMuXHJcbiAgICAgICAgICAgICAgICAgKiAgICBTaW5jZSBtZWFzdXJlcyBjYW5ub3Qgc3BhbiBtdWx0aXBsZSBzdGFmZnMsIHdlIG11c3RcclxuICAgICAgICAgICAgICAgICAqICAgIG1ha2Ugc3VyZSBlbmRpbmRleCBkb2VzIG5vdCBvY2N1ciBpbiB0aGUgbWlkZGxlIG9mIGFcclxuICAgICAgICAgICAgICAgICAqICAgIG1lYXN1cmUuICBXZSBjb3VudCBiYWNrd2FyZHMgdW50aWwgd2UgY29tZSB0byB0aGUgZW5kXHJcbiAgICAgICAgICAgICAgICAgKiAgICBvZiBhIG1lYXN1cmUuXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZW5kaW5kZXggPT0gc3ltYm9scy5Db3VudCAtIDEpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgLyogZW5kaW5kZXggc3RheXMgdGhlIHNhbWUgKi9cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN5bWJvbHNbc3RhcnRpbmRleF0uU3RhcnRUaW1lIC8gbWVhc3VyZWxlbiA9PVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgc3ltYm9sc1tlbmRpbmRleF0uU3RhcnRUaW1lIC8gbWVhc3VyZWxlbilcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAvKiBlbmRpbmRleCBzdGF5cyB0aGUgc2FtZSAqL1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGludCBlbmRtZWFzdXJlID0gc3ltYm9sc1tlbmRpbmRleCArIDFdLlN0YXJ0VGltZSAvIG1lYXN1cmVsZW47XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHN5bWJvbHNbZW5kaW5kZXhdLlN0YXJ0VGltZSAvIG1lYXN1cmVsZW4gPT1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kbWVhc3VyZSlcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZGluZGV4LS07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaW50IHJhbmdlID0gZW5kaW5kZXggKyAxIC0gc3RhcnRpbmRleDtcclxuICAgICAgICAgICAgICAgIGlmIChzY3JvbGxWZXJ0KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoID0gU2hlZXRNdXNpYy5QYWdlV2lkdGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBTdGFmZiBzdGFmZiA9IG5ldyBTdGFmZihzeW1ib2xzLkdldFJhbmdlKHN0YXJ0aW5kZXgsIHJhbmdlKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSwgb3B0aW9ucywgdHJhY2ssIHRvdGFsdHJhY2tzKTtcclxuICAgICAgICAgICAgICAgIHRoZXN0YWZmcy5BZGQoc3RhZmYpO1xyXG4gICAgICAgICAgICAgICAgc3RhcnRpbmRleCA9IGVuZGluZGV4ICsgMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhlc3RhZmZzO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qKiBHaXZlbiBhbGwgdGhlIE11c2ljU3ltYm9scyBmb3IgZXZlcnkgdHJhY2ssIGNyZWF0ZSB0aGUgc3RhZmZzXHJcbiAgICAgICAgICogZm9yIHRoZSBzaGVldCBtdXNpYy4gIFRoZXJlIGFyZSB0d28gcGFydHMgdG8gdGhpczpcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIC0gR2V0IHRoZSBsaXN0IG9mIHN0YWZmcyBmb3IgZWFjaCB0cmFjay5cclxuICAgICAgICAgKiAgIFRoZSBzdGFmZnMgd2lsbCBiZSBzdG9yZWQgaW4gdHJhY2tzdGFmZnMgYXM6XHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAgIHRyYWNrc3RhZmZzWzBdID0geyBTdGFmZjAsIFN0YWZmMSwgU3RhZmYyLCAuLi4gfSBmb3IgdHJhY2sgMFxyXG4gICAgICAgICAqICAgdHJhY2tzdGFmZnNbMV0gPSB7IFN0YWZmMCwgU3RhZmYxLCBTdGFmZjIsIC4uLiB9IGZvciB0cmFjayAxXHJcbiAgICAgICAgICogICB0cmFja3N0YWZmc1syXSA9IHsgU3RhZmYwLCBTdGFmZjEsIFN0YWZmMiwgLi4uIH0gZm9yIHRyYWNrIDJcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIC0gU3RvcmUgdGhlIFN0YWZmcyBpbiB0aGUgc3RhZmZzIGxpc3QsIGJ1dCBpbnRlcmxlYXZlIHRoZVxyXG4gICAgICAgICAqICAgdHJhY2tzIGFzIGZvbGxvd3M6XHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAgIHN0YWZmcyA9IHsgU3RhZmYwIGZvciB0cmFjayAwLCBTdGFmZjAgZm9yIHRyYWNrMSwgU3RhZmYwIGZvciB0cmFjazIsXHJcbiAgICAgICAgICogICAgICAgICAgICAgIFN0YWZmMSBmb3IgdHJhY2sgMCwgU3RhZmYxIGZvciB0cmFjazEsIFN0YWZmMSBmb3IgdHJhY2syLFxyXG4gICAgICAgICAqICAgICAgICAgICAgICBTdGFmZjIgZm9yIHRyYWNrIDAsIFN0YWZmMiBmb3IgdHJhY2sxLCBTdGFmZjIgZm9yIHRyYWNrMixcclxuICAgICAgICAgKiAgICAgICAgICAgICAgLi4uIH0gXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHJpdmF0ZSBMaXN0PFN0YWZmPlxyXG4gICAgICAgIENyZWF0ZVN0YWZmcyhMaXN0PE11c2ljU3ltYm9sPltdIGFsbHN5bWJvbHMsIEtleVNpZ25hdHVyZSBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgIE1pZGlPcHRpb25zIG9wdGlvbnMsIGludCBtZWFzdXJlbGVuKVxyXG4gICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgIExpc3Q8U3RhZmY+W10gdHJhY2tzdGFmZnMgPSBuZXcgTGlzdDxTdGFmZj5bYWxsc3ltYm9scy5MZW5ndGhdO1xyXG4gICAgICAgICAgICBpbnQgdG90YWx0cmFja3MgPSB0cmFja3N0YWZmcy5MZW5ndGg7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGludCB0cmFjayA9IDA7IHRyYWNrIDwgdG90YWx0cmFja3M7IHRyYWNrKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIExpc3Q8TXVzaWNTeW1ib2w+IHN5bWJvbHMgPSBhbGxzeW1ib2xzW3RyYWNrXTtcclxuICAgICAgICAgICAgICAgIHRyYWNrc3RhZmZzW3RyYWNrXSA9IENyZWF0ZVN0YWZmc0ZvclRyYWNrKHN5bWJvbHMsIG1lYXN1cmVsZW4sIGtleSwgb3B0aW9ucywgdHJhY2ssIHRvdGFsdHJhY2tzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLyogVXBkYXRlIHRoZSBFbmRUaW1lIG9mIGVhY2ggU3RhZmYuIEVuZFRpbWUgaXMgdXNlZCBmb3IgcGxheWJhY2sgKi9cclxuICAgICAgICAgICAgZm9yZWFjaCAoTGlzdDxTdGFmZj4gbGlzdCBpbiB0cmFja3N0YWZmcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCBsaXN0LkNvdW50IC0gMTsgaSsrKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RbaV0uRW5kVGltZSA9IGxpc3RbaSArIDFdLlN0YXJ0VGltZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLyogSW50ZXJsZWF2ZSB0aGUgc3RhZmZzIG9mIGVhY2ggdHJhY2sgaW50byB0aGUgcmVzdWx0IGFycmF5LiAqL1xyXG4gICAgICAgICAgICBpbnQgbWF4c3RhZmZzID0gMDtcclxuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCB0cmFja3N0YWZmcy5MZW5ndGg7IGkrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKG1heHN0YWZmcyA8IHRyYWNrc3RhZmZzW2ldLkNvdW50KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1heHN0YWZmcyA9IHRyYWNrc3RhZmZzW2ldLkNvdW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIExpc3Q8U3RhZmY+IHJlc3VsdCA9IG5ldyBMaXN0PFN0YWZmPihtYXhzdGFmZnMgKiB0cmFja3N0YWZmcy5MZW5ndGgpO1xyXG4gICAgICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IG1heHN0YWZmczsgaSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3JlYWNoIChMaXN0PFN0YWZmPiBsaXN0IGluIHRyYWNrc3RhZmZzKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpIDwgbGlzdC5Db3VudClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5BZGQobGlzdFtpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogR2V0IHRoZSBseXJpY3MgZm9yIGVhY2ggdHJhY2sgKi9cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyBMaXN0PEx5cmljU3ltYm9sPltdXHJcbiAgICAgICAgR2V0THlyaWNzKExpc3Q8TWlkaVRyYWNrPiB0cmFja3MpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBib29sIGhhc0x5cmljcyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBMaXN0PEx5cmljU3ltYm9sPltdIHJlc3VsdCA9IG5ldyBMaXN0PEx5cmljU3ltYm9sPlt0cmFja3MuQ291bnRdO1xyXG4gICAgICAgICAgICBmb3IgKGludCB0cmFja251bSA9IDA7IHRyYWNrbnVtIDwgdHJhY2tzLkNvdW50OyB0cmFja251bSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBNaWRpVHJhY2sgdHJhY2sgPSB0cmFja3NbdHJhY2tudW1dO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRyYWNrLkx5cmljcyA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaGFzTHlyaWNzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdFt0cmFja251bV0gPSBuZXcgTGlzdDxMeXJpY1N5bWJvbD4oKTtcclxuICAgICAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlFdmVudCBldiBpbiB0cmFjay5MeXJpY3MpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgU3RyaW5nIHRleHQgPSBVVEY4RW5jb2RpbmcuVVRGOC5HZXRTdHJpbmcoZXYuVmFsdWUsIDAsIGV2LlZhbHVlLkxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgTHlyaWNTeW1ib2wgc3ltID0gbmV3IEx5cmljU3ltYm9sKGV2LlN0YXJ0VGltZSwgdGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W3RyYWNrbnVtXS5BZGQoc3ltKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIWhhc0x5cmljcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogQWRkIHRoZSBseXJpYyBzeW1ib2xzIHRvIHRoZSBjb3JyZXNwb25kaW5nIHN0YWZmcyAqL1xyXG4gICAgICAgIHN0YXRpYyB2b2lkXHJcbiAgICAgICAgQWRkTHlyaWNzVG9TdGFmZnMoTGlzdDxTdGFmZj4gc3RhZmZzLCBMaXN0PEx5cmljU3ltYm9sPltdIHRyYWNrbHlyaWNzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yZWFjaCAoU3RhZmYgc3RhZmYgaW4gc3RhZmZzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBMaXN0PEx5cmljU3ltYm9sPiBseXJpY3MgPSB0cmFja2x5cmljc1tzdGFmZi5UcmFja107XHJcbiAgICAgICAgICAgICAgICBzdGFmZi5BZGRMeXJpY3MobHlyaWNzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qKiBTZXQgdGhlIHpvb20gbGV2ZWwgdG8gZGlzcGxheSBhdCAoMS4wID09IDEwMCUpLlxyXG4gICAgICAgICAqIFJlY2FsY3VsYXRlIHRoZSBTaGVldE11c2ljIHdpZHRoIGFuZCBoZWlnaHQgYmFzZWQgb24gdGhlXHJcbiAgICAgICAgICogem9vbSBsZXZlbC4gIFRoZW4gcmVkcmF3IHRoZSBTaGVldE11c2ljLiBcclxuICAgICAgICAgKi9cclxuICAgICAgICBwdWJsaWMgdm9pZCBTZXRab29tKGZsb2F0IHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgem9vbSA9IHZhbHVlO1xyXG4gICAgICAgICAgICBmbG9hdCB3aWR0aCA9IDA7XHJcbiAgICAgICAgICAgIGZsb2F0IGhlaWdodCA9IDA7XHJcbiAgICAgICAgICAgIGZvcmVhY2ggKFN0YWZmIHN0YWZmIGluIHN0YWZmcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgd2lkdGggPSBNYXRoLk1heCh3aWR0aCwgc3RhZmYuV2lkdGggKiB6b29tKTtcclxuICAgICAgICAgICAgICAgIGhlaWdodCArPSAoc3RhZmYuSGVpZ2h0ICogem9vbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgV2lkdGggPSAoaW50KSh3aWR0aCArIDIpO1xyXG4gICAgICAgICAgICBIZWlnaHQgPSAoKGludCloZWlnaHQpICsgTGVmdE1hcmdpbjtcclxuICAgICAgICAgICAgdGhpcy5JbnZhbGlkYXRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogQ2hhbmdlIHRoZSBub3RlIGNvbG9ycyBmb3IgdGhlIHNoZWV0IG11c2ljLCBhbmQgcmVkcmF3LiAqL1xyXG4gICAgICAgIHByaXZhdGUgdm9pZCBTZXRDb2xvcnMoQ29sb3JbXSBuZXdjb2xvcnMsIENvbG9yIG5ld3NoYWRlLCBDb2xvciBuZXdzaGFkZTIpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoTm90ZUNvbG9ycyA9PSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBOb3RlQ29sb3JzID0gbmV3IENvbG9yWzEyXTtcclxuICAgICAgICAgICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgMTI7IGkrKylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBOb3RlQ29sb3JzW2ldID0gQ29sb3IuQmxhY2s7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG5ld2NvbG9ycyAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IDEyOyBpKyspXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgTm90ZUNvbG9yc1tpXSA9IG5ld2NvbG9yc1tpXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgMTI7IGkrKylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBOb3RlQ29sb3JzW2ldID0gQ29sb3IuQmxhY2s7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHNoYWRlQnJ1c2ggIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2hhZGVCcnVzaC5EaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICBzaGFkZTJCcnVzaC5EaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2hhZGVCcnVzaCA9IG5ldyBTb2xpZEJydXNoKG5ld3NoYWRlKTtcclxuICAgICAgICAgICAgc2hhZGUyQnJ1c2ggPSBuZXcgU29saWRCcnVzaChuZXdzaGFkZTIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEdldCB0aGUgY29sb3IgZm9yIGEgZ2l2ZW4gbm90ZSBudW1iZXIgKi9cclxuICAgICAgICBwdWJsaWMgQ29sb3IgTm90ZUNvbG9yKGludCBudW1iZXIpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gTm90ZUNvbG9yc1tOb3RlU2NhbGUuRnJvbU51bWJlcihudW1iZXIpXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBHZXQgdGhlIHNoYWRlIGJydXNoICovXHJcbiAgICAgICAgcHVibGljIEJydXNoIFNoYWRlQnJ1c2hcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdldCB7IHJldHVybiBzaGFkZUJydXNoOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogR2V0IHRoZSBzaGFkZTIgYnJ1c2ggKi9cclxuICAgICAgICBwdWJsaWMgQnJ1c2ggU2hhZGUyQnJ1c2hcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdldCB7IHJldHVybiBzaGFkZTJCcnVzaDsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEdldCB3aGV0aGVyIHRvIHNob3cgbm90ZSBsZXR0ZXJzIG9yIG5vdCAqL1xyXG4gICAgICAgIHB1YmxpYyBpbnQgU2hvd05vdGVMZXR0ZXJzXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBnZXQgeyByZXR1cm4gc2hvd05vdGVMZXR0ZXJzOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogR2V0IHRoZSBtYWluIGtleSBzaWduYXR1cmUgKi9cclxuICAgICAgICBwdWJsaWMgS2V5U2lnbmF0dXJlIE1haW5LZXlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdldCB7IHJldHVybiBtYWlua2V5OyB9XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLyoqIFNldCB0aGUgc2l6ZSBvZiB0aGUgbm90ZXMsIGxhcmdlIG9yIHNtYWxsLiAgU21hbGxlciBub3RlcyBtZWFuc1xyXG4gICAgICAgICAqIG1vcmUgbm90ZXMgcGVyIHN0YWZmLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZCBTZXROb3RlU2l6ZShib29sIGxhcmdlbm90ZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAobGFyZ2Vub3RlcylcclxuICAgICAgICAgICAgICAgIExpbmVTcGFjZSA9IDc7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIExpbmVTcGFjZSA9IDU7XHJcblxyXG4gICAgICAgICAgICBTdGFmZkhlaWdodCA9IExpbmVTcGFjZSAqIDQgKyBMaW5lV2lkdGggKiA1O1xyXG4gICAgICAgICAgICBOb3RlSGVpZ2h0ID0gTGluZVNwYWNlICsgTGluZVdpZHRoO1xyXG4gICAgICAgICAgICBOb3RlV2lkdGggPSAzICogTGluZVNwYWNlIC8gMjtcclxuICAgICAgICAgICAgTGV0dGVyRm9udCA9IG5ldyBGb250KFwiQXJpYWxcIiwgOCwgRm9udFN0eWxlLlJlZ3VsYXIpO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qKiBEcmF3IHRoZSBTaGVldE11c2ljLlxyXG4gICAgICAgICAqIFNjYWxlIHRoZSBncmFwaGljcyBieSB0aGUgY3VycmVudCB6b29tIGZhY3Rvci5cclxuICAgICAgICAgKiBHZXQgdGhlIHZlcnRpY2FsIHN0YXJ0IGFuZCBlbmQgcG9pbnRzIG9mIHRoZSBjbGlwIGFyZWEuXHJcbiAgICAgICAgICogT25seSBkcmF3IFN0YWZmcyB3aGljaCBsaWUgaW5zaWRlIHRoZSBjbGlwIGFyZWEuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHJvdGVjdGVkIC8qb3ZlcnJpZGUqLyB2b2lkIE9uUGFpbnQoUGFpbnRFdmVudEFyZ3MgZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFJlY3RhbmdsZSBjbGlwID1cclxuICAgICAgICAgICAgICBuZXcgUmVjdGFuZ2xlKChpbnQpKGUuQ2xpcFJlY3RhbmdsZS5YIC8gem9vbSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW50KShlLkNsaXBSZWN0YW5nbGUuWSAvIHpvb20pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGludCkoZS5DbGlwUmVjdGFuZ2xlLldpZHRoIC8gem9vbSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW50KShlLkNsaXBSZWN0YW5nbGUuSGVpZ2h0IC8gem9vbSkpO1xyXG5cclxuICAgICAgICAgICAgR3JhcGhpY3MgZyA9IGUuR3JhcGhpY3MoKTtcclxuICAgICAgICAgICAgZy5TY2FsZVRyYW5zZm9ybSh6b29tLCB6b29tKTtcclxuICAgICAgICAgICAgLyogZy5QYWdlU2NhbGUgPSB6b29tOyAqL1xyXG4gICAgICAgICAgICBnLlNtb290aGluZ01vZGUgPSBTbW9vdGhpbmdNb2RlLkFudGlBbGlhcztcclxuICAgICAgICAgICAgaW50IHlwb3MgPSAwO1xyXG4gICAgICAgICAgICBmb3JlYWNoIChTdGFmZiBzdGFmZiBpbiBzdGFmZnMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICgoeXBvcyArIHN0YWZmLkhlaWdodCA8IGNsaXAuWSkgfHwgKHlwb3MgPiBjbGlwLlkgKyBjbGlwLkhlaWdodCkpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgLyogU3RhZmYgaXMgbm90IGluIHRoZSBjbGlwLCBkb24ndCBuZWVkIHRvIGRyYXcgaXQgKi9cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgwLCB5cG9zKTtcclxuICAgICAgICAgICAgICAgICAgICBzdGFmZi5EcmF3KGcsIGNsaXAsIHBlbiwgU2VsZWN0aW9uU3RhcnRQdWxzZSwgU2VsZWN0aW9uRW5kUHVsc2UsIGRlc2VsZWN0ZWRTaGFkZUJydXNoKTtcclxuICAgICAgICAgICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgwLCAteXBvcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgeXBvcyArPSBzdGFmZi5IZWlnaHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZy5TY2FsZVRyYW5zZm9ybSgxLjBmIC8gem9vbSwgMS4wZiAvIHpvb20pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIFdyaXRlIHRoZSBNSURJIGZpbGVuYW1lIGF0IHRoZSB0b3Agb2YgdGhlIHBhZ2UgKi9cclxuICAgICAgICBwcml2YXRlIHZvaWQgRHJhd1RpdGxlKEdyYXBoaWNzIGcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnQgbGVmdG1hcmdpbiA9IDIwO1xyXG4gICAgICAgICAgICBpbnQgdG9wbWFyZ2luID0gMjA7XHJcbiAgICAgICAgICAgIHN0cmluZyB0aXRsZSA9IFBhdGguR2V0RmlsZU5hbWUoZmlsZW5hbWUpO1xyXG4gICAgICAgICAgICB0aXRsZSA9IHRpdGxlLlJlcGxhY2UoXCIubWlkXCIsIFwiXCIpLlJlcGxhY2UoXCJfXCIsIFwiIFwiKTtcclxuICAgICAgICAgICAgRm9udCBmb250ID0gbmV3IEZvbnQoXCJBcmlhbFwiLCAxMCwgRm9udFN0eWxlLkJvbGQpO1xyXG4gICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybShsZWZ0bWFyZ2luLCB0b3BtYXJnaW4pO1xyXG4gICAgICAgICAgICBnLkRyYXdTdHJpbmcodGl0bGUsIGZvbnQsIEJydXNoZXMuQmxhY2ssIDAsIDApO1xyXG4gICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgtbGVmdG1hcmdpbiwgLXRvcG1hcmdpbik7XHJcbiAgICAgICAgICAgIGZvbnQuRGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmV0dXJuIHRoZSBudW1iZXIgb2YgcGFnZXMgbmVlZGVkIHRvIHByaW50IHRoaXMgc2hlZXQgbXVzaWMuXHJcbiAgICAgICAgICogQSBzdGFmZiBzaG91bGQgZml0IHdpdGhpbiBhIHNpbmdsZSBwYWdlLCBub3QgYmUgc3BsaXQgYWNyb3NzIHR3byBwYWdlcy5cclxuICAgICAgICAgKiBJZiB0aGUgc2hlZXQgbXVzaWMgaGFzIGV4YWN0bHkgMiB0cmFja3MsIHRoZW4gdHdvIHN0YWZmcyBzaG91bGRcclxuICAgICAgICAgKiBmaXQgd2l0aGluIGEgc2luZ2xlIHBhZ2UsIGFuZCBub3QgYmUgc3BsaXQgYWNyb3NzIHR3byBwYWdlcy5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwdWJsaWMgaW50IEdldFRvdGFsUGFnZXMoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW50IG51bSA9IDE7XHJcbiAgICAgICAgICAgIGludCBjdXJyaGVpZ2h0ID0gVGl0bGVIZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAobnVtdHJhY2tzID09IDIgJiYgKHN0YWZmcy5Db3VudCAlIDIpID09IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgc3RhZmZzLkNvdW50OyBpICs9IDIpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW50IGhlaWdodHMgPSBzdGFmZnNbaV0uSGVpZ2h0ICsgc3RhZmZzW2kgKyAxXS5IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJoZWlnaHQgKyBoZWlnaHRzID4gUGFnZUhlaWdodClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bSsrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyaGVpZ2h0ID0gaGVpZ2h0cztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmhlaWdodCArPSBoZWlnaHRzO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvcmVhY2ggKFN0YWZmIHN0YWZmIGluIHN0YWZmcylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmhlaWdodCArIHN0YWZmLkhlaWdodCA+IFBhZ2VIZWlnaHQpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBudW0rKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmhlaWdodCA9IHN0YWZmLkhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmhlaWdodCArPSBzdGFmZi5IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBudW07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogU2hhZGUgYWxsIHRoZSBjaG9yZHMgcGxheWVkIGF0IHRoZSBnaXZlbiBwdWxzZSB0aW1lLlxyXG4gICAgICAgICAqICBMb29wIHRocm91Z2ggYWxsIHRoZSBzdGFmZnMgYW5kIGNhbGwgc3RhZmYuU2hhZGUoKS5cclxuICAgICAgICAgKiAgSWYgc2Nyb2xsR3JhZHVhbGx5IGlzIHRydWUsIHNjcm9sbCBncmFkdWFsbHkgKHNtb290aCBzY3JvbGxpbmcpXHJcbiAgICAgICAgICogIHRvIHRoZSBzaGFkZWQgbm90ZXMuIFJldHVybnMgdGhlIG1pbmltdW0geS1jb29yZGluYXRlIG9mIHRoZSBzaGFkZWQgY2hvcmQgKGZvciBzY3JvbGxpbmcgcHVycG9zZXMpXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcHVibGljIFJlY3RhbmdsZSBTaGFkZU5vdGVzKGludCBjdXJyZW50UHVsc2VUaW1lLCBpbnQgcHJldlB1bHNlVGltZSwgYm9vbCBzY3JvbGxHcmFkdWFsbHksIFNvbGlkQnJ1c2ggYnJ1c2gpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBHcmFwaGljcyBnID0gQ3JlYXRlR3JhcGhpY3MoXCJzaGFkZU5vdGVzXCIpO1xyXG4gICAgICAgICAgICBnLlNtb290aGluZ01vZGUgPSBTbW9vdGhpbmdNb2RlLkFudGlBbGlhcztcclxuICAgICAgICAgICAgZy5TY2FsZVRyYW5zZm9ybSh6b29tLCB6b29tKTtcclxuICAgICAgICAgICAgaW50IHlwb3MgPSAwO1xyXG5cclxuICAgICAgICAgICAgaW50IHhfc2hhZGUgPSAwO1xyXG4gICAgICAgICAgICBpbnQgeV9zaGFkZSA9IDA7XHJcbiAgICAgICAgICAgIGludCB3aWR0aCA9IDA7XHJcbiAgICAgICAgICAgIGludCBoZWlnaHQgPSAwO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yZWFjaCAoU3RhZmYgc3RhZmYgaW4gc3RhZmZzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgwLCB5cG9zKTtcclxuICAgICAgICAgICAgICAgIHdpZHRoICs9IHN0YWZmLlNoYWRlTm90ZXMoZywgYnJ1c2gsIHBlbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFB1bHNlVGltZSwgcHJldlB1bHNlVGltZSwgcmVmIHhfc2hhZGUpO1xyXG4gICAgICAgICAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oMCwgLXlwb3MpO1xyXG4gICAgICAgICAgICAgICAgeXBvcyArPSBzdGFmZi5IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFB1bHNlVGltZSA+PSBzdGFmZi5FbmRUaW1lKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHlfc2hhZGUgKz0gc3RhZmYuSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRQdWxzZVRpbWUgPj0gc3RhZmYuU3RhcnRUaW1lICYmIGN1cnJlbnRQdWxzZVRpbWUgPD0gc3RhZmYuRW5kVGltZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgKz0gc3RhZmYuSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGcuU2NhbGVUcmFuc2Zvcm0oMS4wZiAvIHpvb20sIDEuMGYgLyB6b29tKTtcclxuICAgICAgICAgICAgZy5EaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIHhfc2hhZGUgPSAoaW50KSh4X3NoYWRlICogem9vbSk7XHJcbiAgICAgICAgICAgIHlfc2hhZGUgLT0gTm90ZUhlaWdodDtcclxuICAgICAgICAgICAgeV9zaGFkZSA9IChpbnQpKHlfc2hhZGUgKiB6b29tKTtcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnRQdWxzZVRpbWUgPj0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgU2Nyb2xsVG9TaGFkZWROb3Rlcyh4X3NoYWRlLCB5X3NoYWRlLCBzY3JvbGxHcmFkdWFsbHkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVjdGFuZ2xlKHhfc2hhZGUsIHlfc2hhZGUsIHdpZHRoLCAoaW50KSgoaGVpZ2h0KzgpICogem9vbSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIFNjcm9sbCB0aGUgc2hlZXQgbXVzaWMgc28gdGhhdCB0aGUgc2hhZGVkIG5vdGVzIGFyZSB2aXNpYmxlLlxyXG4gICAgICAgICAgKiBJZiBzY3JvbGxHcmFkdWFsbHkgaXMgdHJ1ZSwgc2Nyb2xsIGdyYWR1YWxseSAoc21vb3RoIHNjcm9sbGluZylcclxuICAgICAgICAgICogdG8gdGhlIHNoYWRlZCBub3Rlcy5cclxuICAgICAgICAgICovXHJcbiAgICAgICAgdm9pZCBTY3JvbGxUb1NoYWRlZE5vdGVzKGludCB4X3NoYWRlLCBpbnQgeV9zaGFkZSwgYm9vbCBzY3JvbGxHcmFkdWFsbHkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBQYW5lbCBzY3JvbGx2aWV3ID0gKFBhbmVsKXRoaXMuUGFyZW50O1xyXG4gICAgICAgICAgICBQb2ludCBzY3JvbGxQb3MgPSBzY3JvbGx2aWV3LkF1dG9TY3JvbGxQb3NpdGlvbjtcclxuXHJcbiAgICAgICAgICAgIC8qIFRoZSBzY3JvbGwgcG9zaXRpb24gaXMgaW4gbmVnYXRpdmUgY29vcmRpbmF0ZXMgZm9yIHNvbWUgcmVhc29uICovXHJcbiAgICAgICAgICAgIHNjcm9sbFBvcy5YID0gLXNjcm9sbFBvcy5YO1xyXG4gICAgICAgICAgICBzY3JvbGxQb3MuWSA9IC1zY3JvbGxQb3MuWTtcclxuICAgICAgICAgICAgUG9pbnQgbmV3UG9zID0gc2Nyb2xsUG9zO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNjcm9sbFZlcnQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGludCBzY3JvbGxEaXN0ID0gKGludCkoeV9zaGFkZSAtIHNjcm9sbFBvcy5ZKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsR3JhZHVhbGx5KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzY3JvbGxEaXN0ID4gKHpvb20gKiBTdGFmZkhlaWdodCAqIDgpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxEaXN0ID0gc2Nyb2xsRGlzdCAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc2Nyb2xsRGlzdCA+IChOb3RlSGVpZ2h0ICogMyAqIHpvb20pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxEaXN0ID0gKGludCkoTm90ZUhlaWdodCAqIDMgKiB6b29tKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG5ld1BvcyA9IG5ldyBQb2ludChzY3JvbGxQb3MuWCwgc2Nyb2xsUG9zLlkgKyBzY3JvbGxEaXN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGludCB4X3ZpZXcgPSBzY3JvbGxQb3MuWCArIDQwICogc2Nyb2xsdmlldy5XaWR0aCAvIDEwMDtcclxuICAgICAgICAgICAgICAgIGludCB4bWF4ID0gc2Nyb2xsUG9zLlggKyA2NSAqIHNjcm9sbHZpZXcuV2lkdGggLyAxMDA7XHJcbiAgICAgICAgICAgICAgICBpbnQgc2Nyb2xsRGlzdCA9IHhfc2hhZGUgLSB4X3ZpZXc7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNjcm9sbEdyYWR1YWxseSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoeF9zaGFkZSA+IHhtYXgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbERpc3QgPSAoeF9zaGFkZSAtIHhfdmlldykgLyAzO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHhfc2hhZGUgPiB4X3ZpZXcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbERpc3QgPSAoeF9zaGFkZSAtIHhfdmlldykgLyA2O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIG5ld1BvcyA9IG5ldyBQb2ludChzY3JvbGxQb3MuWCArIHNjcm9sbERpc3QsIHNjcm9sbFBvcy5ZKTtcclxuICAgICAgICAgICAgICAgIGlmIChuZXdQb3MuWCA8IDApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3UG9zLlggPSAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNjcm9sbHZpZXcuQXV0b1Njcm9sbFBvc2l0aW9uID0gbmV3UG9zO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIFJldHVybiB0aGUgcHVsc2VUaW1lIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGdpdmVuIHBvaW50IG9uIHRoZSBTaGVldE11c2ljLlxyXG4gICAgICAgICAqICBGaXJzdCwgZmluZCB0aGUgc3RhZmYgY29ycmVzcG9uZGluZyB0byB0aGUgcG9pbnQuXHJcbiAgICAgICAgICogIFRoZW4sIHdpdGhpbiB0aGUgc3RhZmYsIGZpbmQgdGhlIG5vdGVzL3N5bWJvbHMgY29ycmVzcG9uZGluZyB0byB0aGUgcG9pbnQsXHJcbiAgICAgICAgICogIGFuZCByZXR1cm4gdGhlIFN0YXJ0VGltZSAocHVsc2VUaW1lKSBvZiB0aGUgc3ltYm9scy5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwdWJsaWMgaW50IFB1bHNlVGltZUZvclBvaW50KFBvaW50IHBvaW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgUG9pbnQgc2NhbGVkUG9pbnQgPSBuZXcgUG9pbnQoKGludCkocG9pbnQuWCAvIHpvb20pLCAoaW50KShwb2ludC5ZIC8gem9vbSkpO1xyXG4gICAgICAgICAgICBpbnQgeSA9IDA7XHJcbiAgICAgICAgICAgIGZvcmVhY2ggKFN0YWZmIHN0YWZmIGluIHN0YWZmcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNjYWxlZFBvaW50LlkgPj0geSAmJiBzY2FsZWRQb2ludC5ZIDw9IHkgKyBzdGFmZi5IZWlnaHQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0YWZmLlB1bHNlVGltZUZvclBvaW50KHNjYWxlZFBvaW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHkgKz0gc3RhZmYuSGVpZ2h0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBvdmVycmlkZSBzdHJpbmcgVG9TdHJpbmcoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3RyaW5nIHJlc3VsdCA9IFwiU2hlZXRNdXNpYyBzdGFmZnM9XCIgKyBzdGFmZnMuQ291bnQgKyBcIlxcblwiO1xyXG4gICAgICAgICAgICBmb3JlYWNoIChTdGFmZiBzdGFmZiBpbiBzdGFmZnMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBzdGFmZi5Ub1N0cmluZygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc3VsdCArPSBcIkVuZCBTaGVldE11c2ljXFxuXCI7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbn1cclxuIiwidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcblxyXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcclxue1xyXG4gICAgcHVibGljIGNsYXNzIFNvbGlkQnJ1c2g6QnJ1c2hcclxuICAgIHtcclxuICAgICAgICBwdWJsaWMgU29saWRCcnVzaChDb2xvciBjb2xvcik6XHJcbiAgICAgICAgICAgIGJhc2UoY29sb3IpXHJcbiAgICAgICAge1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTEgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5JTztcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyB7XG5cbi8qKiBAY2xhc3MgVGltZVNpZ1N5bWJvbFxuICogQSBUaW1lU2lnU3ltYm9sIHJlcHJlc2VudHMgdGhlIHRpbWUgc2lnbmF0dXJlIGF0IHRoZSBiZWdpbm5pbmdcbiAqIG9mIHRoZSBzdGFmZi4gV2UgdXNlIHByZS1tYWRlIGltYWdlcyBmb3IgdGhlIG51bWJlcnMsIGluc3RlYWQgb2ZcbiAqIGRyYXdpbmcgc3RyaW5ncy5cbiAqL1xuXG5wdWJsaWMgY2xhc3MgVGltZVNpZ1N5bWJvbCA6IE11c2ljU3ltYm9sIHtcbiAgICBwcml2YXRlIHN0YXRpYyBJbWFnZVtdIGltYWdlczsgIC8qKiBUaGUgaW1hZ2VzIGZvciBlYWNoIG51bWJlciAqL1xuICAgIHByaXZhdGUgaW50ICBudW1lcmF0b3I7ICAgICAgICAgLyoqIFRoZSBudW1lcmF0b3IgKi9cbiAgICBwcml2YXRlIGludCAgZGVub21pbmF0b3I7ICAgICAgIC8qKiBUaGUgZGVub21pbmF0b3IgKi9cbiAgICBwcml2YXRlIGludCAgd2lkdGg7ICAgICAgICAgICAgIC8qKiBUaGUgd2lkdGggaW4gcGl4ZWxzICovXG4gICAgcHJpdmF0ZSBib29sIGNhbmRyYXc7ICAgICAgICAgICAvKiogVHJ1ZSBpZiB3ZSBjYW4gZHJhdyB0aGUgdGltZSBzaWduYXR1cmUgKi9cblxuICAgIC8qKiBDcmVhdGUgYSBuZXcgVGltZVNpZ1N5bWJvbCAqL1xuICAgIHB1YmxpYyBUaW1lU2lnU3ltYm9sKGludCBudW1lciwgaW50IGRlbm9tKSB7XG4gICAgICAgIG51bWVyYXRvciA9IG51bWVyO1xuICAgICAgICBkZW5vbWluYXRvciA9IGRlbm9tO1xuICAgICAgICBMb2FkSW1hZ2VzKCk7XG4gICAgICAgIGlmIChudW1lciA+PSAwICYmIG51bWVyIDwgaW1hZ2VzLkxlbmd0aCAmJiBpbWFnZXNbbnVtZXJdICE9IG51bGwgJiZcbiAgICAgICAgICAgIGRlbm9tID49IDAgJiYgZGVub20gPCBpbWFnZXMuTGVuZ3RoICYmIGltYWdlc1tudW1lcl0gIT0gbnVsbCkge1xuICAgICAgICAgICAgY2FuZHJhdyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjYW5kcmF3ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgd2lkdGggPSBNaW5XaWR0aDtcbiAgICB9XG5cbiAgICAvKiogTG9hZCB0aGUgaW1hZ2VzIGludG8gbWVtb3J5LiAqL1xuICAgIHByaXZhdGUgc3RhdGljIHZvaWQgTG9hZEltYWdlcygpIHtcbiAgICAgICAgaWYgKGltYWdlcyA9PSBudWxsKSB7XG4gICAgICAgICAgICBpbWFnZXMgPSBuZXcgSW1hZ2VbMTNdO1xuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCAxMzsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VzW2ldID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGltYWdlc1syXSA9IG5ldyBCaXRtYXAodHlwZW9mKFRpbWVTaWdTeW1ib2wpLCBcIlJlc291cmNlcy5JbWFnZXMudHdvLnBuZ1wiKTtcbiAgICAgICAgICAgIGltYWdlc1szXSA9IG5ldyBCaXRtYXAodHlwZW9mKFRpbWVTaWdTeW1ib2wpLCBcIlJlc291cmNlcy5JbWFnZXMudGhyZWUucG5nXCIpO1xuICAgICAgICAgICAgaW1hZ2VzWzRdID0gbmV3IEJpdG1hcCh0eXBlb2YoVGltZVNpZ1N5bWJvbCksIFwiUmVzb3VyY2VzLkltYWdlcy5mb3VyLnBuZ1wiKTtcbiAgICAgICAgICAgIGltYWdlc1s2XSA9IG5ldyBCaXRtYXAodHlwZW9mKFRpbWVTaWdTeW1ib2wpLCBcIlJlc291cmNlcy5JbWFnZXMuc2l4LnBuZ1wiKTtcbiAgICAgICAgICAgIGltYWdlc1s4XSA9IG5ldyBCaXRtYXAodHlwZW9mKFRpbWVTaWdTeW1ib2wpLCBcIlJlc291cmNlcy5JbWFnZXMuZWlnaHQucG5nXCIpO1xuICAgICAgICAgICAgaW1hZ2VzWzldID0gbmV3IEJpdG1hcCh0eXBlb2YoVGltZVNpZ1N5bWJvbCksIFwiUmVzb3VyY2VzLkltYWdlcy5uaW5lLnBuZ1wiKTtcbiAgICAgICAgICAgIGltYWdlc1sxMl0gPSBuZXcgQml0bWFwKHR5cGVvZihUaW1lU2lnU3ltYm9sKSwgXCJSZXNvdXJjZXMuSW1hZ2VzLnR3ZWx2ZS5wbmdcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSB0aW1lIChpbiBwdWxzZXMpIHRoaXMgc3ltYm9sIG9jY3VycyBhdC4gKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IFN0YXJ0VGltZSB7XG4gICAgICAgIGdldCB7IHJldHVybiAtMTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG1pbmltdW0gd2lkdGggKGluIHBpeGVscykgbmVlZGVkIHRvIGRyYXcgdGhpcyBzeW1ib2wgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IE1pbldpZHRoIHtcbiAgICAgICAgZ2V0IHsgaWYgKGNhbmRyYXcpIFxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGltYWdlc1syXS5XaWR0aCAqIFNoZWV0TXVzaWMuTm90ZUhlaWdodCAqIDIgL2ltYWdlc1syXS5IZWlnaHQ7XG4gICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBHZXQvU2V0IHRoZSB3aWR0aCAoaW4gcGl4ZWxzKSBvZiB0aGlzIHN5bWJvbC4gVGhlIHdpZHRoIGlzIHNldFxuICAgICAqIGluIFNoZWV0TXVzaWMuQWxpZ25TeW1ib2xzKCkgdG8gdmVydGljYWxseSBhbGlnbiBzeW1ib2xzLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgV2lkdGgge1xuICAgICAgIGdldCB7IHJldHVybiB3aWR0aDsgfVxuICAgICAgIHNldCB7IHdpZHRoID0gdmFsdWU7IH1cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBudW1iZXIgb2YgcGl4ZWxzIHRoaXMgc3ltYm9sIGV4dGVuZHMgYWJvdmUgdGhlIHN0YWZmLiBVc2VkXG4gICAgICogIHRvIGRldGVybWluZSB0aGUgbWluaW11bSBoZWlnaHQgbmVlZGVkIGZvciB0aGUgc3RhZmYgKFN0YWZmLkZpbmRCb3VuZHMpLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgQWJvdmVTdGFmZiB7IFxuICAgICAgICBnZXQgeyAgcmV0dXJuIDA7IH1cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBudW1iZXIgb2YgcGl4ZWxzIHRoaXMgc3ltYm9sIGV4dGVuZHMgYmVsb3cgdGhlIHN0YWZmLiBVc2VkXG4gICAgICogIHRvIGRldGVybWluZSB0aGUgbWluaW11bSBoZWlnaHQgbmVlZGVkIGZvciB0aGUgc3RhZmYgKFN0YWZmLkZpbmRCb3VuZHMpLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgQmVsb3dTdGFmZiB7XG4gICAgICAgIGdldCB7IHJldHVybiAwOyB9IFxuICAgIH1cblxuICAgIC8qKiBEcmF3IHRoZSBzeW1ib2wuXG4gICAgICogQHBhcmFtIHl0b3AgVGhlIHlsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIFxuICAgIHZvaWQgRHJhdyhHcmFwaGljcyBnLCBQZW4gcGVuLCBpbnQgeXRvcCkge1xuICAgICAgICBpZiAoIWNhbmRyYXcpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oV2lkdGggLSBNaW5XaWR0aCwgMCk7XG4gICAgICAgIEltYWdlIG51bWVyID0gaW1hZ2VzW251bWVyYXRvcl07XG4gICAgICAgIEltYWdlIGRlbm9tID0gaW1hZ2VzW2Rlbm9taW5hdG9yXTtcblxuICAgICAgICAvKiBTY2FsZSB0aGUgaW1hZ2Ugd2lkdGggdG8gbWF0Y2ggdGhlIGhlaWdodCAqL1xuICAgICAgICBpbnQgaW1naGVpZ2h0ID0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0ICogMjtcbiAgICAgICAgaW50IGltZ3dpZHRoID0gbnVtZXIuV2lkdGggKiBpbWdoZWlnaHQgLyBudW1lci5IZWlnaHQ7XG4gICAgICAgIGcuRHJhd0ltYWdlKG51bWVyLCAwLCB5dG9wLCBpbWd3aWR0aCwgaW1naGVpZ2h0KTtcbiAgICAgICAgZy5EcmF3SW1hZ2UoZGVub20sIDAsIHl0b3AgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQqMiwgaW1nd2lkdGgsIGltZ2hlaWdodCk7XG4gICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC0oV2lkdGggLSBNaW5XaWR0aCksIDApO1xuICAgIH1cblxuICAgIHB1YmxpYyBvdmVycmlkZSBzdHJpbmcgVG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcuRm9ybWF0KFwiVGltZVNpZ1N5bWJvbCBudW1lcmF0b3I9ezB9IGRlbm9taW5hdG9yPXsxfVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1lcmF0b3IsIGRlbm9taW5hdG9yKTtcbiAgICB9XG59XG5cbn1cblxuIl0KfQo=
