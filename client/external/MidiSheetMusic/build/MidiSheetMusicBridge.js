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
            ShadeNotes: function (g, shadeBrush, pen, currentPulseTime, x_shade) {

                /* If there's nothing to unshade, or shade, return */
                if (this.starttime > currentPulseTime || this.endtime < currentPulseTime) {
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
                    if (start > currentPulseTime) {
                        if (x_shade.v === 0) {
                            x_shade.v = xpos;
                        }

                        return width;
                    }

                    /* If symbol is in the current time, draw a shaded background */
                    if ((start <= currentPulseTime) && (currentPulseTime < end)) {
                        width = (width + curr.Width) | 0;
                        x_shade.v = xpos;
                        g.TranslateTransform(xpos, 0);
                        if (shadeBrush.IsClear()) {
                            g.ClearRectangle(0, 0, curr.Width, this.Height);
                        } else {
                            g.FillRectangle(shadeBrush, 0, 0, curr.Width, this.Height);
                        }
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
                                brush = new MidiSheetMusic.SolidBrush.$ctor1(pen.Color);
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

                this.gray1Brush = new MidiSheetMusic.SolidBrush.$ctor1(gray1);
                this.gray2Brush = new MidiSheetMusic.SolidBrush.$ctor1(gray2);
                this.shadeBrush = new MidiSheetMusic.SolidBrush.$ctor1(shade1);
                this.shade2Brush = new MidiSheetMusic.SolidBrush.$ctor1(shade2);
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
                this.shadeBrush = new MidiSheetMusic.SolidBrush.$ctor1(c1);
                this.shade2Brush = new MidiSheetMusic.SolidBrush.$ctor1(c2);
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
                this.deselectedShadeBrush = new MidiSheetMusic.SolidBrush.$ctor1(MidiSheetMusic.Color.LightGray);
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
                this.shadeBrush = new MidiSheetMusic.SolidBrush.$ctor1(newshade);
                this.shade2Brush = new MidiSheetMusic.SolidBrush.$ctor1(newshade2);
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
            ShadeNotes: function (currentPulseTime, scrollGradually, brush) {
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
                        width = (width + (staff.ShadeNotes(g, brush, this.pen, currentPulseTime, x_shade))) | 0;
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
        statics: {
            fields: {
                Clear: null
            },
            ctors: {
                init: function () {
                    this.Clear = new MidiSheetMusic.SolidBrush.ctor();
                }
            }
        },
        ctors: {
            ctor: function () {
                this.$initialize();
                MidiSheetMusic.Brush.ctor.call(this, new MidiSheetMusic.Color());
            },
            $ctor1: function (color) {
                this.$initialize();
                MidiSheetMusic.Brush.ctor.call(this, color);
            }
        },
        methods: {
            IsClear: function () {
                return Bridge.referenceEquals(this, MidiSheetMusic.SolidBrush.Clear);
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

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICJNaWRpU2hlZXRNdXNpY0JyaWRnZS5qcyIsCiAgInNvdXJjZVJvb3QiOiAiIiwKICAic291cmNlcyI6IFsiQ2xhc3Nlcy9EcmF3aW5nL0ltYWdlLmNzIiwiQ2xhc3Nlcy9SaWZmUGFyc2VyLmNzIiwiQ2xhc3Nlcy9EcmF3aW5nL0JydXNoLmNzIiwiQ2xhc3Nlcy9EcmF3aW5nL0JydXNoZXMuY3MiLCJDbGFzc2VzL0NsZWZNZWFzdXJlcy5jcyIsIkNsYXNzZXMvRHJhd2luZy9Db2xvci5jcyIsIkNsYXNzZXMvRHJhd2luZy9Db250cm9sLmNzIiwiQ2xhc3Nlcy9JTy9TdHJlYW0uY3MiLCJDbGFzc2VzL0RyYXdpbmcvRm9udC5jcyIsIkNsYXNzZXMvRHJhd2luZy9HcmFwaGljcy5jcyIsIkNsYXNzZXMvS2V5U2lnbmF0dXJlLmNzIiwiQ2xhc3Nlcy9MeXJpY1N5bWJvbC5jcyIsIkNsYXNzZXMvTWlkaUV2ZW50LmNzIiwiQ2xhc3Nlcy9NaWRpRmlsZS5jcyIsIkNsYXNzZXMvTWlkaUZpbGVFeGNlcHRpb24uY3MiLCJDbGFzc2VzL01pZGlGaWxlUmVhZGVyLmNzIiwiQ2xhc3Nlcy9NaWRpTm90ZS5jcyIsIkNsYXNzZXMvTWlkaU9wdGlvbnMuY3MiLCJDbGFzc2VzL01pZGlUcmFjay5jcyIsIkNsYXNzZXMvV2hpdGVOb3RlLmNzIiwiQ2xhc3Nlcy9EcmF3aW5nL1BhaW50RXZlbnRBcmdzLmNzIiwiQ2xhc3Nlcy9EcmF3aW5nL1BhbmVsLmNzIiwiQ2xhc3Nlcy9JTy9QYXRoLmNzIiwiQ2xhc3Nlcy9EcmF3aW5nL1Blbi5jcyIsIkNsYXNzZXMvRHJhd2luZy9Qb2ludC5jcyIsIkNsYXNzZXMvRHJhd2luZy9SZWN0YW5nbGUuY3MiLCJDbGFzc2VzL1N0YWZmLmNzIiwiQ2xhc3Nlcy9TdGVtLmNzIiwiQ2xhc3Nlcy9TeW1ib2xXaWR0aHMuY3MiLCJDbGFzc2VzL1RpbWVTaWduYXR1cmUuY3MiLCJDbGFzc2VzL1RleHQvQVNDSUkuY3MiLCJDbGFzc2VzL1RleHQvRW5jb2RpbmcuY3MiLCJDbGFzc2VzL0FjY2lkU3ltYm9sLmNzIiwiQ2xhc3Nlcy9CYXJTeW1ib2wuY3MiLCJDbGFzc2VzL0RyYXdpbmcvQml0bWFwLmNzIiwiQ2xhc3Nlcy9CbGFua1N5bWJvbC5jcyIsIkNsYXNzZXMvQ2hvcmRTeW1ib2wuY3MiLCJDbGFzc2VzL0NsZWZTeW1ib2wuY3MiLCJDbGFzc2VzL0lPL0ZpbGVTdHJlYW0uY3MiLCJDbGFzc2VzL1BpYW5vLmNzIiwiQ2xhc3Nlcy9SZXN0U3ltYm9sLmNzIiwiQ2xhc3Nlcy9TaGVldE11c2ljLmNzIiwiQ2xhc3Nlcy9EcmF3aW5nL1NvbGlkQnJ1c2guY3MiLCJDbGFzc2VzL1RpbWVTaWdTeW1ib2wuY3MiXSwKICAibmFtZXMiOiBbIiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQW9CZ0JBLE9BQU9BLDBCQUE4Q0E7Ozs7O29CQVFyREEsT0FBT0EsMkJBQStDQTs7Ozs7NEJBakI5Q0EsTUFBV0E7O2dCQUV2QkEsc0JBQXFDQSxNQUFNQSxNQUFNQTs7Ozs7Ozs7Ozs7OzRCQ2U3QkEsUUFBWUEsT0FBV0E7O2dCQUUzQ0EsY0FBY0E7Z0JBQ2RBLGFBQWFBO2dCQUNiQSxZQUFZQTs7Ozs7Z0JBS1pBLFlBQWVBLGtCQUFTQTtnQkFDeEJBLGtCQUFXQSxXQUFNQSxhQUFRQSxVQUFVQTtnQkFDbkNBLE9BQU9BOzs7Ozs7Ozs7OzRCQzdCRUE7O2dCQUVUQSxhQUFRQTs7Ozs7Ozs7Ozs7Ozt3QkNKc0JBLE9BQU9BLElBQUlBLHFCQUFNQTs7Ozs7d0JBQ2pCQSxPQUFPQSxJQUFJQSxxQkFBTUE7Ozs7O3dCQUNiQSxPQUFPQSxJQUFJQSxxQkFBTUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29DQ3FGOUJBOztvQkFDekJBLGNBQWNBO29CQUNkQTtvQkFDQUEsMEJBQXVCQTs7Ozs0QkFDbkJBLGlCQUFTQTs7Ozs7O3FCQUViQSxJQUFJQTt3QkFDQUEsT0FBT0E7MkJBRU5BLElBQUlBLHdCQUFNQSxzQkFBZUE7d0JBQzFCQSxP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b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGlDQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxpQ0FBTEEsUUFBMEJBOztvQkFFMUJBLE1BQU1BLHlEQUFVQSwrQkFBVkE7b0JBQ05BLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGlDQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGlDQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxpQ0FBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxpQ0FBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsaUNBQUxBLFFBQTBCQTs7b0JBRTFCQSxNQUFNQSx5REFBVUEsK0JBQVZBO29CQUNOQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxpQ0FBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxpQ0FBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsaUNBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsaUNBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGlDQUFMQSxRQUEwQkE7O29C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QkFBS0EsaUNBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGdDQUFMQSxRQUEwQkE7O29CQUUxQkEsTUFBTUEsd0RBQVNBLG1DQUFUQTtvQkFDTkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsZ0NBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsZ0NBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGdDQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGlDQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxnQ0FBTEEsUUFBMEJBOztvQkFFMUJBLE1BQU1BLHdEQUFTQSxtQ0FBVEE7b0JBQ05BLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGdDQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSw0QkFBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLGdDQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxnQ0FBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFLQSxpQ0FBTEEsUUFBMEJBO29CQUMxQkEsdUJBQUtBLDRCQUFMQSxRQUEwQkE7b0JBQzFCQSx1QkFBS0EsZ0NBQUxBLFFBQTBCQTs7b0JBRTFCQSxNQUFNQSx3REFBU0EsbUNBQVRBO29CQUNOQSx1QkFBS0EsNEJBQUxBLFFBQTBCQTtvQkFDMUJBLHVCQUFL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XG51c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcbntcbiAgICBwdWJsaWMgY2xhc3MgSW1hZ2VcbiAgICB7XG4gICAgICAgIHB1YmxpYyBvYmplY3QgRG9tSW1hZ2U7XG5cbiAgICAgICAgcHJvdGVjdGVkIEltYWdlKFR5cGUgdHlwZSwgc3RyaW5nIGZpbGVuYW1lKVxuICAgICAgICB7XG4gICAgICAgICAgICBTY3JpcHQuQ2FsbChcImJyaWRnZVV0aWwuaW1hZ2UuY3RvclwiLCB0aGlzLCB0eXBlLCBmaWxlbmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgaW50IFdpZHRoXG4gICAgICAgIHtcbiAgICAgICAgICAgIGdldFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybiBTY3JpcHQuQ2FsbDxpbnQ+KFwiYnJpZGdlVXRpbC5pbWFnZS5nZXRXaWR0aFwiLCB0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBpbnQgSGVpZ2h0XG4gICAgICAgIHtcbiAgICAgICAgICAgIGdldFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybiBTY3JpcHQuQ2FsbDxpbnQ+KFwiYnJpZGdlVXRpbC5pbWFnZS5nZXRIZWlnaHRcIiwgdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJ1c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uVGV4dDtcblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljXG57XG4gICAgLy9hZGFwdGVkIGZyb20gaHR0cHM6Ly93d3cuY29kZXByb2plY3QuY29tL0FydGljbGVzLzEwNjEzLyUyRkFydGljbGVzJTJGMTA2MTMlMkZDLVJJRkYtUGFyc2VyXG4gICAgLy9tb2RpZmllZCB0byB1c2UgYnl0ZSBhcnJheSBpbnN0ZWFkIG9mIHN0cmVhbSBzaW5jZSB0aGlzIHdpbGwgYmUgY29tcGlsZWQgdG8gSmF2YXNjcmlwdFxuICAgIHB1YmxpYyBjbGFzcyBSaWZmUGFyc2VyRXhjZXB0aW9uIDogRXhjZXB0aW9uXG4gICAge1xuICAgICAgICBwdWJsaWMgUmlmZlBhcnNlckV4Y2VwdGlvbihzdHJpbmcgbWVzc2FnZSlcbiAgICAgICAgICAgIDogYmFzZShtZXNzYWdlKVxuICAgICAgICB7XG5cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBjbGFzcyBSaWZmRmlsZUluZm9cbiAgICB7XG4gICAgICAgIHB1YmxpYyBzdHJpbmcgSGVhZGVyIHsgZ2V0OyBzZXQ7IH1cbiAgICAgICAgcHVibGljIHN0cmluZyBGaWxlVHlwZSB7IGdldDsgc2V0OyB9XG4gICAgICAgIHB1YmxpYyBpbnQgRmlsZVNpemUgeyBnZXQ7IHNldDsgfVxuICAgIH1cblxuICAgIHB1YmxpYyBjbGFzcyBCb3VuZGVkQnl0ZUFycmF5XG4gICAge1xuICAgICAgICBwcml2YXRlIGludCBvZmZzZXQ7XG4gICAgICAgIHByaXZhdGUgaW50IGNvdW50O1xuICAgICAgICBwcml2YXRlIGJ5dGVbXSBkYXRhO1xuICAgICAgICBwdWJsaWMgQm91bmRlZEJ5dGVBcnJheShpbnQgb2Zmc2V0LCBpbnQgY291bnQsIGJ5dGVbXSBkYXRhKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLm9mZnNldCA9IG9mZnNldDtcbiAgICAgICAgICAgIHRoaXMuY291bnQgPSBjb3VudDtcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgYnl0ZVtdIEdldERhdGEoKVxuICAgICAgICB7XG4gICAgICAgICAgICBieXRlW10gc2xpY2UgPSBuZXcgYnl0ZVtjb3VudF07XG4gICAgICAgICAgICBBcnJheS5Db3B5KGRhdGEsIG9mZnNldCwgc2xpY2UsIDAsIGNvdW50KTtcbiAgICAgICAgICAgIHJldHVybiBzbGljZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBkZWxlZ2F0ZSB2b2lkIFByb2Nlc3NFbGVtZW50KHN0cmluZyB0eXBlLCBib29sIGlzTGlzdCwgQm91bmRlZEJ5dGVBcnJheSBkYXRhKTtcblxuXG4gICAgcHVibGljIGNsYXNzIFJpZmZQYXJzZXJcbiAgICB7XG4gICAgICAgIHByaXZhdGUgY29uc3QgaW50IFdvcmRTaXplID0gNDtcbiAgICAgICAgcHJpdmF0ZSBjb25zdCBzdHJpbmcgUmlmZjRDQyA9IFwiUklGRlwiO1xuICAgICAgICBwcml2YXRlIGNvbnN0IHN0cmluZyBSaWZYNENDID0gXCJSSUZYXCI7XG4gICAgICAgIHByaXZhdGUgY29uc3Qgc3RyaW5nIExpc3Q0Q0MgPSBcIkxJU1RcIjtcblxuICAgICAgICBwcml2YXRlIGJ5dGVbXSBkYXRhO1xuICAgICAgICBwcml2YXRlIGludCBwb3NpdGlvbjtcblxuICAgICAgICBwdWJsaWMgUmlmZkZpbGVJbmZvIEZpbGVJbmZvIHsgZ2V0OyBwcml2YXRlIHNldDsgfVxuXG4gICAgICAgIHByaXZhdGUgc3RhdGljIFJpZmZGaWxlSW5mbyBSZWFkSGVhZGVyKGJ5dGVbXSBkYXRhKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAoZGF0YS5MZW5ndGggPCBXb3JkU2l6ZSAqIDMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJpZmZQYXJzZXJFeGNlcHRpb24oXCJSZWFkIGZhaWxlZC4gRmlsZSB0b28gc21hbGw/XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdHJpbmcgaGVhZGVyO1xuICAgICAgICAgICAgaWYgKCFJc1JpZmZGaWxlKGRhdGEsIG91dCBoZWFkZXIpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBSaWZmUGFyc2VyRXhjZXB0aW9uKFwiUmVhZCBmYWlsZWQuIE5vIFJJRkYgaGVhZGVyXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSaWZmRmlsZUluZm9cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBIZWFkZXIgPSBoZWFkZXIsXG4gICAgICAgICAgICAgICAgRmlsZVNpemUgPSBCaXRDb252ZXJ0ZXIuVG9JbnQzMihkYXRhLCBXb3JkU2l6ZSksXG4gICAgICAgICAgICAgICAgRmlsZVR5cGUgPSBFbmNvZGluZy5BU0NJSS5HZXRTdHJpbmcoZGF0YSwgV29yZFNpemUgKiAyLCBXb3JkU2l6ZSksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBSaWZmUGFyc2VyKCkgeyB9XG5cbiAgICAgICAgcHVibGljIHN0YXRpYyBSaWZmUGFyc2VyIFBhcnNlQnl0ZUFycmF5KGJ5dGVbXSBkYXRhKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgcmlmZlBhcnNlciA9IG5ldyBSaWZmUGFyc2VyKCk7XG4gICAgICAgICAgICByaWZmUGFyc2VyLkluaXQoZGF0YSk7XG4gICAgICAgICAgICByZXR1cm4gcmlmZlBhcnNlcjtcbiAgICAgICAgfVxuICAgICAgICBwcml2YXRlIHZvaWQgSW5pdChieXRlW10gZGF0YSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgICAgIEZpbGVJbmZvID0gUmVhZEhlYWRlcihkYXRhKTtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gV29yZFNpemUgKiAzO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHN0YXRpYyBib29sIElzUmlmZkZpbGUoYnl0ZVtdIGRhdGEsIG91dCBzdHJpbmcgaGVhZGVyKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgdGVzdCA9IEVuY29kaW5nLkFTQ0lJLkdldFN0cmluZyhkYXRhLCAwLCBXb3JkU2l6ZSk7XG4gICAgICAgICAgICBpZiAodGVzdCA9PSBSaWZmNENDIHx8IHRlc3QgPT0gUmlmWDRDQylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBoZWFkZXIgPSB0ZXN0O1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaGVhZGVyID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBib29sIFJlYWQoUHJvY2Vzc0VsZW1lbnQgcHJvY2Vzc0VsZW1lbnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmIChkYXRhLkxlbmd0aCAtIHBvc2l0aW9uIDwgV29yZFNpemUgKiAyKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHR5cGUgPSBFbmNvZGluZy5BU0NJSS5HZXRTdHJpbmcoZGF0YSwgcG9zaXRpb24sIFdvcmRTaXplKTtcbiAgICAgICAgICAgIHBvc2l0aW9uICs9IFdvcmRTaXplO1xuICAgICAgICAgICAgdmFyIHNpemUgPSBCaXRDb252ZXJ0ZXIuVG9JbnQzMihkYXRhLCBwb3NpdGlvbik7XG4gICAgICAgICAgICBwb3NpdGlvbiArPSBXb3JkU2l6ZTtcblxuICAgICAgICAgICAgaWYgKGRhdGEuTGVuZ3RoIC0gcG9zaXRpb24gPCBzaXplKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBSaWZmUGFyc2VyRXhjZXB0aW9uKHN0cmluZy5Gb3JtYXQoXCJFbGVtZW50IHNpemUgbWlzbWF0Y2ggZm9yIGVsZW1lbnQgezB9IFwiLHR5cGUpK1xuc3RyaW5nLkZvcm1hdChcIm5lZWQgezB9IGJ1dCBoYXZlIG9ubHkgezF9XCIsc2l6ZSxGaWxlSW5mby5GaWxlU2l6ZSAtIHBvc2l0aW9uKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlID09IExpc3Q0Q0MpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3RUeXBlID0gRW5jb2RpbmcuQVNDSUkuR2V0U3RyaW5nKGRhdGEsIHBvc2l0aW9uLCBXb3JkU2l6ZSk7XG4gICAgICAgICAgICAgICAgcHJvY2Vzc0VsZW1lbnQobGlzdFR5cGUsIHRydWUsIG5ldyBCb3VuZGVkQnl0ZUFycmF5KHBvc2l0aW9uICsgV29yZFNpemUsIHNpemUsIGRhdGEpKTtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiArPSBzaXplO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZhciBwYWRkZWRTaXplID0gc2l6ZTtcbiAgICAgICAgICAgICAgICBpZiAoKHNpemUgJiAxKSAhPSAwKSBwYWRkZWRTaXplKys7XG4gICAgICAgICAgICAgICAgcHJvY2Vzc0VsZW1lbnQodHlwZSwgZmFsc2UsIG5ldyBCb3VuZGVkQnl0ZUFycmF5KHBvc2l0aW9uLCBzaXplLCBkYXRhKSk7XG4gICAgICAgICAgICAgICAgcG9zaXRpb24gKz0gcGFkZGVkU2l6ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwidXNpbmcgU3lzdGVtO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG51c2luZyBTeXN0ZW0uVGV4dDtcblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljXG57XG4gICAgcHVibGljIGNsYXNzIEJydXNoXG4gICAge1xuICAgICAgICBwdWJsaWMgQ29sb3IgQ29sb3I7XG5cbiAgICAgICAgcHVibGljIEJydXNoKENvbG9yIGNvbG9yKVxuICAgICAgICB7XG4gICAgICAgICAgICBDb2xvciA9IGNvbG9yO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHZvaWQgRGlzcG9zZSgpIHsgfVxuICAgIH1cbn1cbiIsInVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY1xue1xuICAgIHB1YmxpYyBzdGF0aWMgY2xhc3MgQnJ1c2hlc1xuICAgIHtcbiAgICAgICAgcHVibGljIHN0YXRpYyBCcnVzaCBCbGFjayB7IGdldCB7IHJldHVybiBuZXcgQnJ1c2goQ29sb3IuQmxhY2spOyB9IH1cbiAgICAgICAgcHVibGljIHN0YXRpYyBCcnVzaCBXaGl0ZSB7IGdldCB7IHJldHVybiBuZXcgQnJ1c2goQ29sb3IuV2hpdGUpOyB9IH1cbiAgICAgICAgcHVibGljIHN0YXRpYyBCcnVzaCBMaWdodEdyYXkgeyBnZXQgeyByZXR1cm4gbmV3IEJydXNoKENvbG9yLkxpZ2h0R3JheSk7IH0gfVxuICAgIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAwOCBNYWRoYXYgVmFpZHlhbmF0aGFuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cblxudXNpbmcgU3lzdGVtO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyB7XG5cbi8qKiBAY2xhc3MgQ2xlZk1lYXN1cmVzXG4gKiBUaGUgQ2xlZk1lYXN1cmVzIGNsYXNzIGlzIHVzZWQgdG8gcmVwb3J0IHdoYXQgQ2xlZiAoVHJlYmxlIG9yIEJhc3MpIGFcbiAqIGdpdmVuIG1lYXN1cmUgdXNlcy5cbiAqL1xucHVibGljIGNsYXNzIENsZWZNZWFzdXJlcyB7XG4gICAgcHJpdmF0ZSBMaXN0PENsZWY+IGNsZWZzOyAgLyoqIFRoZSBjbGVmcyB1c2VkIGZvciBlYWNoIG1lYXN1cmUgKGZvciBhIHNpbmdsZSB0cmFjaykgKi9cbiAgICBwcml2YXRlIGludCBtZWFzdXJlOyAgICAgICAvKiogVGhlIGxlbmd0aCBvZiBhIG1lYXN1cmUsIGluIHB1bHNlcyAqL1xuXG4gXG4gICAgLyoqIEdpdmVuIHRoZSBub3RlcyBpbiBhIHRyYWNrLCBjYWxjdWxhdGUgdGhlIGFwcHJvcHJpYXRlIENsZWYgdG8gdXNlXG4gICAgICogZm9yIGVhY2ggbWVhc3VyZS4gIFN0b3JlIHRoZSByZXN1bHQgaW4gdGhlIGNsZWZzIGxpc3QuXG4gICAgICogQHBhcmFtIG5vdGVzICBUaGUgbWlkaSBub3Rlc1xuICAgICAqIEBwYXJhbSBtZWFzdXJlbGVuIFRoZSBsZW5ndGggb2YgYSBtZWFzdXJlLCBpbiBwdWxzZXNcbiAgICAgKi9cbiAgICBwdWJsaWMgQ2xlZk1lYXN1cmVzKExpc3Q8TWlkaU5vdGU+IG5vdGVzLCBpbnQgbWVhc3VyZWxlbikge1xuICAgICAgICBtZWFzdXJlID0gbWVhc3VyZWxlbjtcbiAgICAgICAgQ2xlZiBtYWluY2xlZiA9IE1haW5DbGVmKG5vdGVzKTtcbiAgICAgICAgaW50IG5leHRtZWFzdXJlID0gbWVhc3VyZWxlbjtcbiAgICAgICAgaW50IHBvcyA9IDA7XG4gICAgICAgIENsZWYgY2xlZiA9IG1haW5jbGVmO1xuXG4gICAgICAgIGNsZWZzID0gbmV3IExpc3Q8Q2xlZj4oKTtcblxuICAgICAgICB3aGlsZSAocG9zIDwgbm90ZXMuQ291bnQpIHtcbiAgICAgICAgICAgIC8qIFN1bSBhbGwgdGhlIG5vdGVzIGluIHRoZSBjdXJyZW50IG1lYXN1cmUgKi9cbiAgICAgICAgICAgIGludCBzdW1ub3RlcyA9IDA7XG4gICAgICAgICAgICBpbnQgbm90ZWNvdW50ID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChwb3MgPCBub3Rlcy5Db3VudCAmJiBub3Rlc1twb3NdLlN0YXJ0VGltZSA8IG5leHRtZWFzdXJlKSB7XG4gICAgICAgICAgICAgICAgc3Vtbm90ZXMgKz0gbm90ZXNbcG9zXS5OdW1iZXI7XG4gICAgICAgICAgICAgICAgbm90ZWNvdW50Kys7XG4gICAgICAgICAgICAgICAgcG9zKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm90ZWNvdW50ID09IDApXG4gICAgICAgICAgICAgICAgbm90ZWNvdW50ID0gMTtcblxuICAgICAgICAgICAgLyogQ2FsY3VsYXRlIHRoZSBcImF2ZXJhZ2VcIiBub3RlIGluIHRoZSBtZWFzdXJlICovXG4gICAgICAgICAgICBpbnQgYXZnbm90ZSA9IHN1bW5vdGVzIC8gbm90ZWNvdW50O1xuICAgICAgICAgICAgaWYgKGF2Z25vdGUgPT0gMCkge1xuICAgICAgICAgICAgICAgIC8qIFRoaXMgbWVhc3VyZSBkb2Vzbid0IGNvbnRhaW4gYW55IG5vdGVzLlxuICAgICAgICAgICAgICAgICAqIEtlZXAgdGhlIHByZXZpb3VzIGNsZWYuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhdmdub3RlID49IFdoaXRlTm90ZS5Cb3R0b21UcmVibGUuTnVtYmVyKCkpIHtcbiAgICAgICAgICAgICAgICBjbGVmID0gQ2xlZi5UcmVibGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhdmdub3RlIDw9IFdoaXRlTm90ZS5Ub3BCYXNzLk51bWJlcigpKSB7XG4gICAgICAgICAgICAgICAgY2xlZiA9IENsZWYuQmFzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8qIFRoZSBhdmVyYWdlIG5vdGUgaXMgYmV0d2VlbiBHMyBhbmQgRjQuIFdlIGNhbiB1c2UgZWl0aGVyXG4gICAgICAgICAgICAgICAgICogdGhlIHRyZWJsZSBvciBiYXNzIGNsZWYuICBVc2UgdGhlIFwibWFpblwiIGNsZWYsIHRoZSBjbGVmXG4gICAgICAgICAgICAgICAgICogdGhhdCBhcHBlYXJzIG1vc3QgZm9yIHRoaXMgdHJhY2suXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgY2xlZiA9IG1haW5jbGVmO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjbGVmcy5BZGQoY2xlZik7XG4gICAgICAgICAgICBuZXh0bWVhc3VyZSArPSBtZWFzdXJlbGVuO1xuICAgICAgICB9XG4gICAgICAgIGNsZWZzLkFkZChjbGVmKTtcbiAgICB9XG5cbiAgICAvKiogR2l2ZW4gYSB0aW1lIChpbiBwdWxzZXMpLCByZXR1cm4gdGhlIGNsZWYgdXNlZCBmb3IgdGhhdCBtZWFzdXJlLiAqL1xuICAgIHB1YmxpYyBDbGVmIEdldENsZWYoaW50IHN0YXJ0dGltZSkge1xuXG4gICAgICAgIC8qIElmIHRoZSB0aW1lIGV4Y2VlZHMgdGhlIGxhc3QgbWVhc3VyZSwgcmV0dXJuIHRoZSBsYXN0IG1lYXN1cmUgKi9cbiAgICAgICAgaWYgKHN0YXJ0dGltZSAvIG1lYXN1cmUgPj0gY2xlZnMuQ291bnQpIHtcbiAgICAgICAgICAgIHJldHVybiBjbGVmc1sgY2xlZnMuQ291bnQtMSBdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGNsZWZzWyBzdGFydHRpbWUgLyBtZWFzdXJlIF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogQ2FsY3VsYXRlIHRoZSBiZXN0IGNsZWYgdG8gdXNlIGZvciB0aGUgZ2l2ZW4gbm90ZXMuICBJZiB0aGVcbiAgICAgKiBhdmVyYWdlIG5vdGUgaXMgYmVsb3cgTWlkZGxlIEMsIHVzZSBhIGJhc3MgY2xlZi4gIEVsc2UsIHVzZSBhIHRyZWJsZVxuICAgICAqIGNsZWYuXG4gICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgQ2xlZiBNYWluQ2xlZihMaXN0PE1pZGlOb3RlPiBub3Rlcykge1xuICAgICAgICBpbnQgbWlkZGxlQyA9IFdoaXRlTm90ZS5NaWRkbGVDLk51bWJlcigpO1xuICAgICAgICBpbnQgdG90YWwgPSAwO1xuICAgICAgICBmb3JlYWNoIChNaWRpTm90ZSBtIGluIG5vdGVzKSB7XG4gICAgICAgICAgICB0b3RhbCArPSBtLk51bWJlcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm90ZXMuQ291bnQgPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIENsZWYuVHJlYmxlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRvdGFsL25vdGVzLkNvdW50ID49IG1pZGRsZUMpIHtcbiAgICAgICAgICAgIHJldHVybiBDbGVmLlRyZWJsZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBDbGVmLkJhc3M7XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxufVxuXG4iLCJ1c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcbntcbiAgICBwdWJsaWMgY2xhc3MgQ29sb3JcbiAgICB7XG4gICAgICAgIHB1YmxpYyBpbnQgUmVkO1xuICAgICAgICBwdWJsaWMgaW50IEdyZWVuO1xuICAgICAgICBwdWJsaWMgaW50IEJsdWU7XG4gICAgICAgIHB1YmxpYyBpbnQgQWxwaGE7XG5cbiAgICAgICAgcHVibGljIENvbG9yKClcbiAgICAgICAge1xuICAgICAgICAgICAgQWxwaGEgPSAyNTU7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgc3RhdGljIENvbG9yIEZyb21SZ2IoaW50IHJlZCwgaW50IGdyZWVuLCBpbnQgYmx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIEZyb21BcmdiKDI1NSwgcmVkLCBncmVlbiwgYmx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgc3RhdGljIENvbG9yIEZyb21BcmdiKGludCBhbHBoYSwgaW50IHJlZCwgaW50IGdyZWVuLCBpbnQgYmx1ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb2xvclxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIEFscGhhID0gYWxwaGEsXG4gICAgICAgICAgICAgICAgUmVkID0gcmVkLFxuICAgICAgICAgICAgICAgIEdyZWVuID0gZ3JlZW4sXG4gICAgICAgICAgICAgICAgQmx1ZSA9IGJsdWVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgc3RhdGljIENvbG9yIEJsYWNrIHsgZ2V0IHsgcmV0dXJuIG5ldyBDb2xvcigpOyB9IH1cblxuICAgICAgICBwdWJsaWMgc3RhdGljIENvbG9yIFdoaXRlIHsgZ2V0IHsgcmV0dXJuIEZyb21SZ2IoMjU1LDI1NSwyNTUpOyB9IH1cblxuICAgICAgICBwdWJsaWMgc3RhdGljIENvbG9yIExpZ2h0R3JheSB7IGdldCB7IHJldHVybiBGcm9tUmdiKDB4ZDMsMHhkMywweGQzKTsgfSB9XG5cbiAgICAgICAgcHVibGljIGludCBSIHsgZ2V0IHsgcmV0dXJuIFJlZDsgfSB9XG4gICAgICAgIHB1YmxpYyBpbnQgRyB7IGdldCB7IHJldHVybiBHcmVlbjsgfSB9XG4gICAgICAgIHB1YmxpYyBpbnQgQiB7IGdldCB7IHJldHVybiBCbHVlOyB9IH1cblxuICAgICAgICBwdWJsaWMgYm9vbCBFcXVhbHMoQ29sb3IgY29sb3IpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBSZWQgPT0gY29sb3IuUmVkICYmIEdyZWVuID09IGNvbG9yLkdyZWVuICYmIEJsdWUgPT0gY29sb3IuQmx1ZSAmJiBBbHBoYT09Y29sb3IuQWxwaGE7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJ1c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcbntcbiAgICBwdWJsaWMgY2xhc3MgQ29udHJvbFxuICAgIHtcbiAgICAgICAgcHVibGljIGludCBXaWR0aDtcbiAgICAgICAgcHVibGljIGludCBIZWlnaHQ7XG5cbiAgICAgICAgcHVibGljIHZvaWQgSW52YWxpZGF0ZSgpIHsgfVxuXG4gICAgICAgIHB1YmxpYyBHcmFwaGljcyBDcmVhdGVHcmFwaGljcyhzdHJpbmcgbmFtZSkgeyByZXR1cm4gbmV3IEdyYXBoaWNzKG5hbWUpOyB9XG5cbiAgICAgICAgcHVibGljIFBhbmVsIFBhcmVudCB7IGdldCB7IHJldHVybiBuZXcgUGFuZWwoKTsgfSB9XG5cbiAgICAgICAgcHVibGljIENvbG9yIEJhY2tDb2xvcjtcbiAgICB9XG59XG4iLCJ1c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcbntcbiAgICBwdWJsaWMgY2xhc3MgU3RyZWFtXG4gICAge1xuICAgICAgICBwdWJsaWMgdm9pZCBXcml0ZShieXRlW10gYnVmZmVyLCBpbnQgb2Zmc2V0LCBpbnQgY291bnQpIHsgfVxuXG4gICAgICAgIHB1YmxpYyB2b2lkIENsb3NlKCkgeyB9XG4gICAgfVxufVxuIiwidXNpbmcgU3lzdGVtO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG51c2luZyBTeXN0ZW0uVGV4dDtcblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljXG57XG4gICAgcHVibGljIGNsYXNzIEZvbnRcbiAgICB7XG4gICAgICAgIHB1YmxpYyBzdHJpbmcgTmFtZTtcbiAgICAgICAgcHVibGljIGludCBTaXplO1xuICAgICAgICBwdWJsaWMgRm9udFN0eWxlIFN0eWxlO1xuXG4gICAgICAgIHB1YmxpYyBGb250KHN0cmluZyBuYW1lLCBpbnQgc2l6ZSwgRm9udFN0eWxlIHN0eWxlKVxuICAgICAgICB7XG4gICAgICAgICAgICBOYW1lID0gbmFtZTtcbiAgICAgICAgICAgIFNpemUgPSBzaXplO1xuICAgICAgICAgICAgU3R5bGUgPSBzdHlsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBmbG9hdCBHZXRIZWlnaHQoKSB7IHJldHVybiAwOyB9XG5cbiAgICAgICAgcHVibGljIHZvaWQgRGlzcG9zZSgpIHsgfVxuICAgIH1cbn1cbiIsInVzaW5nIEJyaWRnZTtcbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY1xue1xuICAgIHB1YmxpYyBjbGFzcyBHcmFwaGljc1xuICAgIHtcbiAgICAgICAgcHVibGljIEdyYXBoaWNzKHN0cmluZyBuYW1lKVxuICAgICAgICB7XG4gICAgICAgICAgICBOYW1lID0gbmFtZTtcbiAgICAgICAgICAgIFNjcmlwdC5DYWxsKFwiYnJpZGdlVXRpbC5ncmFwaGljcy5pbml0R3JhcGhpY3NcIiwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgc3RyaW5nIE5hbWU7XG5cbiAgICAgICAgcHVibGljIG9iamVjdCBDb250ZXh0O1xuXG4gICAgICAgIHB1YmxpYyB2b2lkIFRyYW5zbGF0ZVRyYW5zZm9ybShpbnQgeCwgaW50IHkpIHtcbiAgICAgICAgICAgIFNjcmlwdC5DYWxsKFwiYnJpZGdlVXRpbC5ncmFwaGljcy50cmFuc2xhdGVUcmFuc2Zvcm1cIiwgdGhpcywgeCwgeSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgdm9pZCBEcmF3SW1hZ2UoSW1hZ2UgaW1hZ2UsIGludCB4LCBpbnQgeSwgaW50IHdpZHRoLCBpbnQgaGVpZ2h0KSB7XG4gICAgICAgICAgICBTY3JpcHQuQ2FsbChcImJyaWRnZVV0aWwuZ3JhcGhpY3MuZHJhd0ltYWdlXCIsIHRoaXMsIGltYWdlLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyB2b2lkIERyYXdTdHJpbmcoc3RyaW5nIHRleHQsIEZvbnQgZm9udCwgQnJ1c2ggYnJ1c2gsIGludCB4LCBpbnQgeSkge1xuICAgICAgICAgICAgU2NyaXB0LkNhbGwoXCJicmlkZ2VVdGlsLmdyYXBoaWNzLmRyYXdTdHJpbmdcIiwgdGhpcywgdGV4dCwgZm9udCwgYnJ1c2gsIHgsIHkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHZvaWQgRHJhd0xpbmUoUGVuIHBlbiwgaW50IHhTdGFydCwgaW50IHlTdGFydCwgaW50IHhFbmQsIGludCB5RW5kKSB7XG4gICAgICAgICAgICBTY3JpcHQuQ2FsbChcImJyaWRnZVV0aWwuZ3JhcGhpY3MuZHJhd0xpbmVcIiwgdGhpcywgcGVuLCB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgdm9pZCBEcmF3QmV6aWVyKFBlbiBwZW4sIGludCB4MSwgaW50IHkxLCBpbnQgeDIsIGludCB5MiwgaW50IHgzLCBpbnQgeTMsIGludCB4NCwgaW50IHk0KSB7XG4gICAgICAgICAgICBTY3JpcHQuQ2FsbChcImJyaWRnZVV0aWwuZ3JhcGhpY3MuZHJhd0JlemllclwiLCB0aGlzLCBwZW4sIHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgdm9pZCBTY2FsZVRyYW5zZm9ybShmbG9hdCB4LCBmbG9hdCB5KSB7XG4gICAgICAgICAgICBTY3JpcHQuQ2FsbChcImJyaWRnZVV0aWwuZ3JhcGhpY3Muc2NhbGVUcmFuc2Zvcm1cIiwgdGhpcywgeCwgeSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgdm9pZCBGaWxsUmVjdGFuZ2xlKEJydXNoIGJydXNoLCBpbnQgeCwgaW50IHksIGludCB3aWR0aCwgaW50IGhlaWdodCkge1xuICAgICAgICAgICAgU2NyaXB0LkNhbGwoXCJicmlkZ2VVdGlsLmdyYXBoaWNzLmZpbGxSZWN0YW5nbGVcIiwgdGhpcywgYnJ1c2gsIHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHZvaWQgQ2xlYXJSZWN0YW5nbGUoaW50IHgsIGludCB5LCBpbnQgd2lkdGgsIGludCBoZWlnaHQpIHtcbiAgICAgICAgICAgIFNjcmlwdC5DYWxsKFwiYnJpZGdlVXRpbC5ncmFwaGljcy5jbGVhclJlY3RhbmdsZVwiLCB0aGlzLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyB2b2lkIEZpbGxFbGxpcHNlKEJydXNoIGJydXNoLCBpbnQgeCwgaW50IHksIGludCB3aWR0aCwgaW50IGhlaWdodCkge1xuICAgICAgICAgICAgU2NyaXB0LkNhbGwoXCJicmlkZ2VVdGlsLmdyYXBoaWNzLmZpbGxFbGxpcHNlXCIsIHRoaXMsIGJydXNoLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyB2b2lkIERyYXdFbGxpcHNlKFBlbiBwZW4sIGludCB4LCBpbnQgeSwgaW50IHdpZHRoLCBpbnQgaGVpZ2h0KSB7XG4gICAgICAgICAgICBTY3JpcHQuQ2FsbChcImJyaWRnZVV0aWwuZ3JhcGhpY3MuZHJhd0VsbGlwc2VcIiwgdGhpcywgcGVuLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyB2b2lkIFJvdGF0ZVRyYW5zZm9ybShmbG9hdCBhbmdsZURlZykge1xuICAgICAgICAgICAgU2NyaXB0LkNhbGwoXCJicmlkZ2VVdGlsLmdyYXBoaWNzLnJvdGF0ZVRyYW5zZm9ybVwiLCB0aGlzLCBhbmdsZURlZyk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgU21vb3RoaW5nTW9kZSBTbW9vdGhpbmdNb2RlIHsgZ2V0OyBzZXQ7IH1cblxuICAgICAgICBwdWJsaWMgUmVjdGFuZ2xlIFZpc2libGVDbGlwQm91bmRzIHsgZ2V0OyBzZXQ7IH1cblxuICAgICAgICBwdWJsaWMgZmxvYXQgUGFnZVNjYWxlIHsgZ2V0OyBzZXQ7IH1cblxuICAgICAgICBwdWJsaWMgdm9pZCBEaXNwb3NlKCkgeyB9XG4gICAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAwNy0yMDEzIE1hZGhhdiBWYWlkeWFuYXRoYW5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuXG51c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uSU87XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xuXG5cbi8qKiBAY2xhc3MgS2V5U2lnbmF0dXJlXG4gKiBUaGUgS2V5U2lnbmF0dXJlIGNsYXNzIHJlcHJlc2VudHMgYSBrZXkgc2lnbmF0dXJlLCBsaWtlIEcgTWFqb3JcbiAqIG9yIEItZmxhdCBNYWpvci4gIEZvciBzaGVldCBtdXNpYywgd2Ugb25seSBjYXJlIGFib3V0IHRoZSBudW1iZXJcbiAqIG9mIHNoYXJwcyBvciBmbGF0cyBpbiB0aGUga2V5IHNpZ25hdHVyZSwgbm90IHdoZXRoZXIgaXQgaXMgbWFqb3JcbiAqIG9yIG1pbm9yLlxuICpcbiAqIFRoZSBtYWluIG9wZXJhdGlvbnMgb2YgdGhpcyBjbGFzcyBhcmU6XG4gKiAtIEd1ZXNzaW5nIHRoZSBrZXkgc2lnbmF0dXJlLCBnaXZlbiB0aGUgbm90ZXMgaW4gYSBzb25nLlxuICogLSBHZW5lcmF0aW5nIHRoZSBhY2NpZGVudGFsIHN5bWJvbHMgZm9yIHRoZSBrZXkgc2lnbmF0dXJlLlxuICogLSBEZXRlcm1pbmluZyB3aGV0aGVyIGEgcGFydGljdWxhciBub3RlIHJlcXVpcmVzIGFuIGFjY2lkZW50YWxcbiAqICAgb3Igbm90LlxuICpcbiAqL1xuXG5wdWJsaWMgY2xhc3MgS2V5U2lnbmF0dXJlIHtcbiAgICAvKiogVGhlIG51bWJlciBvZiBzaGFycHMgaW4gZWFjaCBrZXkgc2lnbmF0dXJlICovXG4gICAgcHVibGljIGNvbnN0IGludCBDID0gMDtcbiAgICBwdWJsaWMgY29uc3QgaW50IEcgPSAxO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgRCA9IDI7XG4gICAgcHVibGljIGNvbnN0IGludCBBID0gMztcbiAgICBwdWJsaWMgY29uc3QgaW50IEUgPSA0O1xuICAgIHB1YmxpYyBjb25zdCBpbnQgQiA9IDU7XG5cbiAgICAvKiogVGhlIG51bWJlciBvZiBmbGF0cyBpbiBlYWNoIGtleSBzaWduYXR1cmUgKi9cbiAgICBwdWJsaWMgY29uc3QgaW50IEYgPSAxO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgQmZsYXQgPSAyO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgRWZsYXQgPSAzO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgQWZsYXQgPSA0O1xuICAgIHB1YmxpYyBjb25zdCBpbnQgRGZsYXQgPSA1O1xuICAgIHB1YmxpYyBjb25zdCBpbnQgR2ZsYXQgPSA2O1xuXG4gICAgLyoqIFRoZSB0d28gYXJyYXlzIGJlbG93IGFyZSBrZXkgbWFwcy4gIFRoZXkgdGFrZSBhIG1ham9yIGtleVxuICAgICAqIChsaWtlIEcgbWFqb3IsIEItZmxhdCBtYWpvcikgYW5kIGEgbm90ZSBpbiB0aGUgc2NhbGUsIGFuZFxuICAgICAqIHJldHVybiB0aGUgQWNjaWRlbnRhbCByZXF1aXJlZCB0byBkaXNwbGF5IHRoYXQgbm90ZSBpbiB0aGVcbiAgICAgKiBnaXZlbiBrZXkuICBJbiBhIG51dHNoZWwsIHRoZSBtYXAgaXNcbiAgICAgKlxuICAgICAqICAgbWFwW0tleV1bTm90ZVNjYWxlXSAtPiBBY2NpZGVudGFsXG4gICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgQWNjaWRbXVtdIHNoYXJwa2V5cztcbiAgICBwcml2YXRlIHN0YXRpYyBBY2NpZFtdW10gZmxhdGtleXM7XG5cbiAgICBwcml2YXRlIGludCBudW1fZmxhdHM7ICAgLyoqIFRoZSBudW1iZXIgb2Ygc2hhcnBzIGluIHRoZSBrZXksIDAgdGhydSA2ICovXG4gICAgcHJpdmF0ZSBpbnQgbnVtX3NoYXJwczsgIC8qKiBUaGUgbnVtYmVyIG9mIGZsYXRzIGluIHRoZSBrZXksIDAgdGhydSA2ICovXG5cbiAgICAvKiogVGhlIGFjY2lkZW50YWwgc3ltYm9scyB0aGF0IGRlbm90ZSB0aGlzIGtleSwgaW4gYSB0cmVibGUgY2xlZiAqL1xuICAgIHByaXZhdGUgQWNjaWRTeW1ib2xbXSB0cmVibGU7XG5cbiAgICAvKiogVGhlIGFjY2lkZW50YWwgc3ltYm9scyB0aGF0IGRlbm90ZSB0aGlzIGtleSwgaW4gYSBiYXNzIGNsZWYgKi9cbiAgICBwcml2YXRlIEFjY2lkU3ltYm9sW10gYmFzcztcblxuICAgIC8qKiBUaGUga2V5IG1hcCBmb3IgdGhpcyBrZXkgc2lnbmF0dXJlOlxuICAgICAqICAga2V5bWFwW25vdGVudW1iZXJdIC0+IEFjY2lkZW50YWxcbiAgICAgKi9cbiAgICBwcml2YXRlIEFjY2lkW10ga2V5bWFwO1xuXG4gICAgLyoqIFRoZSBtZWFzdXJlIHVzZWQgaW4gdGhlIHByZXZpb3VzIGNhbGwgdG8gR2V0QWNjaWRlbnRhbCgpICovXG4gICAgcHJpdmF0ZSBpbnQgcHJldm1lYXN1cmU7IFxuXG5cbiAgICAvKiogQ3JlYXRlIG5ldyBrZXkgc2lnbmF0dXJlLCB3aXRoIHRoZSBnaXZlbiBudW1iZXIgb2ZcbiAgICAgKiBzaGFycHMgYW5kIGZsYXRzLiAgT25lIG9mIHRoZSB0d28gbXVzdCBiZSAwLCB5b3UgY2FuJ3RcbiAgICAgKiBoYXZlIGJvdGggc2hhcnBzIGFuZCBmbGF0cyBpbiB0aGUga2V5IHNpZ25hdHVyZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgS2V5U2lnbmF0dXJlKGludCBudW1fc2hhcnBzLCBpbnQgbnVtX2ZsYXRzKSB7XG4gICAgICAgIGlmICghKG51bV9zaGFycHMgPT0gMCB8fCBudW1fZmxhdHMgPT0gMCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBTeXN0ZW0uQXJndW1lbnRFeGNlcHRpb24oXCJCYWQgS2V5U2lnYXR1cmUgYXJnc1wiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm51bV9zaGFycHMgPSBudW1fc2hhcnBzO1xuICAgICAgICB0aGlzLm51bV9mbGF0cyA9IG51bV9mbGF0cztcblxuICAgICAgICBDcmVhdGVBY2NpZGVudGFsTWFwcygpO1xuICAgICAgICBrZXltYXAgPSBuZXcgQWNjaWRbMTYwXTtcbiAgICAgICAgUmVzZXRLZXlNYXAoKTtcbiAgICAgICAgQ3JlYXRlU3ltYm9scygpO1xuICAgIH1cblxuICAgIC8qKiBDcmVhdGUgbmV3IGtleSBzaWduYXR1cmUsIHdpdGggdGhlIGdpdmVuIG5vdGVzY2FsZS4gICovXG4gICAgcHVibGljIEtleVNpZ25hdHVyZShpbnQgbm90ZXNjYWxlKSB7XG4gICAgICAgIG51bV9zaGFycHMgPSBudW1fZmxhdHMgPSAwO1xuICAgICAgICBzd2l0Y2ggKG5vdGVzY2FsZSkge1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuQTogICAgIG51bV9zaGFycHMgPSAzOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkJmbGF0OiBudW1fZmxhdHMgPSAyOyAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5COiAgICAgbnVtX3NoYXJwcyA9IDU7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuQzogICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuRGZsYXQ6IG51bV9mbGF0cyA9IDU7ICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkQ6ICAgICBudW1fc2hhcnBzID0gMjsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5FZmxhdDogbnVtX2ZsYXRzID0gMzsgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuRTogICAgIG51bV9zaGFycHMgPSA0OyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkY6ICAgICBudW1fZmxhdHMgPSAxOyAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5HZmxhdDogbnVtX2ZsYXRzID0gNjsgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuRzogICAgIG51bV9zaGFycHMgPSAxOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkFmbGF0OiBudW1fZmxhdHMgPSA0OyAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBDcmVhdGVBY2NpZGVudGFsTWFwcygpO1xuICAgICAgICBrZXltYXAgPSBuZXcgQWNjaWRbMTYwXTtcbiAgICAgICAgUmVzZXRLZXlNYXAoKTtcbiAgICAgICAgQ3JlYXRlU3ltYm9scygpO1xuICAgIH1cblxuXG4gICAgLyoqIEluaWl0YWxpemUgdGhlIHNoYXJwa2V5cyBhbmQgZmxhdGtleXMgbWFwcyAqL1xuICAgIHByaXZhdGUgc3RhdGljIHZvaWQgQ3JlYXRlQWNjaWRlbnRhbE1hcHMoKSB7XG4gICAgICAgIGlmIChzaGFycGtleXMgIT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybjsgXG5cbiAgICAgICAgQWNjaWRbXSBtYXA7XG4gICAgICAgIHNoYXJwa2V5cyA9IG5ldyBBY2NpZFs4XVtdO1xuICAgICAgICBmbGF0a2V5cyA9IG5ldyBBY2NpZFs4XVtdO1xuXG4gICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgODsgaSsrKSB7XG4gICAgICAgICAgICBzaGFycGtleXNbaV0gPSBuZXcgQWNjaWRbMTJdO1xuICAgICAgICAgICAgZmxhdGtleXNbaV0gPSBuZXcgQWNjaWRbMTJdO1xuICAgICAgICB9XG5cbiAgICAgICAgbWFwID0gc2hhcnBrZXlzW0NdO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5BIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkFzaGFycCBdID0gQWNjaWQuRmxhdDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5DIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkNzaGFycCBdID0gQWNjaWQuU2hhcnA7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkQgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRHNoYXJwIF0gPSBBY2NpZC5TaGFycDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRSBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5GIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkZzaGFycCBdID0gQWNjaWQuU2hhcnA7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkcgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuR3NoYXJwIF0gPSBBY2NpZC5TaGFycDtcblxuICAgICAgICBtYXAgPSBzaGFycGtleXNbR107XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkEgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQXNoYXJwIF0gPSBBY2NpZC5GbGF0O1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5CIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkMgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQ3NoYXJwIF0gPSBBY2NpZC5TaGFycDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRCBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Ec2hhcnAgXSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkYgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRnNoYXJwIF0gPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkdzaGFycCBdID0gQWNjaWQuU2hhcnA7XG5cbiAgICAgICAgbWFwID0gc2hhcnBrZXlzW0RdO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5BIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkFzaGFycCBdID0gQWNjaWQuRmxhdDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5DIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkNzaGFycCBdID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRCBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Ec2hhcnAgXSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkYgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRnNoYXJwIF0gPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkdzaGFycCBdID0gQWNjaWQuU2hhcnA7XG5cbiAgICAgICAgbWFwID0gc2hhcnBrZXlzW0FdO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5BIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkFzaGFycCBdID0gQWNjaWQuRmxhdDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5DIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkNzaGFycCBdID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRCBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Ec2hhcnAgXSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkYgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRnNoYXJwIF0gPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkdzaGFycCBdID0gQWNjaWQuTm9uZTtcblxuICAgICAgICBtYXAgPSBzaGFycGtleXNbRV07XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkEgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQXNoYXJwIF0gPSBBY2NpZC5GbGF0O1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5CIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkMgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQ3NoYXJwIF0gPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5EIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkRzaGFycCBdID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRSBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5GIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkZzaGFycCBdID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRyBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Hc2hhcnAgXSA9IEFjY2lkLk5vbmU7XG5cbiAgICAgICAgbWFwID0gc2hhcnBrZXlzW0JdO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5BIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkFzaGFycCBdID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5DIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkNzaGFycCBdID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRCBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Ec2hhcnAgXSA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkUgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRiBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Gc2hhcnAgXSA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkcgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuR3NoYXJwIF0gPSBBY2NpZC5Ob25lO1xuXG4gICAgICAgIC8qIEZsYXQga2V5cyAqL1xuICAgICAgICBtYXAgPSBmbGF0a2V5c1tDXTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQSBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Bc2hhcnAgXSA9IEFjY2lkLkZsYXQ7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkIgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQyBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Dc2hhcnAgXSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5EIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkRzaGFycCBdID0gQWNjaWQuU2hhcnA7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkUgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Gc2hhcnAgXSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkdzaGFycCBdID0gQWNjaWQuU2hhcnA7XG5cbiAgICAgICAgbWFwID0gZmxhdGtleXNbRl07XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkEgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQmZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5CIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkMgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQ3NoYXJwIF0gPSBBY2NpZC5TaGFycDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRCBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FZmxhdCBdICA9IEFjY2lkLkZsYXQ7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkUgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Gc2hhcnAgXSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkFmbGF0IF0gID0gQWNjaWQuRmxhdDtcblxuICAgICAgICBtYXAgPSBmbGF0a2V5c1tCZmxhdF07XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkEgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQmZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5CIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkMgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQ3NoYXJwIF0gPSBBY2NpZC5TaGFycDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRCBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FZmxhdCBdICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkUgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5Gc2hhcnAgXSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkFmbGF0IF0gID0gQWNjaWQuRmxhdDtcblxuICAgICAgICBtYXAgPSBmbGF0a2V5c1tFZmxhdF07XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkEgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQmZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5CIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkMgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRGZsYXQgXSAgPSBBY2NpZC5GbGF0O1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5EIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkVmbGF0IF0gID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRSBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5GIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkZzaGFycCBdID0gQWNjaWQuU2hhcnA7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkcgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQWZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuXG4gICAgICAgIG1hcCA9IGZsYXRrZXlzW0FmbGF0XTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQSBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5CZmxhdCBdICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkIgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQyBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5EZmxhdCBdICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkQgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRWZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkYgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRnNoYXJwIF0gPSBBY2NpZC5TaGFycDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRyBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5BZmxhdCBdICA9IEFjY2lkLk5vbmU7XG5cbiAgICAgICAgbWFwID0gZmxhdGtleXNbRGZsYXRdO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5BIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkJmbGF0IF0gID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQiBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5DIF0gICAgICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkRmbGF0IF0gID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRCBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FZmxhdCBdICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkUgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRiBdICAgICAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HZmxhdCBdICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkcgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQWZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuXG4gICAgICAgIG1hcCA9IGZsYXRrZXlzW0dmbGF0XTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQSBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5CZmxhdCBdICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkIgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuQyBdICAgICAgPSBBY2NpZC5OYXR1cmFsO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5EZmxhdCBdICA9IEFjY2lkLk5vbmU7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkQgXSAgICAgID0gQWNjaWQuTmF0dXJhbDtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuRWZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5FIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkYgXSAgICAgID0gQWNjaWQuTm9uZTtcbiAgICAgICAgbWFwWyBOb3RlU2NhbGUuR2ZsYXQgXSAgPSBBY2NpZC5Ob25lO1xuICAgICAgICBtYXBbIE5vdGVTY2FsZS5HIF0gICAgICA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIG1hcFsgTm90ZVNjYWxlLkFmbGF0IF0gID0gQWNjaWQuTm9uZTtcblxuXG4gICAgfVxuXG4gICAgLyoqIFRoZSBrZXltYXAgdGVsbHMgd2hhdCBhY2NpZGVudGFsIHN5bWJvbCBpcyBuZWVkZWQgZm9yIGVhY2hcbiAgICAgKiAgbm90ZSBpbiB0aGUgc2NhbGUuICBSZXNldCB0aGUga2V5bWFwIHRvIHRoZSB2YWx1ZXMgb2YgdGhlXG4gICAgICogIGtleSBzaWduYXR1cmUuXG4gICAgICovXG4gICAgcHJpdmF0ZSB2b2lkIFJlc2V0S2V5TWFwKClcbiAgICB7XG4gICAgICAgIEFjY2lkW10ga2V5O1xuICAgICAgICBpZiAobnVtX2ZsYXRzID4gMClcbiAgICAgICAgICAgIGtleSA9IGZsYXRrZXlzW251bV9mbGF0c107XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGtleSA9IHNoYXJwa2V5c1tudW1fc2hhcnBzXTtcblxuICAgICAgICBmb3IgKGludCBub3RlbnVtYmVyID0gMDsgbm90ZW51bWJlciA8IGtleW1hcC5MZW5ndGg7IG5vdGVudW1iZXIrKykge1xuICAgICAgICAgICAga2V5bWFwW25vdGVudW1iZXJdID0ga2V5W05vdGVTY2FsZS5Gcm9tTnVtYmVyKG5vdGVudW1iZXIpXTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqIENyZWF0ZSB0aGUgQWNjaWRlbnRhbCBzeW1ib2xzIGZvciB0aGlzIGtleSwgZm9yXG4gICAgICogdGhlIHRyZWJsZSBhbmQgYmFzcyBjbGVmcy5cbiAgICAgKi9cbiAgICBwcml2YXRlIHZvaWQgQ3JlYXRlU3ltYm9scygpIHtcbiAgICAgICAgaW50IGNvdW50ID0gTWF0aC5NYXgobnVtX3NoYXJwcywgbnVtX2ZsYXRzKTtcbiAgICAgICAgdHJlYmxlID0gbmV3IEFjY2lkU3ltYm9sW2NvdW50XTtcbiAgICAgICAgYmFzcyA9IG5ldyBBY2NpZFN5bWJvbFtjb3VudF07XG5cbiAgICAgICAgaWYgKGNvdW50ID09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIFdoaXRlTm90ZVtdIHRyZWJsZW5vdGVzID0gbnVsbDtcbiAgICAgICAgV2hpdGVOb3RlW10gYmFzc25vdGVzID0gbnVsbDtcblxuICAgICAgICBpZiAobnVtX3NoYXJwcyA+IDApICB7XG4gICAgICAgICAgICB0cmVibGVub3RlcyA9IG5ldyBXaGl0ZU5vdGVbXSB7XG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRiwgNSksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuQywgNSksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRywgNSksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRCwgNSksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuQSwgNiksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRSwgNSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBiYXNzbm90ZXMgPSBuZXcgV2hpdGVOb3RlW10ge1xuICAgICAgICAgICAgICAgIG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkYsIDMpLFxuICAgICAgICAgICAgICAgIG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkMsIDMpLFxuICAgICAgICAgICAgICAgIG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkcsIDMpLFxuICAgICAgICAgICAgICAgIG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkQsIDMpLFxuICAgICAgICAgICAgICAgIG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkEsIDQpLFxuICAgICAgICAgICAgICAgIG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkUsIDMpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG51bV9mbGF0cyA+IDApIHtcbiAgICAgICAgICAgIHRyZWJsZW5vdGVzID0gbmV3IFdoaXRlTm90ZVtdIHtcbiAgICAgICAgICAgICAgICBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5CLCA1KSxcbiAgICAgICAgICAgICAgICBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5FLCA1KSxcbiAgICAgICAgICAgICAgICBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5BLCA1KSxcbiAgICAgICAgICAgICAgICBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5ELCA1KSxcbiAgICAgICAgICAgICAgICBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5HLCA0KSxcbiAgICAgICAgICAgICAgICBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5DLCA1KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGJhc3Nub3RlcyA9IG5ldyBXaGl0ZU5vdGVbXSB7XG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuQiwgMyksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRSwgMyksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuQSwgMyksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRCwgMyksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRywgMiksXG4gICAgICAgICAgICAgICAgbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuQywgMylcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBBY2NpZCBhID0gQWNjaWQuTm9uZTtcbiAgICAgICAgaWYgKG51bV9zaGFycHMgPiAwKVxuICAgICAgICAgICAgYSA9IEFjY2lkLlNoYXJwO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBhID0gQWNjaWQuRmxhdDtcblxuICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHRyZWJsZVtpXSA9IG5ldyBBY2NpZFN5bWJvbChhLCB0cmVibGVub3Rlc1tpXSwgQ2xlZi5UcmVibGUpO1xuICAgICAgICAgICAgYmFzc1tpXSA9IG5ldyBBY2NpZFN5bWJvbChhLCBiYXNzbm90ZXNbaV0sIENsZWYuQmFzcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHRoZSBBY2NpZGVudGFsIHN5bWJvbHMgZm9yIGRpc3BsYXlpbmcgdGhpcyBrZXkgc2lnbmF0dXJlXG4gICAgICogZm9yIHRoZSBnaXZlbiBjbGVmLlxuICAgICAqL1xuICAgIHB1YmxpYyBBY2NpZFN5bWJvbFtdIEdldFN5bWJvbHMoQ2xlZiBjbGVmKSB7XG4gICAgICAgIGlmIChjbGVmID09IENsZWYuVHJlYmxlKVxuICAgICAgICAgICAgcmV0dXJuIHRyZWJsZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGJhc3M7XG4gICAgfVxuXG4gICAgLyoqIEdpdmVuIGEgbWlkaSBub3RlIG51bWJlciwgcmV0dXJuIHRoZSBhY2NpZGVudGFsIChpZiBhbnkpIFxuICAgICAqIHRoYXQgc2hvdWxkIGJlIHVzZWQgd2hlbiBkaXNwbGF5aW5nIHRoZSBub3RlIGluIHRoaXMga2V5IHNpZ25hdHVyZS5cbiAgICAgKlxuICAgICAqIFRoZSBjdXJyZW50IG1lYXN1cmUgaXMgYWxzbyByZXF1aXJlZC4gIE9uY2Ugd2UgcmV0dXJuIGFuXG4gICAgICogYWNjaWRlbnRhbCBmb3IgYSBtZWFzdXJlLCB0aGUgYWNjaWRlbnRhbCByZW1haW5zIGZvciB0aGVcbiAgICAgKiByZXN0IG9mIHRoZSBtZWFzdXJlLiBTbyB3ZSBtdXN0IHVwZGF0ZSB0aGUgY3VycmVudCBrZXltYXBcbiAgICAgKiB3aXRoIGFueSBuZXcgYWNjaWRlbnRhbHMgdGhhdCB3ZSByZXR1cm4uICBXaGVuIHdlIG1vdmUgdG8gYW5vdGhlclxuICAgICAqIG1lYXN1cmUsIHdlIHJlc2V0IHRoZSBrZXltYXAgYmFjayB0byB0aGUga2V5IHNpZ25hdHVyZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgQWNjaWQgR2V0QWNjaWRlbnRhbChpbnQgbm90ZW51bWJlciwgaW50IG1lYXN1cmUpIHtcbiAgICAgICAgaWYgKG1lYXN1cmUgIT0gcHJldm1lYXN1cmUpIHtcbiAgICAgICAgICAgIFJlc2V0S2V5TWFwKCk7XG4gICAgICAgICAgICBwcmV2bWVhc3VyZSA9IG1lYXN1cmU7XG4gICAgICAgIH1cblxuICAgICAgICBBY2NpZCByZXN1bHQgPSBrZXltYXBbbm90ZW51bWJlcl07XG4gICAgICAgIGlmIChyZXN1bHQgPT0gQWNjaWQuU2hhcnApIHtcbiAgICAgICAgICAgIGtleW1hcFtub3RlbnVtYmVyXSA9IEFjY2lkLk5vbmU7XG4gICAgICAgICAgICBrZXltYXBbbm90ZW51bWJlci0xXSA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocmVzdWx0ID09IEFjY2lkLkZsYXQpIHtcbiAgICAgICAgICAgIGtleW1hcFtub3RlbnVtYmVyXSA9IEFjY2lkLk5vbmU7XG4gICAgICAgICAgICBrZXltYXBbbm90ZW51bWJlcisxXSA9IEFjY2lkLk5hdHVyYWw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocmVzdWx0ID09IEFjY2lkLk5hdHVyYWwpIHtcbiAgICAgICAgICAgIGtleW1hcFtub3RlbnVtYmVyXSA9IEFjY2lkLk5vbmU7XG4gICAgICAgICAgICBpbnQgbmV4dGtleSA9IE5vdGVTY2FsZS5Gcm9tTnVtYmVyKG5vdGVudW1iZXIrMSk7XG4gICAgICAgICAgICBpbnQgcHJldmtleSA9IE5vdGVTY2FsZS5Gcm9tTnVtYmVyKG5vdGVudW1iZXItMSk7XG5cbiAgICAgICAgICAgIC8qIElmIHdlIGluc2VydCBhIG5hdHVyYWwsIHRoZW4gZWl0aGVyOlxuICAgICAgICAgICAgICogLSB0aGUgbmV4dCBrZXkgbXVzdCBnbyBiYWNrIHRvIHNoYXJwLFxuICAgICAgICAgICAgICogLSB0aGUgcHJldmlvdXMga2V5IG11c3QgZ28gYmFjayB0byBmbGF0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZiAoa2V5bWFwW25vdGVudW1iZXItMV0gPT0gQWNjaWQuTm9uZSAmJiBrZXltYXBbbm90ZW51bWJlcisxXSA9PSBBY2NpZC5Ob25lICYmXG4gICAgICAgICAgICAgICAgTm90ZVNjYWxlLklzQmxhY2tLZXkobmV4dGtleSkgJiYgTm90ZVNjYWxlLklzQmxhY2tLZXkocHJldmtleSkgKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAobnVtX2ZsYXRzID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAga2V5bWFwW25vdGVudW1iZXIrMV0gPSBBY2NpZC5TaGFycDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGtleW1hcFtub3RlbnVtYmVyLTFdID0gQWNjaWQuRmxhdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXltYXBbbm90ZW51bWJlci0xXSA9PSBBY2NpZC5Ob25lICYmIE5vdGVTY2FsZS5Jc0JsYWNrS2V5KHByZXZrZXkpKSB7XG4gICAgICAgICAgICAgICAga2V5bWFwW25vdGVudW1iZXItMV0gPSBBY2NpZC5GbGF0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5bWFwW25vdGVudW1iZXIrMV0gPT0gQWNjaWQuTm9uZSAmJiBOb3RlU2NhbGUuSXNCbGFja0tleShuZXh0a2V5KSkge1xuICAgICAgICAgICAgICAgIGtleW1hcFtub3RlbnVtYmVyKzFdID0gQWNjaWQuU2hhcnA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvKiBTaG91bGRuJ3QgZ2V0IGhlcmUgKi9cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuXG4gICAgLyoqIEdpdmVuIGEgbWlkaSBub3RlIG51bWJlciwgcmV0dXJuIHRoZSB3aGl0ZSBub3RlICh0aGVcbiAgICAgKiBub24tc2hhcnAvbm9uLWZsYXQgbm90ZSkgdGhhdCBzaG91bGQgYmUgdXNlZCB3aGVuIGRpc3BsYXlpbmdcbiAgICAgKiB0aGlzIG5vdGUgaW4gdGhpcyBrZXkgc2lnbmF0dXJlLiAgVGhpcyBzaG91bGQgYmUgY2FsbGVkXG4gICAgICogYmVmb3JlIGNhbGxpbmcgR2V0QWNjaWRlbnRhbCgpLlxuICAgICAqL1xuICAgIHB1YmxpYyBXaGl0ZU5vdGUgR2V0V2hpdGVOb3RlKGludCBub3RlbnVtYmVyKSB7XG4gICAgICAgIGludCBub3Rlc2NhbGUgPSBOb3RlU2NhbGUuRnJvbU51bWJlcihub3RlbnVtYmVyKTtcbiAgICAgICAgaW50IG9jdGF2ZSA9IChub3RlbnVtYmVyICsgMykgLyAxMiAtIDE7XG4gICAgICAgIGludCBsZXR0ZXIgPSAwO1xuXG4gICAgICAgIGludFtdIHdob2xlX3NoYXJwcyA9IHsgXG4gICAgICAgICAgICBXaGl0ZU5vdGUuQSwgV2hpdGVOb3RlLkEsIFxuICAgICAgICAgICAgV2hpdGVOb3RlLkIsIFxuICAgICAgICAgICAgV2hpdGVOb3RlLkMsIFdoaXRlTm90ZS5DLFxuICAgICAgICAgICAgV2hpdGVOb3RlLkQsIFdoaXRlTm90ZS5ELFxuICAgICAgICAgICAgV2hpdGVOb3RlLkUsXG4gICAgICAgICAgICBXaGl0ZU5vdGUuRiwgV2hpdGVOb3RlLkYsXG4gICAgICAgICAgICBXaGl0ZU5vdGUuRywgV2hpdGVOb3RlLkdcbiAgICAgICAgfTtcblxuICAgICAgICBpbnRbXSB3aG9sZV9mbGF0cyA9IHtcbiAgICAgICAgICAgIFdoaXRlTm90ZS5BLCBcbiAgICAgICAgICAgIFdoaXRlTm90ZS5CLCBXaGl0ZU5vdGUuQixcbiAgICAgICAgICAgIFdoaXRlTm90ZS5DLFxuICAgICAgICAgICAgV2hpdGVOb3RlLkQsIFdoaXRlTm90ZS5ELFxuICAgICAgICAgICAgV2hpdGVOb3RlLkUsIFdoaXRlTm90ZS5FLFxuICAgICAgICAgICAgV2hpdGVOb3RlLkYsXG4gICAgICAgICAgICBXaGl0ZU5vdGUuRywgV2hpdGVOb3RlLkcsXG4gICAgICAgICAgICBXaGl0ZU5vdGUuQVxuICAgICAgICB9O1xuXG4gICAgICAgIEFjY2lkIGFjY2lkID0ga2V5bWFwW25vdGVudW1iZXJdO1xuICAgICAgICBpZiAoYWNjaWQgPT0gQWNjaWQuRmxhdCkge1xuICAgICAgICAgICAgbGV0dGVyID0gd2hvbGVfZmxhdHNbbm90ZXNjYWxlXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChhY2NpZCA9PSBBY2NpZC5TaGFycCkge1xuICAgICAgICAgICAgbGV0dGVyID0gd2hvbGVfc2hhcnBzW25vdGVzY2FsZV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYWNjaWQgPT0gQWNjaWQuTmF0dXJhbCkge1xuICAgICAgICAgICAgbGV0dGVyID0gd2hvbGVfc2hhcnBzW25vdGVzY2FsZV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYWNjaWQgPT0gQWNjaWQuTm9uZSkge1xuICAgICAgICAgICAgbGV0dGVyID0gd2hvbGVfc2hhcnBzW25vdGVzY2FsZV07XG5cbiAgICAgICAgICAgIC8qIElmIHRoZSBub3RlIG51bWJlciBpcyBhIHNoYXJwL2ZsYXQsIGFuZCB0aGVyZSdzIG5vIGFjY2lkZW50YWwsXG4gICAgICAgICAgICAgKiBkZXRlcm1pbmUgdGhlIHdoaXRlIG5vdGUgYnkgc2VlaW5nIHdoZXRoZXIgdGhlIHByZXZpb3VzIG9yIG5leHQgbm90ZVxuICAgICAgICAgICAgICogaXMgYSBuYXR1cmFsLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZiAoTm90ZVNjYWxlLklzQmxhY2tLZXkobm90ZXNjYWxlKSkge1xuICAgICAgICAgICAgICAgIGlmIChrZXltYXBbbm90ZW51bWJlci0xXSA9PSBBY2NpZC5OYXR1cmFsICYmIFxuICAgICAgICAgICAgICAgICAgICBrZXltYXBbbm90ZW51bWJlcisxXSA9PSBBY2NpZC5OYXR1cmFsKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG51bV9mbGF0cyA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldHRlciA9IHdob2xlX2ZsYXRzW25vdGVzY2FsZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXR0ZXIgPSB3aG9sZV9zaGFycHNbbm90ZXNjYWxlXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrZXltYXBbbm90ZW51bWJlci0xXSA9PSBBY2NpZC5OYXR1cmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldHRlciA9IHdob2xlX3NoYXJwc1tub3Rlc2NhbGVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrZXltYXBbbm90ZW51bWJlcisxXSA9PSBBY2NpZC5OYXR1cmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldHRlciA9IHdob2xlX2ZsYXRzW25vdGVzY2FsZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyogVGhlIGFib3ZlIGFsZ29yaXRobSBkb2Vzbid0IHF1aXRlIHdvcmsgZm9yIEctZmxhdCBtYWpvci5cbiAgICAgICAgICogSGFuZGxlIGl0IGhlcmUuXG4gICAgICAgICAqL1xuICAgICAgICBpZiAobnVtX2ZsYXRzID09IEdmbGF0ICYmIG5vdGVzY2FsZSA9PSBOb3RlU2NhbGUuQikge1xuICAgICAgICAgICAgbGV0dGVyID0gV2hpdGVOb3RlLkM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG51bV9mbGF0cyA9PSBHZmxhdCAmJiBub3Rlc2NhbGUgPT0gTm90ZVNjYWxlLkJmbGF0KSB7XG4gICAgICAgICAgICBsZXR0ZXIgPSBXaGl0ZU5vdGUuQjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChudW1fZmxhdHMgPiAwICYmIG5vdGVzY2FsZSA9PSBOb3RlU2NhbGUuQWZsYXQpIHtcbiAgICAgICAgICAgIG9jdGF2ZSsrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBXaGl0ZU5vdGUobGV0dGVyLCBvY3RhdmUpO1xuICAgIH1cblxuXG4gICAgLyoqIEd1ZXNzIHRoZSBrZXkgc2lnbmF0dXJlLCBnaXZlbiB0aGUgbWlkaSBub3RlIG51bWJlcnMgdXNlZCBpblxuICAgICAqIHRoZSBzb25nLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgS2V5U2lnbmF0dXJlIEd1ZXNzKExpc3Q8aW50PiBub3Rlcykge1xuICAgICAgICBDcmVhdGVBY2NpZGVudGFsTWFwcygpO1xuXG4gICAgICAgIC8qIEdldCB0aGUgZnJlcXVlbmN5IGNvdW50IG9mIGVhY2ggbm90ZSBpbiB0aGUgMTItbm90ZSBzY2FsZSAqL1xuICAgICAgICBpbnRbXSBub3RlY291bnQgPSBuZXcgaW50WzEyXTtcbiAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCBub3Rlcy5Db3VudDsgaSsrKSB7XG4gICAgICAgICAgICBpbnQgbm90ZW51bWJlciA9IG5vdGVzW2ldO1xuICAgICAgICAgICAgaW50IG5vdGVzY2FsZSA9IChub3RlbnVtYmVyICsgMykgJSAxMjtcbiAgICAgICAgICAgIG5vdGVjb3VudFtub3Rlc2NhbGVdICs9IDE7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBGb3IgZWFjaCBrZXkgc2lnbmF0dXJlLCBjb3VudCB0aGUgdG90YWwgbnVtYmVyIG9mIGFjY2lkZW50YWxzXG4gICAgICAgICAqIG5lZWRlZCB0byBkaXNwbGF5IGFsbCB0aGUgbm90ZXMuICBDaG9vc2UgdGhlIGtleSBzaWduYXR1cmVcbiAgICAgICAgICogd2l0aCB0aGUgZmV3ZXN0IGFjY2lkZW50YWxzLlxuICAgICAgICAgKi9cbiAgICAgICAgaW50IGJlc3RrZXkgPSAwO1xuICAgICAgICBib29sIGlzX2Jlc3Rfc2hhcnAgPSB0cnVlO1xuICAgICAgICBpbnQgc21hbGxlc3RfYWNjaWRfY291bnQgPSBub3Rlcy5Db3VudDtcbiAgICAgICAgaW50IGtleTtcblxuICAgICAgICBmb3IgKGtleSA9IDA7IGtleSA8IDY7IGtleSsrKSB7XG4gICAgICAgICAgICBpbnQgYWNjaWRfY291bnQgPSAwO1xuICAgICAgICAgICAgZm9yIChpbnQgbiA9IDA7IG4gPCAxMjsgbisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNoYXJwa2V5c1trZXldW25dICE9IEFjY2lkLk5vbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjaWRfY291bnQgKz0gbm90ZWNvdW50W25dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhY2NpZF9jb3VudCA8IHNtYWxsZXN0X2FjY2lkX2NvdW50KSB7XG4gICAgICAgICAgICAgICAgc21hbGxlc3RfYWNjaWRfY291bnQgPSBhY2NpZF9jb3VudDtcbiAgICAgICAgICAgICAgICBiZXN0a2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIGlzX2Jlc3Rfc2hhcnAgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChrZXkgPSAwOyBrZXkgPCA3OyBrZXkrKykge1xuICAgICAgICAgICAgaW50IGFjY2lkX2NvdW50ID0gMDtcbiAgICAgICAgICAgIGZvciAoaW50IG4gPSAwOyBuIDwgMTI7IG4rKykge1xuICAgICAgICAgICAgICAgIGlmIChmbGF0a2V5c1trZXldW25dICE9IEFjY2lkLk5vbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjaWRfY291bnQgKz0gbm90ZWNvdW50W25dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhY2NpZF9jb3VudCA8IHNtYWxsZXN0X2FjY2lkX2NvdW50KSB7XG4gICAgICAgICAgICAgICAgc21hbGxlc3RfYWNjaWRfY291bnQgPSBhY2NpZF9jb3VudDtcbiAgICAgICAgICAgICAgICBiZXN0a2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIGlzX2Jlc3Rfc2hhcnAgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNfYmVzdF9zaGFycCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBLZXlTaWduYXR1cmUoYmVzdGtleSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEtleVNpZ25hdHVyZSgwLCBiZXN0a2V5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdHJ1ZSBpZiB0aGlzIGtleSBzaWduYXR1cmUgaXMgZXF1YWwgdG8ga2V5IHNpZ25hdHVyZSBrICovXG4gICAgcHVibGljIGJvb2wgRXF1YWxzKEtleVNpZ25hdHVyZSBrKSB7XG4gICAgICAgIGlmIChrLm51bV9zaGFycHMgPT0gbnVtX3NoYXJwcyAmJiBrLm51bV9mbGF0cyA9PSBudW1fZmxhdHMpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qIFJldHVybiB0aGUgTWFqb3IgS2V5IG9mIHRoaXMgS2V5IFNpZ25hdHVyZSAqL1xuICAgIHB1YmxpYyBpbnQgTm90ZXNjYWxlKCkge1xuICAgICAgICBpbnRbXSBmbGF0bWFqb3IgPSB7XG4gICAgICAgICAgICBOb3RlU2NhbGUuQywgTm90ZVNjYWxlLkYsIE5vdGVTY2FsZS5CZmxhdCwgTm90ZVNjYWxlLkVmbGF0LFxuICAgICAgICAgICAgTm90ZVNjYWxlLkFmbGF0LCBOb3RlU2NhbGUuRGZsYXQsIE5vdGVTY2FsZS5HZmxhdCwgTm90ZVNjYWxlLkIgXG4gICAgICAgIH07XG5cbiAgICAgICAgaW50W10gc2hhcnBtYWpvciA9IHtcbiAgICAgICAgICAgIE5vdGVTY2FsZS5DLCBOb3RlU2NhbGUuRywgTm90ZVNjYWxlLkQsIE5vdGVTY2FsZS5BLCBOb3RlU2NhbGUuRSxcbiAgICAgICAgICAgIE5vdGVTY2FsZS5CLCBOb3RlU2NhbGUuRnNoYXJwLCBOb3RlU2NhbGUuQ3NoYXJwLCBOb3RlU2NhbGUuR3NoYXJwLFxuICAgICAgICAgICAgTm90ZVNjYWxlLkRzaGFycFxuICAgICAgICB9O1xuICAgICAgICBpZiAobnVtX2ZsYXRzID4gMClcbiAgICAgICAgICAgIHJldHVybiBmbGF0bWFqb3JbbnVtX2ZsYXRzXTtcbiAgICAgICAgZWxzZSBcbiAgICAgICAgICAgIHJldHVybiBzaGFycG1ham9yW251bV9zaGFycHNdO1xuICAgIH1cblxuICAgIC8qIENvbnZlcnQgYSBNYWpvciBLZXkgaW50byBhIHN0cmluZyAqL1xuICAgIHB1YmxpYyBzdGF0aWMgc3RyaW5nIEtleVRvU3RyaW5nKGludCBub3Rlc2NhbGUpIHtcbiAgICAgICAgc3dpdGNoIChub3Rlc2NhbGUpIHtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkE6ICAgICByZXR1cm4gXCJBIG1ham9yLCBGIyBtaW5vclwiIDtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkJmbGF0OiByZXR1cm4gXCJCLWZsYXQgbWFqb3IsIEcgbWlub3JcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkI6ICAgICByZXR1cm4gXCJCIG1ham9yLCBBLWZsYXQgbWlub3JcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkM6ICAgICByZXR1cm4gXCJDIG1ham9yLCBBIG1pbm9yXCI7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5EZmxhdDogcmV0dXJuIFwiRC1mbGF0IG1ham9yLCBCLWZsYXQgbWlub3JcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkQ6ICAgICByZXR1cm4gXCJEIG1ham9yLCBCIG1pbm9yXCI7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5FZmxhdDogcmV0dXJuIFwiRS1mbGF0IG1ham9yLCBDIG1pbm9yXCI7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5FOiAgICAgcmV0dXJuIFwiRSBtYWpvciwgQyMgbWlub3JcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkY6ICAgICByZXR1cm4gXCJGIG1ham9yLCBEIG1pbm9yXCI7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5HZmxhdDogcmV0dXJuIFwiRy1mbGF0IG1ham9yLCBFLWZsYXQgbWlub3JcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkc6ICAgICByZXR1cm4gXCJHIG1ham9yLCBFIG1pbm9yXCI7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5BZmxhdDogcmV0dXJuIFwiQS1mbGF0IG1ham9yLCBGIG1pbm9yXCI7XG4gICAgICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBrZXkgc2lnbmF0dXJlLlxuICAgICAqIFdlIG9ubHkgcmV0dXJuIHRoZSBtYWpvciBrZXkgc2lnbmF0dXJlLCBub3QgdGhlIG1pbm9yIG9uZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgc3RyaW5nIFRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gS2V5VG9TdHJpbmcoIE5vdGVzY2FsZSgpICk7XG4gICAgfVxuXG5cbn1cblxufVxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAwNy0yMDEyIE1hZGhhdiBWYWlkeWFuYXRoYW5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuXG51c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uSU87XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyB7XG5cbi8qKiBAY2xhc3MgTHlyaWNTeW1ib2xcbiAqICBBIGx5cmljIGNvbnRhaW5zIHRoZSBseXJpYyB0byBkaXNwbGF5LCB0aGUgc3RhcnQgdGltZSB0aGUgbHlyaWMgb2NjdXJzIGF0LFxuICogIHRoZSB0aGUgeC1jb29yZGluYXRlIHdoZXJlIGl0IHdpbGwgYmUgZGlzcGxheWVkLlxuICovXG5wdWJsaWMgY2xhc3MgTHlyaWNTeW1ib2wge1xuICAgIHByaXZhdGUgaW50IHN0YXJ0dGltZTsgICAvKiogVGhlIHN0YXJ0IHRpbWUsIGluIHB1bHNlcyAqL1xuICAgIHByaXZhdGUgc3RyaW5nIHRleHQ7ICAgICAvKiogVGhlIGx5cmljIHRleHQgKi9cbiAgICBwcml2YXRlIGludCB4OyAgICAgICAgICAgLyoqIFRoZSB4IChob3Jpem9udGFsKSBwb3NpdGlvbiB3aXRoaW4gdGhlIHN0YWZmICovXG5cbiAgICBwdWJsaWMgTHlyaWNTeW1ib2woaW50IHN0YXJ0dGltZSwgc3RyaW5nIHRleHQpIHtcbiAgICAgICAgdGhpcy5zdGFydHRpbWUgPSBzdGFydHRpbWU7IFxuICAgICAgICB0aGlzLnRleHQgPSB0ZXh0O1xuICAgIH1cbiAgICAgXG4gICAgcHVibGljIGludCBTdGFydFRpbWUge1xuICAgICAgICBnZXQgeyByZXR1cm4gc3RhcnR0aW1lOyB9XG4gICAgICAgIHNldCB7IHN0YXJ0dGltZSA9IHZhbHVlOyB9XG4gICAgfVxuXG4gICAgcHVibGljIHN0cmluZyBUZXh0IHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHRleHQ7IH1cbiAgICAgICAgc2V0IHsgdGV4dCA9IHZhbHVlOyB9XG4gICAgfVxuXG4gICAgcHVibGljIGludCBYIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHg7IH1cbiAgICAgICAgc2V0IHsgeCA9IHZhbHVlOyB9XG4gICAgfVxuXG4gICAgcHVibGljIGludCBNaW5XaWR0aCB7XG4gICAgICAgIGdldCB7IHJldHVybiBtaW5XaWR0aCgpOyB9XG4gICAgfVxuXG4gICAgLyogUmV0dXJuIHRoZSBtaW5pbXVtIHdpZHRoIGluIHBpeGVscyBuZWVkZWQgdG8gZGlzcGxheSB0aGlzIGx5cmljLlxuICAgICAqIFRoaXMgaXMgYW4gZXN0aW1hdGlvbiwgbm90IGV4YWN0LlxuICAgICAqL1xuICAgIHByaXZhdGUgaW50IG1pbldpZHRoKCkgeyBcbiAgICAgICAgZmxvYXQgd2lkdGhQZXJDaGFyID0gU2hlZXRNdXNpYy5MZXR0ZXJGb250LkdldEhlaWdodCgpICogMi4wZi8zLjBmO1xuICAgICAgICBmbG9hdCB3aWR0aCA9IHRleHQuTGVuZ3RoICogd2lkdGhQZXJDaGFyO1xuICAgICAgICBpZiAodGV4dC5JbmRleE9mKFwiaVwiKSA+PSAwKSB7XG4gICAgICAgICAgICB3aWR0aCAtPSB3aWR0aFBlckNoYXIvMi4wZjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGV4dC5JbmRleE9mKFwialwiKSA+PSAwKSB7XG4gICAgICAgICAgICB3aWR0aCAtPSB3aWR0aFBlckNoYXIvMi4wZjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGV4dC5JbmRleE9mKFwibFwiKSA+PSAwKSB7XG4gICAgICAgICAgICB3aWR0aCAtPSB3aWR0aFBlckNoYXIvMi4wZjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKGludCl3aWR0aDtcbiAgICB9XG5cbiAgICBwdWJsaWMgb3ZlcnJpZGUgXG4gICAgc3RyaW5nIFRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gc3RyaW5nLkZvcm1hdChcIkx5cmljIHN0YXJ0PXswfSB4PXsxfSB0ZXh0PXsyfVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydHRpbWUsIHgsIHRleHQpO1xuICAgIH1cblxufVxuXG5cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMiBNYWRoYXYgVmFpZHlhbmF0aGFuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cblxudXNpbmcgU3lzdGVtO1xudXNpbmcgU3lzdGVtLklPO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG51c2luZyBTeXN0ZW0uVGV4dDtcblxuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xuXG4vKiogQGNsYXNzIE1pZGlFdmVudFxuICogQSBNaWRpRXZlbnQgcmVwcmVzZW50cyBhIHNpbmdsZSBldmVudCAoc3VjaCBhcyBFdmVudE5vdGVPbikgaW4gdGhlXG4gKiBNaWRpIGZpbGUuIEl0IGluY2x1ZGVzIHRoZSBkZWx0YSB0aW1lIG9mIHRoZSBldmVudC5cbiAqL1xucHVibGljIGNsYXNzIE1pZGlFdmVudCA6IElDb21wYXJlcjxNaWRpRXZlbnQ+IHtcblxuICAgIHB1YmxpYyBpbnQgICAgRGVsdGFUaW1lOyAgICAgLyoqIFRoZSB0aW1lIGJldHdlZW4gdGhlIHByZXZpb3VzIGV2ZW50IGFuZCB0aGlzIG9uICovXG4gICAgcHVibGljIGludCAgICBTdGFydFRpbWU7ICAgICAvKiogVGhlIGFic29sdXRlIHRpbWUgdGhpcyBldmVudCBvY2N1cnMgKi9cbiAgICBwdWJsaWMgYm9vbCAgIEhhc0V2ZW50ZmxhZzsgIC8qKiBGYWxzZSBpZiB0aGlzIGlzIHVzaW5nIHRoZSBwcmV2aW91cyBldmVudGZsYWcgKi9cbiAgICBwdWJsaWMgYnl0ZSAgIEV2ZW50RmxhZzsgICAgIC8qKiBOb3RlT24sIE5vdGVPZmYsIGV0Yy4gIEZ1bGwgbGlzdCBpcyBpbiBjbGFzcyBNaWRpRmlsZSAqL1xuICAgIHB1YmxpYyBieXRlICAgQ2hhbm5lbDsgICAgICAgLyoqIFRoZSBjaGFubmVsIHRoaXMgZXZlbnQgb2NjdXJzIG9uICovIFxuXG4gICAgcHVibGljIGJ5dGUgICBOb3RlbnVtYmVyOyAgICAvKiogVGhlIG5vdGUgbnVtYmVyICAqL1xuICAgIHB1YmxpYyBieXRlICAgVmVsb2NpdHk7ICAgICAgLyoqIFRoZSB2b2x1bWUgb2YgdGhlIG5vdGUgKi9cbiAgICBwdWJsaWMgYnl0ZSAgIEluc3RydW1lbnQ7ICAgIC8qKiBUaGUgaW5zdHJ1bWVudCAqL1xuICAgIHB1YmxpYyBieXRlICAgS2V5UHJlc3N1cmU7ICAgLyoqIFRoZSBrZXkgcHJlc3N1cmUgKi9cbiAgICBwdWJsaWMgYnl0ZSAgIENoYW5QcmVzc3VyZTsgIC8qKiBUaGUgY2hhbm5lbCBwcmVzc3VyZSAqL1xuICAgIHB1YmxpYyBieXRlICAgQ29udHJvbE51bTsgICAgLyoqIFRoZSBjb250cm9sbGVyIG51bWJlciAqL1xuICAgIHB1YmxpYyBieXRlICAgQ29udHJvbFZhbHVlOyAgLyoqIFRoZSBjb250cm9sbGVyIHZhbHVlICovXG4gICAgcHVibGljIHVzaG9ydCBQaXRjaEJlbmQ7ICAgICAvKiogVGhlIHBpdGNoIGJlbmQgdmFsdWUgKi9cbiAgICBwdWJsaWMgYnl0ZSAgIE51bWVyYXRvcjsgICAgIC8qKiBUaGUgbnVtZXJhdG9yLCBmb3IgVGltZVNpZ25hdHVyZSBtZXRhIGV2ZW50cyAqL1xuICAgIHB1YmxpYyBieXRlICAgRGVub21pbmF0b3I7ICAgLyoqIFRoZSBkZW5vbWluYXRvciwgZm9yIFRpbWVTaWduYXR1cmUgbWV0YSBldmVudHMgKi9cbiAgICBwdWJsaWMgaW50ICAgIFRlbXBvOyAgICAgICAgIC8qKiBUaGUgdGVtcG8sIGZvciBUZW1wbyBtZXRhIGV2ZW50cyAqL1xuICAgIHB1YmxpYyBieXRlICAgTWV0YWV2ZW50OyAgICAgLyoqIFRoZSBtZXRhZXZlbnQsIHVzZWQgaWYgZXZlbnRmbGFnIGlzIE1ldGFFdmVudCAqL1xuICAgIHB1YmxpYyBpbnQgICAgTWV0YWxlbmd0aDsgICAgLyoqIFRoZSBtZXRhZXZlbnQgbGVuZ3RoICAqL1xuICAgIHB1YmxpYyBieXRlW10gVmFsdWU7ICAgICAgICAgLyoqIFRoZSByYXcgYnl0ZSB2YWx1ZSwgZm9yIFN5c2V4IGFuZCBtZXRhIGV2ZW50cyAqL1xuXG4gICAgcHVibGljIE1pZGlFdmVudCgpIHtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIGEgY29weSBvZiB0aGlzIGV2ZW50ICovXG4gICAgcHVibGljIE1pZGlFdmVudCBDbG9uZSgpIHtcbiAgICAgICAgTWlkaUV2ZW50IG1ldmVudD0gbmV3IE1pZGlFdmVudCgpO1xuICAgICAgICBtZXZlbnQuRGVsdGFUaW1lID0gRGVsdGFUaW1lO1xuICAgICAgICBtZXZlbnQuU3RhcnRUaW1lID0gU3RhcnRUaW1lO1xuICAgICAgICBtZXZlbnQuSGFzRXZlbnRmbGFnID0gSGFzRXZlbnRmbGFnO1xuICAgICAgICBtZXZlbnQuRXZlbnRGbGFnID0gRXZlbnRGbGFnO1xuICAgICAgICBtZXZlbnQuQ2hhbm5lbCA9IENoYW5uZWw7XG4gICAgICAgIG1ldmVudC5Ob3RlbnVtYmVyID0gTm90ZW51bWJlcjtcbiAgICAgICAgbWV2ZW50LlZlbG9jaXR5ID0gVmVsb2NpdHk7XG4gICAgICAgIG1ldmVudC5JbnN0cnVtZW50ID0gSW5zdHJ1bWVudDtcbiAgICAgICAgbWV2ZW50LktleVByZXNzdXJlID0gS2V5UHJlc3N1cmU7XG4gICAgICAgIG1ldmVudC5DaGFuUHJlc3N1cmUgPSBDaGFuUHJlc3N1cmU7XG4gICAgICAgIG1ldmVudC5Db250cm9sTnVtID0gQ29udHJvbE51bTtcbiAgICAgICAgbWV2ZW50LkNvbnRyb2xWYWx1ZSA9IENvbnRyb2xWYWx1ZTtcbiAgICAgICAgbWV2ZW50LlBpdGNoQmVuZCA9IFBpdGNoQmVuZDtcbiAgICAgICAgbWV2ZW50Lk51bWVyYXRvciA9IE51bWVyYXRvcjtcbiAgICAgICAgbWV2ZW50LkRlbm9taW5hdG9yID0gRGVub21pbmF0b3I7XG4gICAgICAgIG1ldmVudC5UZW1wbyA9IFRlbXBvO1xuICAgICAgICBtZXZlbnQuTWV0YWV2ZW50ID0gTWV0YWV2ZW50O1xuICAgICAgICBtZXZlbnQuTWV0YWxlbmd0aCA9IE1ldGFsZW5ndGg7XG4gICAgICAgIG1ldmVudC5WYWx1ZSA9IFZhbHVlO1xuICAgICAgICByZXR1cm4gbWV2ZW50O1xuICAgIH1cblxuICAgIC8qKiBDb21wYXJlIHR3byBNaWRpRXZlbnRzIGJhc2VkIG9uIHRoZWlyIHN0YXJ0IHRpbWVzLiAqL1xuICAgIHB1YmxpYyBpbnQgQ29tcGFyZShNaWRpRXZlbnQgeCwgTWlkaUV2ZW50IHkpIHtcbiAgICAgICAgaWYgKHguU3RhcnRUaW1lID09IHkuU3RhcnRUaW1lKSB7XG4gICAgICAgICAgICBpZiAoeC5FdmVudEZsYWcgPT0geS5FdmVudEZsYWcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geC5Ob3RlbnVtYmVyIC0geS5Ob3RlbnVtYmVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHguRXZlbnRGbGFnIC0geS5FdmVudEZsYWc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4geC5TdGFydFRpbWUgLSB5LlN0YXJ0VGltZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxufSAgLyogRW5kIG5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyAqL1xuXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTIgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5JTztcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljXG57XG5cbiAgICAvKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNsYXNzZXMgZm9yIHBhcnNpbmcgYW5kIG1vZGlmeWluZ1xuICAgICAqIE1JREkgbXVzaWMgZmlsZXMuXG4gICAgICovXG5cbiAgICAvKiBNSURJIGZpbGUgZm9ybWF0LlxuICAgICAqXG4gICAgICogVGhlIE1pZGkgRmlsZSBmb3JtYXQgaXMgZGVzY3JpYmVkIGJlbG93LiAgVGhlIGRlc2NyaXB0aW9uIHVzZXNcbiAgICAgKiB0aGUgZm9sbG93aW5nIGFiYnJldmlhdGlvbnMuXG4gICAgICpcbiAgICAgKiB1MSAgICAgLSBPbmUgYnl0ZVxuICAgICAqIHUyICAgICAtIFR3byBieXRlcyAoYmlnIGVuZGlhbilcbiAgICAgKiB1NCAgICAgLSBGb3VyIGJ5dGVzIChiaWcgZW5kaWFuKVxuICAgICAqIHZhcmxlbiAtIEEgdmFyaWFibGUgbGVuZ3RoIGludGVnZXIsIHRoYXQgY2FuIGJlIDEgdG8gNCBieXRlcy4gVGhlIFxuICAgICAqICAgICAgICAgIGludGVnZXIgZW5kcyB3aGVuIHlvdSBlbmNvdW50ZXIgYSBieXRlIHRoYXQgZG9lc24ndCBoYXZlIFxuICAgICAqICAgICAgICAgIHRoZSA4dGggYml0IHNldCAoYSBieXRlIGxlc3MgdGhhbiAweDgwKS5cbiAgICAgKiBsZW4/ICAgLSBUaGUgbGVuZ3RoIG9mIHRoZSBkYXRhIGRlcGVuZHMgb24gc29tZSBjb2RlXG4gICAgICogICAgICAgICAgXG4gICAgICpcbiAgICAgKiBUaGUgTWlkaSBmaWxlcyBiZWdpbnMgd2l0aCB0aGUgbWFpbiBNaWRpIGhlYWRlclxuICAgICAqIHU0ID0gVGhlIGZvdXIgYXNjaWkgY2hhcmFjdGVycyAnTVRoZCdcbiAgICAgKiB1NCA9IFRoZSBsZW5ndGggb2YgdGhlIE1UaGQgaGVhZGVyID0gNiBieXRlc1xuICAgICAqIHUyID0gMCBpZiB0aGUgZmlsZSBjb250YWlucyBhIHNpbmdsZSB0cmFja1xuICAgICAqICAgICAgMSBpZiB0aGUgZmlsZSBjb250YWlucyBvbmUgb3IgbW9yZSBzaW11bHRhbmVvdXMgdHJhY2tzXG4gICAgICogICAgICAyIGlmIHRoZSBmaWxlIGNvbnRhaW5zIG9uZSBvciBtb3JlIGluZGVwZW5kZW50IHRyYWNrc1xuICAgICAqIHUyID0gbnVtYmVyIG9mIHRyYWNrc1xuICAgICAqIHUyID0gaWYgPiAgMCwgdGhlIG51bWJlciBvZiBwdWxzZXMgcGVyIHF1YXJ0ZXIgbm90ZVxuICAgICAqICAgICAgaWYgPD0gMCwgdGhlbiA/Pz9cbiAgICAgKlxuICAgICAqIE5leHQgY29tZSB0aGUgaW5kaXZpZHVhbCBNaWRpIHRyYWNrcy4gIFRoZSB0b3RhbCBudW1iZXIgb2YgTWlkaVxuICAgICAqIHRyYWNrcyB3YXMgZ2l2ZW4gYWJvdmUsIGluIHRoZSBNVGhkIGhlYWRlci4gIEVhY2ggdHJhY2sgc3RhcnRzXG4gICAgICogd2l0aCBhIGhlYWRlcjpcbiAgICAgKlxuICAgICAqIHU0ID0gVGhlIGZvdXIgYXNjaWkgY2hhcmFjdGVycyAnTVRyaydcbiAgICAgKiB1NCA9IEFtb3VudCBvZiB0cmFjayBkYXRhLCBpbiBieXRlcy5cbiAgICAgKiBcbiAgICAgKiBUaGUgdHJhY2sgZGF0YSBjb25zaXN0cyBvZiBhIHNlcmllcyBvZiBNaWRpIGV2ZW50cy4gIEVhY2ggTWlkaSBldmVudFxuICAgICAqIGhhcyB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiAgICAgKlxuICAgICAqIHZhcmxlbiAgLSBUaGUgdGltZSBiZXR3ZWVuIHRoZSBwcmV2aW91cyBldmVudCBhbmQgdGhpcyBldmVudCwgbWVhc3VyZWRcbiAgICAgKiAgICAgICAgICAgaW4gXCJwdWxzZXNcIi4gIFRoZSBudW1iZXIgb2YgcHVsc2VzIHBlciBxdWFydGVyIG5vdGUgaXMgZ2l2ZW5cbiAgICAgKiAgICAgICAgICAgaW4gdGhlIE1UaGQgaGVhZGVyLlxuICAgICAqIHUxICAgICAgLSBUaGUgRXZlbnQgY29kZSwgYWx3YXlzIGJldHdlZSAweDgwIGFuZCAweEZGXG4gICAgICogbGVuPyAgICAtIFRoZSBldmVudCBkYXRhLiAgVGhlIGxlbmd0aCBvZiB0aGlzIGRhdGEgaXMgZGV0ZXJtaW5lZCBieSB0aGVcbiAgICAgKiAgICAgICAgICAgZXZlbnQgY29kZS4gIFRoZSBmaXJzdCBieXRlIG9mIHRoZSBldmVudCBkYXRhIGlzIGFsd2F5cyA8IDB4ODAuXG4gICAgICpcbiAgICAgKiBUaGUgZXZlbnQgY29kZSBpcyBvcHRpb25hbC4gIElmIHRoZSBldmVudCBjb2RlIGlzIG1pc3NpbmcsIHRoZW4gaXRcbiAgICAgKiBkZWZhdWx0cyB0byB0aGUgcHJldmlvdXMgZXZlbnQgY29kZS4gIEZvciBleGFtcGxlOlxuICAgICAqXG4gICAgICogICB2YXJsZW4sIGV2ZW50Y29kZTEsIGV2ZW50ZGF0YSxcbiAgICAgKiAgIHZhcmxlbiwgZXZlbnRjb2RlMiwgZXZlbnRkYXRhLFxuICAgICAqICAgdmFybGVuLCBldmVudGRhdGEsICAvLyBldmVudGNvZGUgaXMgZXZlbnRjb2RlMlxuICAgICAqICAgdmFybGVuLCBldmVudGRhdGEsICAvLyBldmVudGNvZGUgaXMgZXZlbnRjb2RlMlxuICAgICAqICAgdmFybGVuLCBldmVudGNvZGUzLCBldmVudGRhdGEsXG4gICAgICogICAuLi4uXG4gICAgICpcbiAgICAgKiAgIEhvdyBkbyB5b3Uga25vdyBpZiB0aGUgZXZlbnRjb2RlIGlzIHRoZXJlIG9yIG1pc3Npbmc/IFdlbGw6XG4gICAgICogICAtIEFsbCBldmVudCBjb2RlcyBhcmUgYmV0d2VlbiAweDgwIGFuZCAweEZGXG4gICAgICogICAtIFRoZSBmaXJzdCBieXRlIG9mIGV2ZW50ZGF0YSBpcyBhbHdheXMgbGVzcyB0aGFuIDB4ODAuXG4gICAgICogICBTbywgYWZ0ZXIgdGhlIHZhcmxlbiBkZWx0YSB0aW1lLCBpZiB0aGUgbmV4dCBieXRlIGlzIGJldHdlZW4gMHg4MFxuICAgICAqICAgYW5kIDB4RkYsIGl0cyBhbiBldmVudCBjb2RlLiAgT3RoZXJ3aXNlLCBpdHMgZXZlbnQgZGF0YS5cbiAgICAgKlxuICAgICAqIFRoZSBFdmVudCBjb2RlcyBhbmQgZXZlbnQgZGF0YSBmb3IgZWFjaCBldmVudCBjb2RlIGFyZSBzaG93biBiZWxvdy5cbiAgICAgKlxuICAgICAqIENvZGU6ICB1MSAtIDB4ODAgdGhydSAweDhGIC0gTm90ZSBPZmYgZXZlbnQuXG4gICAgICogICAgICAgICAgICAgMHg4MCBpcyBmb3IgY2hhbm5lbCAxLCAweDhGIGlzIGZvciBjaGFubmVsIDE2LlxuICAgICAqIERhdGE6ICB1MSAtIFRoZSBub3RlIG51bWJlciwgMC0xMjcuICBNaWRkbGUgQyBpcyA2MCAoMHgzQylcbiAgICAgKiAgICAgICAgdTEgLSBUaGUgbm90ZSB2ZWxvY2l0eS4gIFRoaXMgc2hvdWxkIGJlIDBcbiAgICAgKiBcbiAgICAgKiBDb2RlOiAgdTEgLSAweDkwIHRocnUgMHg5RiAtIE5vdGUgT24gZXZlbnQuXG4gICAgICogICAgICAgICAgICAgMHg5MCBpcyBmb3IgY2hhbm5lbCAxLCAweDlGIGlzIGZvciBjaGFubmVsIDE2LlxuICAgICAqIERhdGE6ICB1MSAtIFRoZSBub3RlIG51bWJlciwgMC0xMjcuICBNaWRkbGUgQyBpcyA2MCAoMHgzQylcbiAgICAgKiAgICAgICAgdTEgLSBUaGUgbm90ZSB2ZWxvY2l0eSwgZnJvbSAwIChubyBzb3VuZCkgdG8gMTI3IChsb3VkKS5cbiAgICAgKiAgICAgICAgICAgICBBIHZhbHVlIG9mIDAgaXMgZXF1aXZhbGVudCB0byBhIE5vdGUgT2ZmLlxuICAgICAqXG4gICAgICogQ29kZTogIHUxIC0gMHhBMCB0aHJ1IDB4QUYgLSBLZXkgUHJlc3N1cmVcbiAgICAgKiBEYXRhOiAgdTEgLSBUaGUgbm90ZSBudW1iZXIsIDAtMTI3LlxuICAgICAqICAgICAgICB1MSAtIFRoZSBwcmVzc3VyZS5cbiAgICAgKlxuICAgICAqIENvZGU6ICB1MSAtIDB4QjAgdGhydSAweEJGIC0gQ29udHJvbCBDaGFuZ2VcbiAgICAgKiBEYXRhOiAgdTEgLSBUaGUgY29udHJvbGxlciBudW1iZXJcbiAgICAgKiAgICAgICAgdTEgLSBUaGUgdmFsdWVcbiAgICAgKlxuICAgICAqIENvZGU6ICB1MSAtIDB4QzAgdGhydSAweENGIC0gUHJvZ3JhbSBDaGFuZ2VcbiAgICAgKiBEYXRhOiAgdTEgLSBUaGUgcHJvZ3JhbSBudW1iZXIuXG4gICAgICpcbiAgICAgKiBDb2RlOiAgdTEgLSAweEQwIHRocnUgMHhERiAtIENoYW5uZWwgUHJlc3N1cmVcbiAgICAgKiAgICAgICAgdTEgLSBUaGUgcHJlc3N1cmUuXG4gICAgICpcbiAgICAgKiBDb2RlOiAgdTEgLSAweEUwIHRocnUgMHhFRiAtIFBpdGNoIEJlbmRcbiAgICAgKiBEYXRhOiAgdTIgLSBTb21lIGRhdGFcbiAgICAgKlxuICAgICAqIENvZGU6ICB1MSAgICAgLSAweEZGIC0gTWV0YSBFdmVudFxuICAgICAqIERhdGE6ICB1MSAgICAgLSBNZXRhY29kZVxuICAgICAqICAgICAgICB2YXJsZW4gLSBMZW5ndGggb2YgbWV0YSBldmVudFxuICAgICAqICAgICAgICB1MVt2YXJsZW5dIC0gTWV0YSBldmVudCBkYXRhLlxuICAgICAqXG4gICAgICpcbiAgICAgKiBUaGUgTWV0YSBFdmVudCBjb2RlcyBhcmUgbGlzdGVkIGJlbG93OlxuICAgICAqXG4gICAgICogTWV0YWNvZGU6IHUxICAgICAgICAgLSAweDAgIFNlcXVlbmNlIE51bWJlclxuICAgICAqICAgICAgICAgICB2YXJsZW4gICAgIC0gMCBvciAyXG4gICAgICogICAgICAgICAgIHUxW3Zhcmxlbl0gLSBTZXF1ZW5jZSBudW1iZXJcbiAgICAgKlxuICAgICAqIE1ldGFjb2RlOiB1MSAgICAgICAgIC0gMHgxICBUZXh0XG4gICAgICogICAgICAgICAgIHZhcmxlbiAgICAgLSBMZW5ndGggb2YgdGV4dFxuICAgICAqICAgICAgICAgICB1MVt2YXJsZW5dIC0gVGV4dFxuICAgICAqXG4gICAgICogTWV0YWNvZGU6IHUxICAgICAgICAgLSAweDIgIENvcHlyaWdodFxuICAgICAqICAgICAgICAgICB2YXJsZW4gICAgIC0gTGVuZ3RoIG9mIHRleHRcbiAgICAgKiAgICAgICAgICAgdTFbdmFybGVuXSAtIFRleHRcbiAgICAgKlxuICAgICAqIE1ldGFjb2RlOiB1MSAgICAgICAgIC0gMHgzICBUcmFjayBOYW1lXG4gICAgICogICAgICAgICAgIHZhcmxlbiAgICAgLSBMZW5ndGggb2YgbmFtZVxuICAgICAqICAgICAgICAgICB1MVt2YXJsZW5dIC0gVHJhY2sgTmFtZVxuICAgICAqXG4gICAgICogTWV0YWNvZGU6IHUxICAgICAgICAgLSAweDU4ICBUaW1lIFNpZ25hdHVyZVxuICAgICAqICAgICAgICAgICB2YXJsZW4gICAgIC0gNCBcbiAgICAgKiAgICAgICAgICAgdTEgICAgICAgICAtIG51bWVyYXRvclxuICAgICAqICAgICAgICAgICB1MSAgICAgICAgIC0gbG9nMihkZW5vbWluYXRvcilcbiAgICAgKiAgICAgICAgICAgdTEgICAgICAgICAtIGNsb2NrcyBpbiBtZXRyb25vbWUgY2xpY2tcbiAgICAgKiAgICAgICAgICAgdTEgICAgICAgICAtIDMybmQgbm90ZXMgaW4gcXVhcnRlciBub3RlICh1c3VhbGx5IDgpXG4gICAgICpcbiAgICAgKiBNZXRhY29kZTogdTEgICAgICAgICAtIDB4NTkgIEtleSBTaWduYXR1cmVcbiAgICAgKiAgICAgICAgICAgdmFybGVuICAgICAtIDJcbiAgICAgKiAgICAgICAgICAgdTEgICAgICAgICAtIGlmID49IDAsIHRoZW4gbnVtYmVyIG9mIHNoYXJwc1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgaWYgPCAwLCB0aGVuIG51bWJlciBvZiBmbGF0cyAqIC0xXG4gICAgICogICAgICAgICAgIHUxICAgICAgICAgLSAwIGlmIG1ham9yIGtleVxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgMSBpZiBtaW5vciBrZXlcbiAgICAgKlxuICAgICAqIE1ldGFjb2RlOiB1MSAgICAgICAgIC0gMHg1MSAgVGVtcG9cbiAgICAgKiAgICAgICAgICAgdmFybGVuICAgICAtIDMgIFxuICAgICAqICAgICAgICAgICB1MyAgICAgICAgIC0gcXVhcnRlciBub3RlIGxlbmd0aCBpbiBtaWNyb3NlY29uZHNcbiAgICAgKi9cblxuXG4gICAgLyoqIEBjbGFzcyBNaWRpRmlsZVxuICAgICAqXG4gICAgICogVGhlIE1pZGlGaWxlIGNsYXNzIGNvbnRhaW5zIHRoZSBwYXJzZWQgZGF0YSBmcm9tIHRoZSBNaWRpIEZpbGUuXG4gICAgICogSXQgY29udGFpbnM6XG4gICAgICogLSBBbGwgdGhlIHRyYWNrcyBpbiB0aGUgbWlkaSBmaWxlLCBpbmNsdWRpbmcgYWxsIE1pZGlOb3RlcyBwZXIgdHJhY2suXG4gICAgICogLSBUaGUgdGltZSBzaWduYXR1cmUgKGUuZy4gNC80LCAzLzQsIDYvOClcbiAgICAgKiAtIFRoZSBudW1iZXIgb2YgcHVsc2VzIHBlciBxdWFydGVyIG5vdGUuXG4gICAgICogLSBUaGUgdGVtcG8gKG51bWJlciBvZiBtaWNyb3NlY29uZHMgcGVyIHF1YXJ0ZXIgbm90ZSkuXG4gICAgICpcbiAgICAgKiBUaGUgY29uc3RydWN0b3IgdGFrZXMgYSBmaWxlbmFtZSBhcyBpbnB1dCwgYW5kIHVwb24gcmV0dXJuaW5nLFxuICAgICAqIGNvbnRhaW5zIHRoZSBwYXJzZWQgZGF0YSBmcm9tIHRoZSBtaWRpIGZpbGUuXG4gICAgICpcbiAgICAgKiBUaGUgbWV0aG9kcyBSZWFkVHJhY2soKSBhbmQgUmVhZE1ldGFFdmVudCgpIGFyZSBoZWxwZXIgZnVuY3Rpb25zIGNhbGxlZFxuICAgICAqIGJ5IHRoZSBjb25zdHJ1Y3RvciBkdXJpbmcgdGhlIHBhcnNpbmcuXG4gICAgICpcbiAgICAgKiBBZnRlciB0aGUgTWlkaUZpbGUgaXMgcGFyc2VkIGFuZCBjcmVhdGVkLCB0aGUgdXNlciBjYW4gcmV0cmlldmUgdGhlIFxuICAgICAqIHRyYWNrcyBhbmQgbm90ZXMgYnkgdXNpbmcgdGhlIHByb3BlcnR5IFRyYWNrcyBhbmQgVHJhY2tzLk5vdGVzLlxuICAgICAqXG4gICAgICogVGhlcmUgYXJlIHR3byBtZXRob2RzIGZvciBtb2RpZnlpbmcgdGhlIG1pZGkgZGF0YSBiYXNlZCBvbiB0aGUgbWVudVxuICAgICAqIG9wdGlvbnMgc2VsZWN0ZWQ6XG4gICAgICpcbiAgICAgKiAtIENoYW5nZU1pZGlOb3RlcygpXG4gICAgICogICBBcHBseSB0aGUgbWVudSBvcHRpb25zIHRvIHRoZSBwYXJzZWQgTWlkaUZpbGUuICBUaGlzIHVzZXMgdGhlIGhlbHBlciBmdW5jdGlvbnM6XG4gICAgICogICAgIFNwbGl0VHJhY2soKVxuICAgICAqICAgICBDb21iaW5lVG9Ud29UcmFja3MoKVxuICAgICAqICAgICBTaGlmdFRpbWUoKVxuICAgICAqICAgICBUcmFuc3Bvc2UoKVxuICAgICAqICAgICBSb3VuZFN0YXJ0VGltZXMoKVxuICAgICAqICAgICBSb3VuZER1cmF0aW9ucygpXG4gICAgICpcbiAgICAgKiAtIENoYW5nZVNvdW5kKClcbiAgICAgKiAgIEFwcGx5IHRoZSBtZW51IG9wdGlvbnMgdG8gdGhlIE1JREkgbXVzaWMgZGF0YSwgYW5kIHNhdmUgdGhlIG1vZGlmaWVkIG1pZGkgZGF0YSBcbiAgICAgKiAgIHRvIGEgZmlsZSwgZm9yIHBsYXliYWNrLiBcbiAgICAgKiAgIFxuICAgICAqL1xuXG4gICAgcHVibGljIGNsYXNzIE1pZGlGaWxlXG4gICAge1xuICAgICAgICBwcml2YXRlIHN0cmluZyBmaWxlbmFtZTsgICAgICAgICAgLyoqIFRoZSBNaWRpIGZpbGUgbmFtZSAqL1xuICAgICAgICBwcml2YXRlIExpc3Q8TWlkaUV2ZW50PltdIGV2ZW50czsgLyoqIFRoZSByYXcgTWlkaUV2ZW50cywgb25lIGxpc3QgcGVyIHRyYWNrICovXG4gICAgICAgIHByaXZhdGUgTGlzdDxNaWRpVHJhY2s+IHRyYWNrczsgIC8qKiBUaGUgdHJhY2tzIG9mIHRoZSBtaWRpZmlsZSB0aGF0IGhhdmUgbm90ZXMgKi9cbiAgICAgICAgcHJpdmF0ZSB1c2hvcnQgdHJhY2ttb2RlOyAgICAgICAgIC8qKiAwIChzaW5nbGUgdHJhY2spLCAxIChzaW11bHRhbmVvdXMgdHJhY2tzKSAyIChpbmRlcGVuZGVudCB0cmFja3MpICovXG4gICAgICAgIHByaXZhdGUgVGltZVNpZ25hdHVyZSB0aW1lc2lnOyAgICAvKiogVGhlIHRpbWUgc2lnbmF0dXJlICovXG4gICAgICAgIHByaXZhdGUgaW50IHF1YXJ0ZXJub3RlOyAgICAgICAgICAvKiogVGhlIG51bWJlciBvZiBwdWxzZXMgcGVyIHF1YXJ0ZXIgbm90ZSAqL1xuICAgICAgICBwcml2YXRlIGludCB0b3RhbHB1bHNlczsgICAgICAgICAgLyoqIFRoZSB0b3RhbCBsZW5ndGggb2YgdGhlIHNvbmcsIGluIHB1bHNlcyAqL1xuICAgICAgICBwcml2YXRlIGJvb2wgdHJhY2tQZXJDaGFubmVsOyAgICAgLyoqIFRydWUgaWYgd2UndmUgc3BsaXQgZWFjaCBjaGFubmVsIGludG8gYSB0cmFjayAqL1xuXG4gICAgICAgIC8qIFRoZSBsaXN0IG9mIE1pZGkgRXZlbnRzICovXG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgRXZlbnROb3RlT2ZmID0gMHg4MDtcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBFdmVudE5vdGVPbiA9IDB4OTA7XG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgRXZlbnRLZXlQcmVzc3VyZSA9IDB4QTA7XG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgRXZlbnRDb250cm9sQ2hhbmdlID0gMHhCMDtcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBFdmVudFByb2dyYW1DaGFuZ2UgPSAweEMwO1xuICAgICAgICBwdWJsaWMgY29uc3QgaW50IEV2ZW50Q2hhbm5lbFByZXNzdXJlID0gMHhEMDtcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBFdmVudFBpdGNoQmVuZCA9IDB4RTA7XG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgU3lzZXhFdmVudDEgPSAweEYwO1xuICAgICAgICBwdWJsaWMgY29uc3QgaW50IFN5c2V4RXZlbnQyID0gMHhGNztcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBNZXRhRXZlbnQgPSAweEZGO1xuXG4gICAgICAgIC8qIFRoZSBsaXN0IG9mIE1ldGEgRXZlbnRzICovXG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWV0YUV2ZW50U2VxdWVuY2UgPSAweDA7XG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWV0YUV2ZW50VGV4dCA9IDB4MTtcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBNZXRhRXZlbnRDb3B5cmlnaHQgPSAweDI7XG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWV0YUV2ZW50U2VxdWVuY2VOYW1lID0gMHgzO1xuICAgICAgICBwdWJsaWMgY29uc3QgaW50IE1ldGFFdmVudEluc3RydW1lbnQgPSAweDQ7XG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWV0YUV2ZW50THlyaWMgPSAweDU7XG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWV0YUV2ZW50TWFya2VyID0gMHg2O1xuICAgICAgICBwdWJsaWMgY29uc3QgaW50IE1ldGFFdmVudEVuZE9mVHJhY2sgPSAweDJGO1xuICAgICAgICBwdWJsaWMgY29uc3QgaW50IE1ldGFFdmVudFRlbXBvID0gMHg1MTtcbiAgICAgICAgcHVibGljIGNvbnN0IGludCBNZXRhRXZlbnRTTVBURU9mZnNldCA9IDB4NTQ7XG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWV0YUV2ZW50VGltZVNpZ25hdHVyZSA9IDB4NTg7XG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWV0YUV2ZW50S2V5U2lnbmF0dXJlID0gMHg1OTtcblxuICAgICAgICAvKiBUaGUgUHJvZ3JhbSBDaGFuZ2UgZXZlbnQgZ2l2ZXMgdGhlIGluc3RydW1lbnQgdGhhdCBzaG91bGRcbiAgICAgICAgICogYmUgdXNlZCBmb3IgYSBwYXJ0aWN1bGFyIGNoYW5uZWwuICBUaGUgZm9sbG93aW5nIHRhYmxlXG4gICAgICAgICAqIG1hcHMgZWFjaCBpbnN0cnVtZW50IG51bWJlciAoMCB0aHJ1IDEyOCkgdG8gYW4gaW5zdHJ1bWVudFxuICAgICAgICAgKiBuYW1lLlxuICAgICAgICAgKi9cbiAgICAgICAgcHVibGljIHN0YXRpYyBzdHJpbmdbXSBJbnN0cnVtZW50cyA9IHtcblxuICAgICAgICBcIkFjb3VzdGljIEdyYW5kIFBpYW5vXCIsXG4gICAgICAgIFwiQnJpZ2h0IEFjb3VzdGljIFBpYW5vXCIsXG4gICAgICAgIFwiRWxlY3RyaWMgR3JhbmQgUGlhbm9cIixcbiAgICAgICAgXCJIb25reS10b25rIFBpYW5vXCIsXG4gICAgICAgIFwiRWxlY3RyaWMgUGlhbm8gMVwiLFxuICAgICAgICBcIkVsZWN0cmljIFBpYW5vIDJcIixcbiAgICAgICAgXCJIYXJwc2ljaG9yZFwiLFxuICAgICAgICBcIkNsYXZpXCIsXG4gICAgICAgIFwiQ2VsZXN0YVwiLFxuICAgICAgICBcIkdsb2NrZW5zcGllbFwiLFxuICAgICAgICBcIk11c2ljIEJveFwiLFxuICAgICAgICBcIlZpYnJhcGhvbmVcIixcbiAgICAgICAgXCJNYXJpbWJhXCIsXG4gICAgICAgIFwiWHlsb3Bob25lXCIsXG4gICAgICAgIFwiVHVidWxhciBCZWxsc1wiLFxuICAgICAgICBcIkR1bGNpbWVyXCIsXG4gICAgICAgIFwiRHJhd2JhciBPcmdhblwiLFxuICAgICAgICBcIlBlcmN1c3NpdmUgT3JnYW5cIixcbiAgICAgICAgXCJSb2NrIE9yZ2FuXCIsXG4gICAgICAgIFwiQ2h1cmNoIE9yZ2FuXCIsXG4gICAgICAgIFwiUmVlZCBPcmdhblwiLFxuICAgICAgICBcIkFjY29yZGlvblwiLFxuICAgICAgICBcIkhhcm1vbmljYVwiLFxuICAgICAgICBcIlRhbmdvIEFjY29yZGlvblwiLFxuICAgICAgICBcIkFjb3VzdGljIEd1aXRhciAobnlsb24pXCIsXG4gICAgICAgIFwiQWNvdXN0aWMgR3VpdGFyIChzdGVlbClcIixcbiAgICAgICAgXCJFbGVjdHJpYyBHdWl0YXIgKGphenopXCIsXG4gICAgICAgIFwiRWxlY3RyaWMgR3VpdGFyIChjbGVhbilcIixcbiAgICAgICAgXCJFbGVjdHJpYyBHdWl0YXIgKG11dGVkKVwiLFxuICAgICAgICBcIk92ZXJkcml2ZW4gR3VpdGFyXCIsXG4gICAgICAgIFwiRGlzdG9ydGlvbiBHdWl0YXJcIixcbiAgICAgICAgXCJHdWl0YXIgaGFybW9uaWNzXCIsXG4gICAgICAgIFwiQWNvdXN0aWMgQmFzc1wiLFxuICAgICAgICBcIkVsZWN0cmljIEJhc3MgKGZpbmdlcilcIixcbiAgICAgICAgXCJFbGVjdHJpYyBCYXNzIChwaWNrKVwiLFxuICAgICAgICBcIkZyZXRsZXNzIEJhc3NcIixcbiAgICAgICAgXCJTbGFwIEJhc3MgMVwiLFxuICAgICAgICBcIlNsYXAgQmFzcyAyXCIsXG4gICAgICAgIFwiU3ludGggQmFzcyAxXCIsXG4gICAgICAgIFwiU3ludGggQmFzcyAyXCIsXG4gICAgICAgIFwiVmlvbGluXCIsXG4gICAgICAgIFwiVmlvbGFcIixcbiAgICAgICAgXCJDZWxsb1wiLFxuICAgICAgICBcIkNvbnRyYWJhc3NcIixcbiAgICAgICAgXCJUcmVtb2xvIFN0cmluZ3NcIixcbiAgICAgICAgXCJQaXp6aWNhdG8gU3RyaW5nc1wiLFxuICAgICAgICBcIk9yY2hlc3RyYWwgSGFycFwiLFxuICAgICAgICBcIlRpbXBhbmlcIixcbiAgICAgICAgXCJTdHJpbmcgRW5zZW1ibGUgMVwiLFxuICAgICAgICBcIlN0cmluZyBFbnNlbWJsZSAyXCIsXG4gICAgICAgIFwiU3ludGhTdHJpbmdzIDFcIixcbiAgICAgICAgXCJTeW50aFN0cmluZ3MgMlwiLFxuICAgICAgICBcIkNob2lyIEFhaHNcIixcbiAgICAgICAgXCJWb2ljZSBPb2hzXCIsXG4gICAgICAgIFwiU3ludGggVm9pY2VcIixcbiAgICAgICAgXCJPcmNoZXN0cmEgSGl0XCIsXG4gICAgICAgIFwiVHJ1bXBldFwiLFxuICAgICAgICBcIlRyb21ib25lXCIsXG4gICAgICAgIFwiVHViYVwiLFxuICAgICAgICBcIk11dGVkIFRydW1wZXRcIixcbiAgICAgICAgXCJGcmVuY2ggSG9yblwiLFxuICAgICAgICBcIkJyYXNzIFNlY3Rpb25cIixcbiAgICAgICAgXCJTeW50aEJyYXNzIDFcIixcbiAgICAgICAgXCJTeW50aEJyYXNzIDJcIixcbiAgICAgICAgXCJTb3ByYW5vIFNheFwiLFxuICAgICAgICBcIkFsdG8gU2F4XCIsXG4gICAgICAgIFwiVGVub3IgU2F4XCIsXG4gICAgICAgIFwiQmFyaXRvbmUgU2F4XCIsXG4gICAgICAgIFwiT2JvZVwiLFxuICAgICAgICBcIkVuZ2xpc2ggSG9yblwiLFxuICAgICAgICBcIkJhc3Nvb25cIixcbiAgICAgICAgXCJDbGFyaW5ldFwiLFxuICAgICAgICBcIlBpY2NvbG9cIixcbiAgICAgICAgXCJGbHV0ZVwiLFxuICAgICAgICBcIlJlY29yZGVyXCIsXG4gICAgICAgIFwiUGFuIEZsdXRlXCIsXG4gICAgICAgIFwiQmxvd24gQm90dGxlXCIsXG4gICAgICAgIFwiU2hha3VoYWNoaVwiLFxuICAgICAgICBcIldoaXN0bGVcIixcbiAgICAgICAgXCJPY2FyaW5hXCIsXG4gICAgICAgIFwiTGVhZCAxIChzcXVhcmUpXCIsXG4gICAgICAgIFwiTGVhZCAyIChzYXd0b290aClcIixcbiAgICAgICAgXCJMZWFkIDMgKGNhbGxpb3BlKVwiLFxuICAgICAgICBcIkxlYWQgNCAoY2hpZmYpXCIsXG4gICAgICAgIFwiTGVhZCA1IChjaGFyYW5nKVwiLFxuICAgICAgICBcIkxlYWQgNiAodm9pY2UpXCIsXG4gICAgICAgIFwiTGVhZCA3IChmaWZ0aHMpXCIsXG4gICAgICAgIFwiTGVhZCA4IChiYXNzICsgbGVhZClcIixcbiAgICAgICAgXCJQYWQgMSAobmV3IGFnZSlcIixcbiAgICAgICAgXCJQYWQgMiAod2FybSlcIixcbiAgICAgICAgXCJQYWQgMyAocG9seXN5bnRoKVwiLFxuICAgICAgICBcIlBhZCA0IChjaG9pcilcIixcbiAgICAgICAgXCJQYWQgNSAoYm93ZWQpXCIsXG4gICAgICAgIFwiUGFkIDYgKG1ldGFsbGljKVwiLFxuICAgICAgICBcIlBhZCA3IChoYWxvKVwiLFxuICAgICAgICBcIlBhZCA4IChzd2VlcClcIixcbiAgICAgICAgXCJGWCAxIChyYWluKVwiLFxuICAgICAgICBcIkZYIDIgKHNvdW5kdHJhY2spXCIsXG4gICAgICAgIFwiRlggMyAoY3J5c3RhbClcIixcbiAgICAgICAgXCJGWCA0IChhdG1vc3BoZXJlKVwiLFxuICAgICAgICBcIkZYIDUgKGJyaWdodG5lc3MpXCIsXG4gICAgICAgIFwiRlggNiAoZ29ibGlucylcIixcbiAgICAgICAgXCJGWCA3IChlY2hvZXMpXCIsXG4gICAgICAgIFwiRlggOCAoc2NpLWZpKVwiLFxuICAgICAgICBcIlNpdGFyXCIsXG4gICAgICAgIFwiQmFuam9cIixcbiAgICAgICAgXCJTaGFtaXNlblwiLFxuICAgICAgICBcIktvdG9cIixcbiAgICAgICAgXCJLYWxpbWJhXCIsXG4gICAgICAgIFwiQmFnIHBpcGVcIixcbiAgICAgICAgXCJGaWRkbGVcIixcbiAgICAgICAgXCJTaGFuYWlcIixcbiAgICAgICAgXCJUaW5rbGUgQmVsbFwiLFxuICAgICAgICBcIkFnb2dvXCIsXG4gICAgICAgIFwiU3RlZWwgRHJ1bXNcIixcbiAgICAgICAgXCJXb29kYmxvY2tcIixcbiAgICAgICAgXCJUYWlrbyBEcnVtXCIsXG4gICAgICAgIFwiTWVsb2RpYyBUb21cIixcbiAgICAgICAgXCJTeW50aCBEcnVtXCIsXG4gICAgICAgIFwiUmV2ZXJzZSBDeW1iYWxcIixcbiAgICAgICAgXCJHdWl0YXIgRnJldCBOb2lzZVwiLFxuICAgICAgICBcIkJyZWF0aCBOb2lzZVwiLFxuICAgICAgICBcIlNlYXNob3JlXCIsXG4gICAgICAgIFwiQmlyZCBUd2VldFwiLFxuICAgICAgICBcIlRlbGVwaG9uZSBSaW5nXCIsXG4gICAgICAgIFwiSGVsaWNvcHRlclwiLFxuICAgICAgICBcIkFwcGxhdXNlXCIsXG4gICAgICAgIFwiR3Vuc2hvdFwiLFxuICAgICAgICBcIlBlcmN1c3Npb25cIlxuICAgIH07XG4gICAgICAgIC8qIEVuZCBJbnN0cnVtZW50cyAqL1xuXG4gICAgICAgIC8qKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBNaWRpIGV2ZW50ICovXG4gICAgICAgIHByaXZhdGUgc3RyaW5nIEV2ZW50TmFtZShpbnQgZXYpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmIChldiA+PSBFdmVudE5vdGVPZmYgJiYgZXYgPCBFdmVudE5vdGVPZmYgKyAxNilcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJOb3RlT2ZmXCI7XG4gICAgICAgICAgICBlbHNlIGlmIChldiA+PSBFdmVudE5vdGVPbiAmJiBldiA8IEV2ZW50Tm90ZU9uICsgMTYpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiTm90ZU9uXCI7XG4gICAgICAgICAgICBlbHNlIGlmIChldiA+PSBFdmVudEtleVByZXNzdXJlICYmIGV2IDwgRXZlbnRLZXlQcmVzc3VyZSArIDE2KVxuICAgICAgICAgICAgICAgIHJldHVybiBcIktleVByZXNzdXJlXCI7XG4gICAgICAgICAgICBlbHNlIGlmIChldiA+PSBFdmVudENvbnRyb2xDaGFuZ2UgJiYgZXYgPCBFdmVudENvbnRyb2xDaGFuZ2UgKyAxNilcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJDb250cm9sQ2hhbmdlXCI7XG4gICAgICAgICAgICBlbHNlIGlmIChldiA+PSBFdmVudFByb2dyYW1DaGFuZ2UgJiYgZXYgPCBFdmVudFByb2dyYW1DaGFuZ2UgKyAxNilcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJQcm9ncmFtQ2hhbmdlXCI7XG4gICAgICAgICAgICBlbHNlIGlmIChldiA+PSBFdmVudENoYW5uZWxQcmVzc3VyZSAmJiBldiA8IEV2ZW50Q2hhbm5lbFByZXNzdXJlICsgMTYpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiQ2hhbm5lbFByZXNzdXJlXCI7XG4gICAgICAgICAgICBlbHNlIGlmIChldiA+PSBFdmVudFBpdGNoQmVuZCAmJiBldiA8IEV2ZW50UGl0Y2hCZW5kICsgMTYpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiUGl0Y2hCZW5kXCI7XG4gICAgICAgICAgICBlbHNlIGlmIChldiA9PSBNZXRhRXZlbnQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiTWV0YUV2ZW50XCI7XG4gICAgICAgICAgICBlbHNlIGlmIChldiA9PSBTeXNleEV2ZW50MSB8fCBldiA9PSBTeXNleEV2ZW50MilcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJTeXNleEV2ZW50XCI7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiVW5rbm93blwiO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIG1ldGEtZXZlbnQgKi9cbiAgICAgICAgcHJpdmF0ZSBzdHJpbmcgTWV0YU5hbWUoaW50IGV2KVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAoZXYgPT0gTWV0YUV2ZW50U2VxdWVuY2UpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiTWV0YUV2ZW50U2VxdWVuY2VcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKGV2ID09IE1ldGFFdmVudFRleHQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiTWV0YUV2ZW50VGV4dFwiO1xuICAgICAgICAgICAgZWxzZSBpZiAoZXYgPT0gTWV0YUV2ZW50Q29weXJpZ2h0KVxuICAgICAgICAgICAgICAgIHJldHVybiBcIk1ldGFFdmVudENvcHlyaWdodFwiO1xuICAgICAgICAgICAgZWxzZSBpZiAoZXYgPT0gTWV0YUV2ZW50U2VxdWVuY2VOYW1lKVxuICAgICAgICAgICAgICAgIHJldHVybiBcIk1ldGFFdmVudFNlcXVlbmNlTmFtZVwiO1xuICAgICAgICAgICAgZWxzZSBpZiAoZXYgPT0gTWV0YUV2ZW50SW5zdHJ1bWVudClcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJNZXRhRXZlbnRJbnN0cnVtZW50XCI7XG4gICAgICAgICAgICBlbHNlIGlmIChldiA9PSBNZXRhRXZlbnRMeXJpYylcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJNZXRhRXZlbnRMeXJpY1wiO1xuICAgICAgICAgICAgZWxzZSBpZiAoZXYgPT0gTWV0YUV2ZW50TWFya2VyKVxuICAgICAgICAgICAgICAgIHJldHVybiBcIk1ldGFFdmVudE1hcmtlclwiO1xuICAgICAgICAgICAgZWxzZSBpZiAoZXYgPT0gTWV0YUV2ZW50RW5kT2ZUcmFjaylcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJNZXRhRXZlbnRFbmRPZlRyYWNrXCI7XG4gICAgICAgICAgICBlbHNlIGlmIChldiA9PSBNZXRhRXZlbnRUZW1wbylcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJNZXRhRXZlbnRUZW1wb1wiO1xuICAgICAgICAgICAgZWxzZSBpZiAoZXYgPT0gTWV0YUV2ZW50U01QVEVPZmZzZXQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiTWV0YUV2ZW50U01QVEVPZmZzZXRcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKGV2ID09IE1ldGFFdmVudFRpbWVTaWduYXR1cmUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiTWV0YUV2ZW50VGltZVNpZ25hdHVyZVwiO1xuICAgICAgICAgICAgZWxzZSBpZiAoZXYgPT0gTWV0YUV2ZW50S2V5U2lnbmF0dXJlKVxuICAgICAgICAgICAgICAgIHJldHVybiBcIk1ldGFFdmVudEtleVNpZ25hdHVyZVwiO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBcIlVua25vd25cIjtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqIEdldCB0aGUgbGlzdCBvZiB0cmFja3MgKi9cbiAgICAgICAgcHVibGljIExpc3Q8TWlkaVRyYWNrPiBUcmFja3NcbiAgICAgICAge1xuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIHRyYWNrczsgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEdldCB0aGUgdGltZSBzaWduYXR1cmUgKi9cbiAgICAgICAgcHVibGljIFRpbWVTaWduYXR1cmUgVGltZVxuICAgICAgICB7XG4gICAgICAgICAgICBnZXQgeyByZXR1cm4gdGltZXNpZzsgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEdldCB0aGUgZmlsZSBuYW1lICovXG4gICAgICAgIHB1YmxpYyBzdHJpbmcgRmlsZU5hbWVcbiAgICAgICAge1xuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIGZpbGVuYW1lOyB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiogR2V0IHRoZSB0b3RhbCBsZW5ndGggKGluIHB1bHNlcykgb2YgdGhlIHNvbmcgKi9cbiAgICAgICAgcHVibGljIGludCBUb3RhbFB1bHNlc1xuICAgICAgICB7XG4gICAgICAgICAgICBnZXQgeyByZXR1cm4gdG90YWxwdWxzZXM7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgYnl0ZVtdIFBhcnNlUmlmZkRhdGEoYnl0ZVtdIGRhdGEpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciByaWZmRmlsZSA9IFJpZmZQYXJzZXIuUGFyc2VCeXRlQXJyYXkoZGF0YSk7XG4gICAgICAgICAgICBpZiAocmlmZkZpbGUuRmlsZUluZm8uRmlsZVR5cGUgIT0gXCJSTUlEXCIpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aGlsZSAocmlmZkZpbGUuUmVhZCgoZ2xvYmFsOjpNaWRpU2hlZXRNdXNpYy5Qcm9jZXNzRWxlbWVudCkoKHR5cGUsIGlzTGlzdCwgY2h1bmspID0+XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0xpc3QgJiYgdHlwZS5Ub0xvd2VyKCkgPT0gXCJkYXRhXCIpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBkYXRhID0gY2h1bmsuR2V0RGF0YSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKSkgO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQ3JlYXRlIGEgbmV3IE1pZGlGaWxlIGZyb20gdGhlIGJ5dGVbXS4gKi9cbiAgICAgICAgcHVibGljIE1pZGlGaWxlKGJ5dGVbXSBkYXRhLCBzdHJpbmcgdGl0bGUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHN0cmluZyBoZWFkZXI7XG4gICAgICAgICAgICBpZiAoUmlmZlBhcnNlci5Jc1JpZmZGaWxlKGRhdGEsIG91dCBoZWFkZXIpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBQYXJzZVJpZmZEYXRhKGRhdGEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBNaWRpRmlsZVJlYWRlciBmaWxlID0gbmV3IE1pZGlGaWxlUmVhZGVyKGRhdGEpO1xuICAgICAgICAgICAgaWYgKHRpdGxlID09IG51bGwpXG4gICAgICAgICAgICAgICAgdGl0bGUgPSBcIlwiO1xuICAgICAgICAgICAgcGFyc2UoZmlsZSwgdGl0bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIFBhcnNlIHRoZSBnaXZlbiBNaWRpIGZpbGUsIGFuZCByZXR1cm4gYW4gaW5zdGFuY2Ugb2YgdGhpcyBNaWRpRmlsZVxuICAgICAgICAgKiBjbGFzcy4gIEFmdGVyIHJlYWRpbmcgdGhlIG1pZGkgZmlsZSwgdGhpcyBvYmplY3Qgd2lsbCBjb250YWluOlxuICAgICAgICAgKiAtIFRoZSByYXcgbGlzdCBvZiBtaWRpIGV2ZW50c1xuICAgICAgICAgKiAtIFRoZSBUaW1lIFNpZ25hdHVyZSBvZiB0aGUgc29uZ1xuICAgICAgICAgKiAtIEFsbCB0aGUgdHJhY2tzIGluIHRoZSBzb25nIHdoaWNoIGNvbnRhaW4gbm90ZXMuIFxuICAgICAgICAgKiAtIFRoZSBudW1iZXIsIHN0YXJ0dGltZSwgYW5kIGR1cmF0aW9uIG9mIGVhY2ggbm90ZS5cbiAgICAgICAgICovXG4gICAgICAgIHB1YmxpYyB2b2lkIHBhcnNlKE1pZGlGaWxlUmVhZGVyIGZpbGUsIHN0cmluZyBmaWxlbmFtZSlcbiAgICAgICAge1xuICAgICAgICAgICAgc3RyaW5nIGlkO1xuICAgICAgICAgICAgaW50IGxlbjtcblxuICAgICAgICAgICAgdGhpcy5maWxlbmFtZSA9IGZpbGVuYW1lO1xuICAgICAgICAgICAgdHJhY2tzID0gbmV3IExpc3Q8TWlkaVRyYWNrPigpO1xuICAgICAgICAgICAgdHJhY2tQZXJDaGFubmVsID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlkID0gZmlsZS5SZWFkQXNjaWkoNCk7XG4gICAgICAgICAgICBpZiAoaWQgIT0gXCJNVGhkXCIpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1pZGlGaWxlRXhjZXB0aW9uKFwiRG9lc24ndCBzdGFydCB3aXRoIE1UaGRcIiwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZW4gPSBmaWxlLlJlYWRJbnQoKTtcbiAgICAgICAgICAgIGlmIChsZW4gIT0gNilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWlkaUZpbGVFeGNlcHRpb24oXCJCYWQgTVRoZCBoZWFkZXJcIiwgNCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cmFja21vZGUgPSBmaWxlLlJlYWRTaG9ydCgpO1xuICAgICAgICAgICAgaW50IG51bV90cmFja3MgPSBmaWxlLlJlYWRTaG9ydCgpO1xuICAgICAgICAgICAgcXVhcnRlcm5vdGUgPSBmaWxlLlJlYWRTaG9ydCgpO1xuXG4gICAgICAgICAgICBldmVudHMgPSBuZXcgTGlzdDxNaWRpRXZlbnQ+W251bV90cmFja3NdO1xuICAgICAgICAgICAgZm9yIChpbnQgdHJhY2tudW0gPSAwOyB0cmFja251bSA8IG51bV90cmFja3M7IHRyYWNrbnVtKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZXZlbnRzW3RyYWNrbnVtXSA9IFJlYWRUcmFjayhmaWxlKTtcbiAgICAgICAgICAgICAgICBNaWRpVHJhY2sgdHJhY2sgPSBuZXcgTWlkaVRyYWNrKGV2ZW50c1t0cmFja251bV0sIHRyYWNrbnVtKTtcbiAgICAgICAgICAgICAgICBpZiAodHJhY2suTm90ZXMuQ291bnQgPiAwIHx8IHRyYWNrLkx5cmljcyAhPSBudWxsKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2tzLkFkZCh0cmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBHZXQgdGhlIGxlbmd0aCBvZiB0aGUgc29uZyBpbiBwdWxzZXMgKi9cbiAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlUcmFjayB0cmFjayBpbiB0cmFja3MpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgTWlkaU5vdGUgbGFzdCA9IHRyYWNrLk5vdGVzW3RyYWNrLk5vdGVzLkNvdW50IC0gMV07XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudG90YWxwdWxzZXMgPCBsYXN0LlN0YXJ0VGltZSArIGxhc3QuRHVyYXRpb24pXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvdGFscHVsc2VzID0gbGFzdC5TdGFydFRpbWUgKyBsYXN0LkR1cmF0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogSWYgd2Ugb25seSBoYXZlIG9uZSB0cmFjayB3aXRoIG11bHRpcGxlIGNoYW5uZWxzLCB0aGVuIHRyZWF0XG4gICAgICAgICAgICAgKiBlYWNoIGNoYW5uZWwgYXMgYSBzZXBhcmF0ZSB0cmFjay5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaWYgKHRyYWNrcy5Db3VudCA9PSAxICYmIEhhc011bHRpcGxlQ2hhbm5lbHModHJhY2tzWzBdKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0cmFja3MgPSBTcGxpdENoYW5uZWxzKHRyYWNrc1swXSwgZXZlbnRzW3RyYWNrc1swXS5OdW1iZXJdKTtcbiAgICAgICAgICAgICAgICB0cmFja1BlckNoYW5uZWwgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBDaGVja1N0YXJ0VGltZXModHJhY2tzKTtcblxuICAgICAgICAgICAgLyogRGV0ZXJtaW5lIHRoZSB0aW1lIHNpZ25hdHVyZSAqL1xuICAgICAgICAgICAgaW50IHRlbXBvID0gMDtcbiAgICAgICAgICAgIGludCBudW1lciA9IDA7XG4gICAgICAgICAgICBpbnQgZGVub20gPSAwO1xuICAgICAgICAgICAgZm9yZWFjaCAoTGlzdDxNaWRpRXZlbnQ+IGxpc3QgaW4gZXZlbnRzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlFdmVudCBtZXZlbnQgaW4gbGlzdClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXZlbnQuTWV0YWV2ZW50ID09IE1ldGFFdmVudFRlbXBvICYmIHRlbXBvID09IDApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBvID0gbWV2ZW50LlRlbXBvO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXZlbnQuTWV0YWV2ZW50ID09IE1ldGFFdmVudFRpbWVTaWduYXR1cmUgJiYgbnVtZXIgPT0gMClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbnVtZXIgPSBtZXZlbnQuTnVtZXJhdG9yO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVub20gPSBtZXZlbnQuRGVub21pbmF0b3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGVtcG8gPT0gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0ZW1wbyA9IDUwMDAwMDsgLyogNTAwLDAwMCBtaWNyb3NlY29uZHMgPSAwLjA1IHNlYyAqL1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG51bWVyID09IDApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbnVtZXIgPSA0OyBkZW5vbSA9IDQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aW1lc2lnID0gbmV3IFRpbWVTaWduYXR1cmUobnVtZXIsIGRlbm9tLCBxdWFydGVybm90ZSwgdGVtcG8pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIFBhcnNlIGEgc2luZ2xlIE1pZGkgdHJhY2sgaW50byBhIGxpc3Qgb2YgTWlkaUV2ZW50cy5cbiAgICAgICAgICogRW50ZXJpbmcgdGhpcyBmdW5jdGlvbiwgdGhlIGZpbGUgb2Zmc2V0IHNob3VsZCBiZSBhdCB0aGUgc3RhcnQgb2ZcbiAgICAgICAgICogdGhlIE1UcmsgaGVhZGVyLiAgVXBvbiBleGl0aW5nLCB0aGUgZmlsZSBvZmZzZXQgc2hvdWxkIGJlIGF0IHRoZVxuICAgICAgICAgKiBzdGFydCBvZiB0aGUgbmV4dCBNVHJrIGhlYWRlci5cbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGUgTGlzdDxNaWRpRXZlbnQ+IFJlYWRUcmFjayhNaWRpRmlsZVJlYWRlciBmaWxlKVxuICAgICAgICB7XG4gICAgICAgICAgICBMaXN0PE1pZGlFdmVudD4gcmVzdWx0ID0gbmV3IExpc3Q8TWlkaUV2ZW50PigyMCk7XG4gICAgICAgICAgICBpbnQgc3RhcnR0aW1lID0gMDtcbiAgICAgICAgICAgIHN0cmluZyBpZCA9IGZpbGUuUmVhZEFzY2lpKDQpO1xuXG4gICAgICAgICAgICBpZiAoaWQgIT0gXCJNVHJrXCIpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1pZGlGaWxlRXhjZXB0aW9uKFwiQmFkIE1UcmsgaGVhZGVyXCIsIGZpbGUuR2V0T2Zmc2V0KCkgLSA0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGludCB0cmFja2xlbiA9IGZpbGUuUmVhZEludCgpO1xuICAgICAgICAgICAgaW50IHRyYWNrZW5kID0gdHJhY2tsZW4gKyBmaWxlLkdldE9mZnNldCgpO1xuXG4gICAgICAgICAgICBpbnQgZXZlbnRmbGFnID0gMDtcblxuICAgICAgICAgICAgd2hpbGUgKGZpbGUuR2V0T2Zmc2V0KCkgPCB0cmFja2VuZClcbiAgICAgICAgICAgIHtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBtaWRpIGZpbGUgaXMgdHJ1bmNhdGVkIGhlcmUsIHdlIGNhbiBzdGlsbCByZWNvdmVyLlxuICAgICAgICAgICAgICAgIC8vIEp1c3QgcmV0dXJuIHdoYXQgd2UndmUgcGFyc2VkIHNvIGZhci5cblxuICAgICAgICAgICAgICAgIGludCBzdGFydG9mZnNldCwgZGVsdGF0aW1lO1xuICAgICAgICAgICAgICAgIGJ5dGUgcGVla2V2ZW50O1xuICAgICAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRvZmZzZXQgPSBmaWxlLkdldE9mZnNldCgpO1xuICAgICAgICAgICAgICAgICAgICBkZWx0YXRpbWUgPSBmaWxlLlJlYWRWYXJsZW4oKTtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnR0aW1lICs9IGRlbHRhdGltZTtcbiAgICAgICAgICAgICAgICAgICAgcGVla2V2ZW50ID0gZmlsZS5QZWVrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChNaWRpRmlsZUV4Y2VwdGlvbilcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgTWlkaUV2ZW50IG1ldmVudCA9IG5ldyBNaWRpRXZlbnQoKTtcbiAgICAgICAgICAgICAgICByZXN1bHQuQWRkKG1ldmVudCk7XG4gICAgICAgICAgICAgICAgbWV2ZW50LkRlbHRhVGltZSA9IGRlbHRhdGltZTtcbiAgICAgICAgICAgICAgICBtZXZlbnQuU3RhcnRUaW1lID0gc3RhcnR0aW1lO1xuXG4gICAgICAgICAgICAgICAgaWYgKHBlZWtldmVudCA+PSBFdmVudE5vdGVPZmYpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuSGFzRXZlbnRmbGFnID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRmbGFnID0gZmlsZS5SZWFkQnl0ZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIENvbnNvbGUuV3JpdGVMaW5lKFwib2Zmc2V0IHswfTogZXZlbnQgezF9IHsyfSBzdGFydCB7M30gZGVsdGEgezR9XCIsIFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICAgIHN0YXJ0b2Zmc2V0LCBldmVudGZsYWcsIEV2ZW50TmFtZShldmVudGZsYWcpLCBcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgICBzdGFydHRpbWUsIG1ldmVudC5EZWx0YVRpbWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50ZmxhZyA+PSBFdmVudE5vdGVPbiAmJiBldmVudGZsYWcgPCBFdmVudE5vdGVPbiArIDE2KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkV2ZW50RmxhZyA9IEV2ZW50Tm90ZU9uO1xuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuQ2hhbm5lbCA9IChieXRlKShldmVudGZsYWcgLSBFdmVudE5vdGVPbik7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5Ob3RlbnVtYmVyID0gZmlsZS5SZWFkQnl0ZSgpO1xuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuVmVsb2NpdHkgPSBmaWxlLlJlYWRCeXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGV2ZW50ZmxhZyA+PSBFdmVudE5vdGVPZmYgJiYgZXZlbnRmbGFnIDwgRXZlbnROb3RlT2ZmICsgMTYpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuRXZlbnRGbGFnID0gRXZlbnROb3RlT2ZmO1xuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuQ2hhbm5lbCA9IChieXRlKShldmVudGZsYWcgLSBFdmVudE5vdGVPZmYpO1xuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuTm90ZW51bWJlciA9IGZpbGUuUmVhZEJ5dGUoKTtcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LlZlbG9jaXR5ID0gZmlsZS5SZWFkQnl0ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChldmVudGZsYWcgPj0gRXZlbnRLZXlQcmVzc3VyZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50ZmxhZyA8IEV2ZW50S2V5UHJlc3N1cmUgKyAxNilcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPSBFdmVudEtleVByZXNzdXJlO1xuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuQ2hhbm5lbCA9IChieXRlKShldmVudGZsYWcgLSBFdmVudEtleVByZXNzdXJlKTtcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50Lk5vdGVudW1iZXIgPSBmaWxlLlJlYWRCeXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5LZXlQcmVzc3VyZSA9IGZpbGUuUmVhZEJ5dGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZXZlbnRmbGFnID49IEV2ZW50Q29udHJvbENoYW5nZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50ZmxhZyA8IEV2ZW50Q29udHJvbENoYW5nZSArIDE2KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkV2ZW50RmxhZyA9IEV2ZW50Q29udHJvbENoYW5nZTtcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkNoYW5uZWwgPSAoYnl0ZSkoZXZlbnRmbGFnIC0gRXZlbnRDb250cm9sQ2hhbmdlKTtcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkNvbnRyb2xOdW0gPSBmaWxlLlJlYWRCeXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5Db250cm9sVmFsdWUgPSBmaWxlLlJlYWRCeXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGV2ZW50ZmxhZyA+PSBFdmVudFByb2dyYW1DaGFuZ2UgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICBldmVudGZsYWcgPCBFdmVudFByb2dyYW1DaGFuZ2UgKyAxNilcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPSBFdmVudFByb2dyYW1DaGFuZ2U7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5DaGFubmVsID0gKGJ5dGUpKGV2ZW50ZmxhZyAtIEV2ZW50UHJvZ3JhbUNoYW5nZSk7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5JbnN0cnVtZW50ID0gZmlsZS5SZWFkQnl0ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChldmVudGZsYWcgPj0gRXZlbnRDaGFubmVsUHJlc3N1cmUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICBldmVudGZsYWcgPCBFdmVudENoYW5uZWxQcmVzc3VyZSArIDE2KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkV2ZW50RmxhZyA9IEV2ZW50Q2hhbm5lbFByZXNzdXJlO1xuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuQ2hhbm5lbCA9IChieXRlKShldmVudGZsYWcgLSBFdmVudENoYW5uZWxQcmVzc3VyZSk7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5DaGFuUHJlc3N1cmUgPSBmaWxlLlJlYWRCeXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGV2ZW50ZmxhZyA+PSBFdmVudFBpdGNoQmVuZCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50ZmxhZyA8IEV2ZW50UGl0Y2hCZW5kICsgMTYpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuRXZlbnRGbGFnID0gRXZlbnRQaXRjaEJlbmQ7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5DaGFubmVsID0gKGJ5dGUpKGV2ZW50ZmxhZyAtIEV2ZW50UGl0Y2hCZW5kKTtcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LlBpdGNoQmVuZCA9IGZpbGUuUmVhZFNob3J0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGV2ZW50ZmxhZyA9PSBTeXNleEV2ZW50MSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPSBTeXNleEV2ZW50MTtcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50Lk1ldGFsZW5ndGggPSBmaWxlLlJlYWRWYXJsZW4oKTtcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LlZhbHVlID0gZmlsZS5SZWFkQnl0ZXMobWV2ZW50Lk1ldGFsZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChldmVudGZsYWcgPT0gU3lzZXhFdmVudDIpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBtZXZlbnQuRXZlbnRGbGFnID0gU3lzZXhFdmVudDI7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5NZXRhbGVuZ3RoID0gZmlsZS5SZWFkVmFybGVuKCk7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5WYWx1ZSA9IGZpbGUuUmVhZEJ5dGVzKG1ldmVudC5NZXRhbGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZXZlbnRmbGFnID09IE1ldGFFdmVudClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPSBNZXRhRXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5NZXRhZXZlbnQgPSBmaWxlLlJlYWRCeXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5NZXRhbGVuZ3RoID0gZmlsZS5SZWFkVmFybGVuKCk7XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5WYWx1ZSA9IGZpbGUuUmVhZEJ5dGVzKG1ldmVudC5NZXRhbGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1ldmVudC5NZXRhZXZlbnQgPT0gTWV0YUV2ZW50VGltZVNpZ25hdHVyZSlcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1ldmVudC5NZXRhbGVuZ3RoIDwgMilcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aHJvdyBuZXcgTWlkaUZpbGVFeGNlcHRpb24oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gIFwiTWV0YSBFdmVudCBUaW1lIFNpZ25hdHVyZSBsZW4gPT0gXCIgKyBtZXZlbnQuTWV0YWxlbmd0aCAgKyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgXCIgIT0gNFwiLCBmaWxlLkdldE9mZnNldCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXZlbnQuTnVtZXJhdG9yID0gKGJ5dGUpMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXZlbnQuRGVub21pbmF0b3IgPSAoYnl0ZSk0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobWV2ZW50Lk1ldGFsZW5ndGggPj0gMiAmJiBtZXZlbnQuTWV0YWxlbmd0aCA8IDQpXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV2ZW50Lk51bWVyYXRvciA9IChieXRlKW1ldmVudC5WYWx1ZVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXZlbnQuRGVub21pbmF0b3IgPSAoYnl0ZSlTeXN0ZW0uTWF0aC5Qb3coMiwgbWV2ZW50LlZhbHVlWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXZlbnQuTnVtZXJhdG9yID0gKGJ5dGUpbWV2ZW50LlZhbHVlWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldmVudC5EZW5vbWluYXRvciA9IChieXRlKVN5c3RlbS5NYXRoLlBvdygyLCBtZXZlbnQuVmFsdWVbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1ldmVudC5NZXRhZXZlbnQgPT0gTWV0YUV2ZW50VGVtcG8pXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtZXZlbnQuTWV0YWxlbmd0aCAhPSAzKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBNaWRpRmlsZUV4Y2VwdGlvbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiTWV0YSBFdmVudCBUZW1wbyBsZW4gPT0gXCIgKyBtZXZlbnQuTWV0YWxlbmd0aCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiAhPSAzXCIsIGZpbGUuR2V0T2Zmc2V0KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbWV2ZW50LlRlbXBvID0gKChtZXZlbnQuVmFsdWVbMF0gPDwgMTYpIHwgKG1ldmVudC5WYWx1ZVsxXSA8PCA4KSB8IG1ldmVudC5WYWx1ZVsyXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobWV2ZW50Lk1ldGFldmVudCA9PSBNZXRhRXZlbnRFbmRPZlRyYWNrKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBicmVhazsgICovXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1pZGlGaWxlRXhjZXB0aW9uKFwiVW5rbm93biBldmVudCBcIiArIG1ldmVudC5FdmVudEZsYWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5HZXRPZmZzZXQoKSAtIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBSZXR1cm4gdHJ1ZSBpZiB0aGlzIHRyYWNrIGNvbnRhaW5zIG11bHRpcGxlIGNoYW5uZWxzLlxuICAgICAgICAgKiBJZiBhIE1pZGlGaWxlIGNvbnRhaW5zIG9ubHkgb25lIHRyYWNrLCBhbmQgaXQgaGFzIG11bHRpcGxlIGNoYW5uZWxzLFxuICAgICAgICAgKiB0aGVuIHdlIHRyZWF0IGVhY2ggY2hhbm5lbCBhcyBhIHNlcGFyYXRlIHRyYWNrLlxuICAgICAgICAgKi9cbiAgICAgICAgc3RhdGljIGJvb2wgSGFzTXVsdGlwbGVDaGFubmVscyhNaWRpVHJhY2sgdHJhY2spXG4gICAgICAgIHtcbiAgICAgICAgICAgIGludCBjaGFubmVsID0gdHJhY2suTm90ZXNbMF0uQ2hhbm5lbDtcbiAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlOb3RlIG5vdGUgaW4gdHJhY2suTm90ZXMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKG5vdGUuQ2hhbm5lbCAhPSBjaGFubmVsKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIFdyaXRlIGEgdmFyaWFibGUgbGVuZ3RoIG51bWJlciB0byB0aGUgYnVmZmVyIGF0IHRoZSBnaXZlbiBvZmZzZXQuXG4gICAgICAgICAqIFJldHVybiB0aGUgbnVtYmVyIG9mIGJ5dGVzIHdyaXR0ZW4uXG4gICAgICAgICAqL1xuICAgICAgICBzdGF0aWMgaW50IFZhcmxlblRvQnl0ZXMoaW50IG51bSwgYnl0ZVtdIGJ1ZiwgaW50IG9mZnNldClcbiAgICAgICAge1xuICAgICAgICAgICAgYnl0ZSBiMSA9IChieXRlKSgobnVtID4+IDIxKSAmIDB4N0YpO1xuICAgICAgICAgICAgYnl0ZSBiMiA9IChieXRlKSgobnVtID4+IDE0KSAmIDB4N0YpO1xuICAgICAgICAgICAgYnl0ZSBiMyA9IChieXRlKSgobnVtID4+IDcpICYgMHg3Rik7XG4gICAgICAgICAgICBieXRlIGI0ID0gKGJ5dGUpKG51bSAmIDB4N0YpO1xuXG4gICAgICAgICAgICBpZiAoYjEgPiAwKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGJ1ZltvZmZzZXRdID0gKGJ5dGUpKGIxIHwgMHg4MCk7XG4gICAgICAgICAgICAgICAgYnVmW29mZnNldCArIDFdID0gKGJ5dGUpKGIyIHwgMHg4MCk7XG4gICAgICAgICAgICAgICAgYnVmW29mZnNldCArIDJdID0gKGJ5dGUpKGIzIHwgMHg4MCk7XG4gICAgICAgICAgICAgICAgYnVmW29mZnNldCArIDNdID0gYjQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChiMiA+IDApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYnVmW29mZnNldF0gPSAoYnl0ZSkoYjIgfCAweDgwKTtcbiAgICAgICAgICAgICAgICBidWZbb2Zmc2V0ICsgMV0gPSAoYnl0ZSkoYjMgfCAweDgwKTtcbiAgICAgICAgICAgICAgICBidWZbb2Zmc2V0ICsgMl0gPSBiNDtcbiAgICAgICAgICAgICAgICByZXR1cm4gMztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGIzID4gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBidWZbb2Zmc2V0XSA9IChieXRlKShiMyB8IDB4ODApO1xuICAgICAgICAgICAgICAgIGJ1ZltvZmZzZXQgKyAxXSA9IGI0O1xuICAgICAgICAgICAgICAgIHJldHVybiAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGJ1ZltvZmZzZXRdID0gYjQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiogV3JpdGUgYSA0LWJ5dGUgaW50ZWdlciB0byBkYXRhW29mZnNldCA6IG9mZnNldCs0XSAqL1xuICAgICAgICBwcml2YXRlIHN0YXRpYyB2b2lkIEludFRvQnl0ZXMoaW50IHZhbHVlLCBieXRlW10gZGF0YSwgaW50IG9mZnNldClcbiAgICAgICAge1xuICAgICAgICAgICAgZGF0YVtvZmZzZXRdID0gKGJ5dGUpKCh2YWx1ZSA+PiAyNCkgJiAweEZGKTtcbiAgICAgICAgICAgIGRhdGFbb2Zmc2V0ICsgMV0gPSAoYnl0ZSkoKHZhbHVlID4+IDE2KSAmIDB4RkYpO1xuICAgICAgICAgICAgZGF0YVtvZmZzZXQgKyAyXSA9IChieXRlKSgodmFsdWUgPj4gOCkgJiAweEZGKTtcbiAgICAgICAgICAgIGRhdGFbb2Zmc2V0ICsgM10gPSAoYnl0ZSkodmFsdWUgJiAweEZGKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBDYWxjdWxhdGUgdGhlIHRyYWNrIGxlbmd0aCAoaW4gYnl0ZXMpIGdpdmVuIGEgbGlzdCBvZiBNaWRpIGV2ZW50cyAqL1xuICAgICAgICBwcml2YXRlIHN0YXRpYyBpbnQgR2V0VHJhY2tMZW5ndGgoTGlzdDxNaWRpRXZlbnQ+IGV2ZW50cylcbiAgICAgICAge1xuICAgICAgICAgICAgaW50IGxlbiA9IDA7XG4gICAgICAgICAgICBieXRlW10gYnVmID0gbmV3IGJ5dGVbMTAyNF07XG4gICAgICAgICAgICBmb3JlYWNoIChNaWRpRXZlbnQgbWV2ZW50IGluIGV2ZW50cylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsZW4gKz0gVmFybGVuVG9CeXRlcyhtZXZlbnQuRGVsdGFUaW1lLCBidWYsIDApO1xuICAgICAgICAgICAgICAgIGxlbiArPSAxOyAgLyogZm9yIGV2ZW50ZmxhZyAqL1xuICAgICAgICAgICAgICAgIHN3aXRjaCAobWV2ZW50LkV2ZW50RmxhZylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRXZlbnROb3RlT246IGxlbiArPSAyOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBFdmVudE5vdGVPZmY6IGxlbiArPSAyOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBFdmVudEtleVByZXNzdXJlOiBsZW4gKz0gMjsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRXZlbnRDb250cm9sQ2hhbmdlOiBsZW4gKz0gMjsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRXZlbnRQcm9ncmFtQ2hhbmdlOiBsZW4gKz0gMTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRXZlbnRDaGFubmVsUHJlc3N1cmU6IGxlbiArPSAxOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBFdmVudFBpdGNoQmVuZDogbGVuICs9IDI7IGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU3lzZXhFdmVudDE6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU3lzZXhFdmVudDI6XG4gICAgICAgICAgICAgICAgICAgICAgICBsZW4gKz0gVmFybGVuVG9CeXRlcyhtZXZlbnQuTWV0YWxlbmd0aCwgYnVmLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbiArPSBtZXZlbnQuTWV0YWxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIE1ldGFFdmVudDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbiArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGVuICs9IFZhcmxlblRvQnl0ZXMobWV2ZW50Lk1ldGFsZW5ndGgsIGJ1ZiwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZW4gKz0gbWV2ZW50Lk1ldGFsZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGxlbjtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqIFdyaXRlIHRoZSBnaXZlbiBsaXN0IG9mIE1pZGkgZXZlbnRzIHRvIGEgc3RyZWFtL2ZpbGUuXG4gICAgICAgICAqICBUaGlzIG1ldGhvZCBpcyB1c2VkIGZvciBzb3VuZCBwbGF5YmFjaywgZm9yIGNyZWF0aW5nIG5ldyBNaWRpIGZpbGVzXG4gICAgICAgICAqICB3aXRoIHRoZSB0ZW1wbywgdHJhbnNwb3NlLCBldGMgY2hhbmdlZC5cbiAgICAgICAgICpcbiAgICAgICAgICogIFJldHVybiB0cnVlIG9uIHN1Y2Nlc3MsIGFuZCBmYWxzZSBvbiBlcnJvci5cbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGUgc3RhdGljIGJvb2xcbiAgICAgICAgV3JpdGVFdmVudHMoU3RyZWFtIGZpbGUsIExpc3Q8TWlkaUV2ZW50PltdIGV2ZW50cywgaW50IHRyYWNrbW9kZSwgaW50IHF1YXJ0ZXIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGJ5dGVbXSBidWYgPSBuZXcgYnl0ZVs2NTUzNl07XG5cbiAgICAgICAgICAgICAgICAvKiBXcml0ZSB0aGUgTVRoZCwgbGVuID0gNiwgdHJhY2sgbW9kZSwgbnVtYmVyIHRyYWNrcywgcXVhcnRlciBub3RlICovXG4gICAgICAgICAgICAgICAgZmlsZS5Xcml0ZShBU0NJSUVuY29kaW5nLkFTQ0lJLkdldEJ5dGVzKFwiTVRoZFwiKSwgMCwgNCk7XG4gICAgICAgICAgICAgICAgSW50VG9CeXRlcyg2LCBidWYsIDApO1xuICAgICAgICAgICAgICAgIGZpbGUuV3JpdGUoYnVmLCAwLCA0KTtcbiAgICAgICAgICAgICAgICBidWZbMF0gPSAoYnl0ZSkodHJhY2ttb2RlID4+IDgpO1xuICAgICAgICAgICAgICAgIGJ1ZlsxXSA9IChieXRlKSh0cmFja21vZGUgJiAweEZGKTtcbiAgICAgICAgICAgICAgICBmaWxlLldyaXRlKGJ1ZiwgMCwgMik7XG4gICAgICAgICAgICAgICAgYnVmWzBdID0gMDtcbiAgICAgICAgICAgICAgICBidWZbMV0gPSAoYnl0ZSlldmVudHMuTGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZpbGUuV3JpdGUoYnVmLCAwLCAyKTtcbiAgICAgICAgICAgICAgICBidWZbMF0gPSAoYnl0ZSkocXVhcnRlciA+PiA4KTtcbiAgICAgICAgICAgICAgICBidWZbMV0gPSAoYnl0ZSkocXVhcnRlciAmIDB4RkYpO1xuICAgICAgICAgICAgICAgIGZpbGUuV3JpdGUoYnVmLCAwLCAyKTtcblxuICAgICAgICAgICAgICAgIGZvcmVhY2ggKExpc3Q8TWlkaUV2ZW50PiBsaXN0IGluIGV2ZW50cylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIC8qIFdyaXRlIHRoZSBNVHJrIGhlYWRlciBhbmQgdHJhY2sgbGVuZ3RoICovXG4gICAgICAgICAgICAgICAgICAgIGZpbGUuV3JpdGUoQVNDSUlFbmNvZGluZy5BU0NJSS5HZXRCeXRlcyhcIk1UcmtcIiksIDAsIDQpO1xuICAgICAgICAgICAgICAgICAgICBpbnQgbGVuID0gR2V0VHJhY2tMZW5ndGgobGlzdCk7XG4gICAgICAgICAgICAgICAgICAgIEludFRvQnl0ZXMobGVuLCBidWYsIDApO1xuICAgICAgICAgICAgICAgICAgICBmaWxlLldyaXRlKGJ1ZiwgMCwgNCk7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yZWFjaCAoTWlkaUV2ZW50IG1ldmVudCBpbiBsaXN0KVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnQgdmFybGVuID0gVmFybGVuVG9CeXRlcyhtZXZlbnQuRGVsdGFUaW1lLCBidWYsIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5Xcml0ZShidWYsIDAsIHZhcmxlbik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtZXZlbnQuRXZlbnRGbGFnID09IFN5c2V4RXZlbnQxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkV2ZW50RmxhZyA9PSBTeXNleEV2ZW50MiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPT0gTWV0YUV2ZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlswXSA9IG1ldmVudC5FdmVudEZsYWc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmWzBdID0gKGJ5dGUpKG1ldmVudC5FdmVudEZsYWcgKyBtZXZlbnQuQ2hhbm5lbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLldyaXRlKGJ1ZiwgMCwgMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtZXZlbnQuRXZlbnRGbGFnID09IEV2ZW50Tm90ZU9uKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlswXSA9IG1ldmVudC5Ob3RlbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlsxXSA9IG1ldmVudC5WZWxvY2l0eTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLldyaXRlKGJ1ZiwgMCwgMik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChtZXZlbnQuRXZlbnRGbGFnID09IEV2ZW50Tm90ZU9mZilcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbMF0gPSBtZXZlbnQuTm90ZW51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbMV0gPSBtZXZlbnQuVmVsb2NpdHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5Xcml0ZShidWYsIDAsIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobWV2ZW50LkV2ZW50RmxhZyA9PSBFdmVudEtleVByZXNzdXJlKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlswXSA9IG1ldmVudC5Ob3RlbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlsxXSA9IG1ldmVudC5LZXlQcmVzc3VyZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLldyaXRlKGJ1ZiwgMCwgMik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChtZXZlbnQuRXZlbnRGbGFnID09IEV2ZW50Q29udHJvbENoYW5nZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbMF0gPSBtZXZlbnQuQ29udHJvbE51bTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbMV0gPSBtZXZlbnQuQ29udHJvbFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuV3JpdGUoYnVmLCAwLCAyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gRXZlbnRQcm9ncmFtQ2hhbmdlKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlswXSA9IG1ldmVudC5JbnN0cnVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuV3JpdGUoYnVmLCAwLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gRXZlbnRDaGFubmVsUHJlc3N1cmUpXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmWzBdID0gbWV2ZW50LkNoYW5QcmVzc3VyZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLldyaXRlKGJ1ZiwgMCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChtZXZlbnQuRXZlbnRGbGFnID09IEV2ZW50UGl0Y2hCZW5kKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlswXSA9IChieXRlKShtZXZlbnQuUGl0Y2hCZW5kID4+IDgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlsxXSA9IChieXRlKShtZXZlbnQuUGl0Y2hCZW5kICYgMHhGRik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5Xcml0ZShidWYsIDAsIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobWV2ZW50LkV2ZW50RmxhZyA9PSBTeXNleEV2ZW50MSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnQgb2Zmc2V0ID0gVmFybGVuVG9CeXRlcyhtZXZlbnQuTWV0YWxlbmd0aCwgYnVmLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5Db3B5KG1ldmVudC5WYWx1ZSwgMCwgYnVmLCBvZmZzZXQsIG1ldmVudC5WYWx1ZS5MZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuV3JpdGUoYnVmLCAwLCBvZmZzZXQgKyBtZXZlbnQuVmFsdWUuTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gU3lzZXhFdmVudDIpXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50IG9mZnNldCA9IFZhcmxlblRvQnl0ZXMobWV2ZW50Lk1ldGFsZW5ndGgsIGJ1ZiwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXkuQ29weShtZXZlbnQuVmFsdWUsIDAsIGJ1Ziwgb2Zmc2V0LCBtZXZlbnQuVmFsdWUuTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLldyaXRlKGJ1ZiwgMCwgb2Zmc2V0ICsgbWV2ZW50LlZhbHVlLkxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChtZXZlbnQuRXZlbnRGbGFnID09IE1ldGFFdmVudCAmJiBtZXZlbnQuTWV0YWV2ZW50ID09IE1ldGFFdmVudFRlbXBvKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZlswXSA9IG1ldmVudC5NZXRhZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmWzFdID0gMztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbMl0gPSAoYnl0ZSkoKG1ldmVudC5UZW1wbyA+PiAxNikgJiAweEZGKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbM10gPSAoYnl0ZSkoKG1ldmVudC5UZW1wbyA+PiA4KSAmIDB4RkYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1Zls0XSA9IChieXRlKShtZXZlbnQuVGVtcG8gJiAweEZGKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLldyaXRlKGJ1ZiwgMCwgNSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChtZXZlbnQuRXZlbnRGbGFnID09IE1ldGFFdmVudClcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbMF0gPSBtZXZlbnQuTWV0YWV2ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludCBvZmZzZXQgPSBWYXJsZW5Ub0J5dGVzKG1ldmVudC5NZXRhbGVuZ3RoLCBidWYsIDEpICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5Db3B5KG1ldmVudC5WYWx1ZSwgMCwgYnVmLCBvZmZzZXQsIG1ldmVudC5WYWx1ZS5MZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuV3JpdGUoYnVmLCAwLCBvZmZzZXQgKyBtZXZlbnQuVmFsdWUuTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWxlLkNsb3NlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoSU9FeGNlcHRpb24pXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvKiogQ2xvbmUgdGhlIGxpc3Qgb2YgTWlkaUV2ZW50cyAqL1xuICAgICAgICBwcml2YXRlIHN0YXRpYyBMaXN0PE1pZGlFdmVudD5bXSBDbG9uZU1pZGlFdmVudHMoTGlzdDxNaWRpRXZlbnQ+W10gb3JpZ2xpc3QpXG4gICAgICAgIHtcbiAgICAgICAgICAgIExpc3Q8TWlkaUV2ZW50PltdIG5ld2xpc3QgPSBuZXcgTGlzdDxNaWRpRXZlbnQ+W29yaWdsaXN0Lkxlbmd0aF07XG4gICAgICAgICAgICBmb3IgKGludCB0cmFja251bSA9IDA7IHRyYWNrbnVtIDwgb3JpZ2xpc3QuTGVuZ3RoOyB0cmFja251bSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIExpc3Q8TWlkaUV2ZW50PiBvcmlnZXZlbnRzID0gb3JpZ2xpc3RbdHJhY2tudW1dO1xuICAgICAgICAgICAgICAgIExpc3Q8TWlkaUV2ZW50PiBuZXdldmVudHMgPSBuZXcgTGlzdDxNaWRpRXZlbnQ+KG9yaWdldmVudHMuQ291bnQpO1xuICAgICAgICAgICAgICAgIG5ld2xpc3RbdHJhY2tudW1dID0gbmV3ZXZlbnRzO1xuICAgICAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlFdmVudCBtZXZlbnQgaW4gb3JpZ2V2ZW50cylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5ld2V2ZW50cy5BZGQobWV2ZW50LkNsb25lKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdsaXN0O1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIENyZWF0ZSBhIG5ldyBNaWRpIHRlbXBvIGV2ZW50LCB3aXRoIHRoZSBnaXZlbiB0ZW1wbyAgKi9cbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgTWlkaUV2ZW50IENyZWF0ZVRlbXBvRXZlbnQoaW50IHRlbXBvKVxuICAgICAgICB7XG4gICAgICAgICAgICBNaWRpRXZlbnQgbWV2ZW50ID0gbmV3IE1pZGlFdmVudCgpO1xuICAgICAgICAgICAgbWV2ZW50LkRlbHRhVGltZSA9IDA7XG4gICAgICAgICAgICBtZXZlbnQuU3RhcnRUaW1lID0gMDtcbiAgICAgICAgICAgIG1ldmVudC5IYXNFdmVudGZsYWcgPSB0cnVlO1xuICAgICAgICAgICAgbWV2ZW50LkV2ZW50RmxhZyA9IE1ldGFFdmVudDtcbiAgICAgICAgICAgIG1ldmVudC5NZXRhZXZlbnQgPSBNZXRhRXZlbnRUZW1wbztcbiAgICAgICAgICAgIG1ldmVudC5NZXRhbGVuZ3RoID0gMztcbiAgICAgICAgICAgIG1ldmVudC5UZW1wbyA9IHRlbXBvO1xuICAgICAgICAgICAgcmV0dXJuIG1ldmVudDtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqIFNlYXJjaCB0aGUgZXZlbnRzIGZvciBhIENvbnRyb2xDaGFuZ2UgZXZlbnQgd2l0aCB0aGUgc2FtZVxuICAgICAgICAgKiAgY2hhbm5lbCBhbmQgY29udHJvbCBudW1iZXIuICBJZiBhIG1hdGNoaW5nIGV2ZW50IGlzIGZvdW5kLFxuICAgICAgICAgKiAgIHVwZGF0ZSB0aGUgY29udHJvbCB2YWx1ZS4gIEVsc2UsIGFkZCBhIG5ldyBDb250cm9sQ2hhbmdlIGV2ZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgdm9pZFxuICAgICAgICBVcGRhdGVDb250cm9sQ2hhbmdlKExpc3Q8TWlkaUV2ZW50PiBuZXdldmVudHMsIE1pZGlFdmVudCBjaGFuZ2VFdmVudClcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaUV2ZW50IG1ldmVudCBpbiBuZXdldmVudHMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKChtZXZlbnQuRXZlbnRGbGFnID09IGNoYW5nZUV2ZW50LkV2ZW50RmxhZykgJiZcbiAgICAgICAgICAgICAgICAgICAgKG1ldmVudC5DaGFubmVsID09IGNoYW5nZUV2ZW50LkNoYW5uZWwpICYmXG4gICAgICAgICAgICAgICAgICAgIChtZXZlbnQuQ29udHJvbE51bSA9PSBjaGFuZ2VFdmVudC5Db250cm9sTnVtKSlcbiAgICAgICAgICAgICAgICB7XG5cbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkNvbnRyb2xWYWx1ZSA9IGNoYW5nZUV2ZW50LkNvbnRyb2xWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5ld2V2ZW50cy5BZGQoY2hhbmdlRXZlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIFN0YXJ0IHRoZSBNaWRpIG11c2ljIGF0IHRoZSBnaXZlbiBwYXVzZSB0aW1lIChpbiBwdWxzZXMpLlxuICAgICAgICAgKiAgUmVtb3ZlIGFueSBOb3RlT24vTm90ZU9mZiBldmVudHMgdGhhdCBvY2N1ciBiZWZvcmUgdGhlIHBhdXNlIHRpbWUuXG4gICAgICAgICAqICBGb3Igb3RoZXIgZXZlbnRzLCBjaGFuZ2UgdGhlIGRlbHRhLXRpbWUgdG8gMCBpZiB0aGV5IG9jY3VyXG4gICAgICAgICAqICBiZWZvcmUgdGhlIHBhdXNlIHRpbWUuICBSZXR1cm4gdGhlIG1vZGlmaWVkIE1pZGkgRXZlbnRzLlxuICAgICAgICAgKi9cbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgTGlzdDxNaWRpRXZlbnQ+W11cbiAgICAgICAgU3RhcnRBdFBhdXNlVGltZShMaXN0PE1pZGlFdmVudD5bXSBsaXN0LCBpbnQgcGF1c2VUaW1lKVxuICAgICAgICB7XG4gICAgICAgICAgICBMaXN0PE1pZGlFdmVudD5bXSBuZXdsaXN0ID0gbmV3IExpc3Q8TWlkaUV2ZW50PltsaXN0Lkxlbmd0aF07XG4gICAgICAgICAgICBmb3IgKGludCB0cmFja251bSA9IDA7IHRyYWNrbnVtIDwgbGlzdC5MZW5ndGg7IHRyYWNrbnVtKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgTGlzdDxNaWRpRXZlbnQ+IGV2ZW50cyA9IGxpc3RbdHJhY2tudW1dO1xuICAgICAgICAgICAgICAgIExpc3Q8TWlkaUV2ZW50PiBuZXdldmVudHMgPSBuZXcgTGlzdDxNaWRpRXZlbnQ+KGV2ZW50cy5Db3VudCk7XG4gICAgICAgICAgICAgICAgbmV3bGlzdFt0cmFja251bV0gPSBuZXdldmVudHM7XG5cbiAgICAgICAgICAgICAgICBib29sIGZvdW5kRXZlbnRBZnRlclBhdXNlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZm9yZWFjaCAoTWlkaUV2ZW50IG1ldmVudCBpbiBldmVudHMpXG4gICAgICAgICAgICAgICAge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXZlbnQuU3RhcnRUaW1lIDwgcGF1c2VUaW1lKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWV2ZW50LkV2ZW50RmxhZyA9PSBFdmVudE5vdGVPbiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldmVudC5FdmVudEZsYWcgPT0gRXZlbnROb3RlT2ZmKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2tpcCBOb3RlT24vTm90ZU9mZiBldmVudCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobWV2ZW50LkV2ZW50RmxhZyA9PSBFdmVudENvbnRyb2xDaGFuZ2UpXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkRlbHRhVGltZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVXBkYXRlQ29udHJvbENoYW5nZShuZXdldmVudHMsIG1ldmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkRlbHRhVGltZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3ZXZlbnRzLkFkZChtZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFmb3VuZEV2ZW50QWZ0ZXJQYXVzZSlcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWV2ZW50LkRlbHRhVGltZSA9IChtZXZlbnQuU3RhcnRUaW1lIC0gcGF1c2VUaW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld2V2ZW50cy5BZGQobWV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kRXZlbnRBZnRlclBhdXNlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld2V2ZW50cy5BZGQobWV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdsaXN0O1xuICAgICAgICB9XG5cblxuICAgICAgICAvKiogV3JpdGUgdGhpcyBNaWRpIGZpbGUgdG8gdGhlIGdpdmVuIGZpbGVuYW1lLlxuICAgICAgICAgKiBJZiBvcHRpb25zIGlzIG5vdCBudWxsLCBhcHBseSB0aG9zZSBvcHRpb25zIHRvIHRoZSBtaWRpIGV2ZW50c1xuICAgICAgICAgKiBiZWZvcmUgcGVyZm9ybWluZyB0aGUgd3JpdGUuXG4gICAgICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSBmaWxlIHdhcyBzYXZlZCBzdWNjZXNzZnVsbHksIGVsc2UgZmFsc2UuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgYm9vbCBDaGFuZ2VTb3VuZChzdHJpbmcgZGVzdGZpbGUsIE1pZGlPcHRpb25zIG9wdGlvbnMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBXcml0ZShkZXN0ZmlsZSwgb3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgYm9vbCBXcml0ZShzdHJpbmcgZGVzdGZpbGUsIE1pZGlPcHRpb25zIG9wdGlvbnMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIEZpbGVTdHJlYW0gc3RyZWFtO1xuICAgICAgICAgICAgICAgIHN0cmVhbSA9IG5ldyBGaWxlU3RyZWFtKGRlc3RmaWxlLCBGaWxlTW9kZS5DcmVhdGUpO1xuICAgICAgICAgICAgICAgIGJvb2wgcmVzdWx0ID0gV3JpdGUoc3RyZWFtLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICBzdHJlYW0uQ2xvc2UoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKElPRXhjZXB0aW9uKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBXcml0ZSB0aGlzIE1pZGkgZmlsZSB0byB0aGUgZ2l2ZW4gc3RyZWFtLlxuICAgICAgICAgKiBJZiBvcHRpb25zIGlzIG5vdCBudWxsLCBhcHBseSB0aG9zZSBvcHRpb25zIHRvIHRoZSBtaWRpIGV2ZW50c1xuICAgICAgICAgKiBiZWZvcmUgcGVyZm9ybWluZyB0aGUgd3JpdGUuXG4gICAgICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSBmaWxlIHdhcyBzYXZlZCBzdWNjZXNzZnVsbHksIGVsc2UgZmFsc2UuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgYm9vbCBXcml0ZShTdHJlYW0gc3RyZWFtLCBNaWRpT3B0aW9ucyBvcHRpb25zKVxuICAgICAgICB7XG4gICAgICAgICAgICBMaXN0PE1pZGlFdmVudD5bXSBuZXdldmVudHMgPSBldmVudHM7XG4gICAgICAgICAgICBpZiAob3B0aW9ucyAhPSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5ld2V2ZW50cyA9IEFwcGx5T3B0aW9uc1RvRXZlbnRzKG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFdyaXRlRXZlbnRzKHN0cmVhbSwgbmV3ZXZlbnRzLCB0cmFja21vZGUsIHF1YXJ0ZXJub3RlKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyogQXBwbHkgdGhlIGZvbGxvd2luZyBzb3VuZCBvcHRpb25zIHRvIHRoZSBtaWRpIGV2ZW50czpcbiAgICAgICAgICogLSBUaGUgdGVtcG8gKHRoZSBtaWNyb3NlY29uZHMgcGVyIHB1bHNlKVxuICAgICAgICAgKiAtIFRoZSBpbnN0cnVtZW50cyBwZXIgdHJhY2tcbiAgICAgICAgICogLSBUaGUgbm90ZSBudW1iZXIgKHRyYW5zcG9zZSB2YWx1ZSlcbiAgICAgICAgICogLSBUaGUgdHJhY2tzIHRvIGluY2x1ZGVcbiAgICAgICAgICogUmV0dXJuIHRoZSBtb2RpZmllZCBsaXN0IG9mIG1pZGkgZXZlbnRzLlxuICAgICAgICAgKi9cbiAgICAgICAgcHJpdmF0ZSBMaXN0PE1pZGlFdmVudD5bXVxuICAgICAgICBBcHBseU9wdGlvbnNUb0V2ZW50cyhNaWRpT3B0aW9ucyBvcHRpb25zKVxuICAgICAgICB7XG4gICAgICAgICAgICBpbnQgaTtcbiAgICAgICAgICAgIGlmICh0cmFja1BlckNoYW5uZWwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFwcGx5T3B0aW9uc1BlckNoYW5uZWwob3B0aW9ucyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIEEgbWlkaWZpbGUgY2FuIGNvbnRhaW4gdHJhY2tzIHdpdGggbm90ZXMgYW5kIHRyYWNrcyB3aXRob3V0IG5vdGVzLlxuICAgICAgICAgICAgICogVGhlIG9wdGlvbnMudHJhY2tzIGFuZCBvcHRpb25zLmluc3RydW1lbnRzIGFyZSBmb3IgdHJhY2tzIHdpdGggbm90ZXMuXG4gICAgICAgICAgICAgKiBTbyB0aGUgdHJhY2sgbnVtYmVycyBpbiAnb3B0aW9ucycgbWF5IG5vdCBtYXRjaCBjb3JyZWN0bHkgaWYgdGhlXG4gICAgICAgICAgICAgKiBtaWRpIGZpbGUgaGFzIHRyYWNrcyB3aXRob3V0IG5vdGVzLiBSZS1jb21wdXRlIHRoZSBpbnN0cnVtZW50cywgYW5kIFxuICAgICAgICAgICAgICogdHJhY2tzIHRvIGtlZXAuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGludCBudW1fdHJhY2tzID0gZXZlbnRzLkxlbmd0aDtcbiAgICAgICAgICAgIGludFtdIGluc3RydW1lbnRzID0gbmV3IGludFtudW1fdHJhY2tzXTtcbiAgICAgICAgICAgIGJvb2xbXSBrZWVwdHJhY2tzID0gbmV3IGJvb2xbbnVtX3RyYWNrc107XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbnVtX3RyYWNrczsgaSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGluc3RydW1lbnRzW2ldID0gMDtcbiAgICAgICAgICAgICAgICBrZWVwdHJhY2tzW2ldID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoaW50IHRyYWNrbnVtID0gMDsgdHJhY2tudW0gPCB0cmFja3MuQ291bnQ7IHRyYWNrbnVtKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgTWlkaVRyYWNrIHRyYWNrID0gdHJhY2tzW3RyYWNrbnVtXTtcbiAgICAgICAgICAgICAgICBpbnQgcmVhbHRyYWNrID0gdHJhY2suTnVtYmVyO1xuICAgICAgICAgICAgICAgIGluc3RydW1lbnRzW3JlYWx0cmFja10gPSBvcHRpb25zLmluc3RydW1lbnRzW3RyYWNrbnVtXTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5tdXRlW3RyYWNrbnVtXSA9PSB0cnVlKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAga2VlcHRyYWNrc1tyZWFsdHJhY2tdID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBMaXN0PE1pZGlFdmVudD5bXSBuZXdldmVudHMgPSBDbG9uZU1pZGlFdmVudHMoZXZlbnRzKTtcblxuICAgICAgICAgICAgLyogU2V0IHRoZSB0ZW1wbyBhdCB0aGUgYmVnaW5uaW5nIG9mIGVhY2ggdHJhY2sgKi9cbiAgICAgICAgICAgIGZvciAoaW50IHRyYWNrbnVtID0gMDsgdHJhY2tudW0gPCBuZXdldmVudHMuTGVuZ3RoOyB0cmFja251bSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIE1pZGlFdmVudCBtZXZlbnQgPSBDcmVhdGVUZW1wb0V2ZW50KG9wdGlvbnMudGVtcG8pO1xuICAgICAgICAgICAgICAgIG5ld2V2ZW50c1t0cmFja251bV0uSW5zZXJ0KDAsIG1ldmVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIENoYW5nZSB0aGUgbm90ZSBudW1iZXIgKHRyYW5zcG9zZSksIGluc3RydW1lbnQsIGFuZCB0ZW1wbyAqL1xuICAgICAgICAgICAgZm9yIChpbnQgdHJhY2tudW0gPSAwOyB0cmFja251bSA8IG5ld2V2ZW50cy5MZW5ndGg7IHRyYWNrbnVtKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZm9yZWFjaCAoTWlkaUV2ZW50IG1ldmVudCBpbiBuZXdldmVudHNbdHJhY2tudW1dKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaW50IG51bSA9IG1ldmVudC5Ob3RlbnVtYmVyICsgb3B0aW9ucy50cmFuc3Bvc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChudW0gPCAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgbnVtID0gMDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG51bSA+IDEyNylcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bSA9IDEyNztcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50Lk5vdGVudW1iZXIgPSAoYnl0ZSludW07XG4gICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy51c2VEZWZhdWx0SW5zdHJ1bWVudHMpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldmVudC5JbnN0cnVtZW50ID0gKGJ5dGUpaW5zdHJ1bWVudHNbdHJhY2tudW1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5UZW1wbyA9IG9wdGlvbnMudGVtcG87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5wYXVzZVRpbWUgIT0gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuZXdldmVudHMgPSBTdGFydEF0UGF1c2VUaW1lKG5ld2V2ZW50cywgb3B0aW9ucy5wYXVzZVRpbWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBDaGFuZ2UgdGhlIHRyYWNrcyB0byBpbmNsdWRlICovXG4gICAgICAgICAgICBpbnQgY291bnQgPSAwO1xuICAgICAgICAgICAgZm9yIChpbnQgdHJhY2tudW0gPSAwOyB0cmFja251bSA8IGtlZXB0cmFja3MuTGVuZ3RoOyB0cmFja251bSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmIChrZWVwdHJhY2tzW3RyYWNrbnVtXSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgTGlzdDxNaWRpRXZlbnQ+W10gcmVzdWx0ID0gbmV3IExpc3Q8TWlkaUV2ZW50Pltjb3VudF07XG4gICAgICAgICAgICBpID0gMDtcbiAgICAgICAgICAgIGZvciAoaW50IHRyYWNrbnVtID0gMDsgdHJhY2tudW0gPCBrZWVwdHJhY2tzLkxlbmd0aDsgdHJhY2tudW0rKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoa2VlcHRyYWNrc1t0cmFja251bV0pXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRbaV0gPSBuZXdldmVudHNbdHJhY2tudW1dO1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIEFwcGx5IHRoZSBmb2xsb3dpbmcgc291bmQgb3B0aW9ucyB0byB0aGUgbWlkaSBldmVudHM6XG4gICAgICAgICAqIC0gVGhlIHRlbXBvICh0aGUgbWljcm9zZWNvbmRzIHBlciBwdWxzZSlcbiAgICAgICAgICogLSBUaGUgaW5zdHJ1bWVudHMgcGVyIHRyYWNrXG4gICAgICAgICAqIC0gVGhlIG5vdGUgbnVtYmVyICh0cmFuc3Bvc2UgdmFsdWUpXG4gICAgICAgICAqIC0gVGhlIHRyYWNrcyB0byBpbmNsdWRlXG4gICAgICAgICAqIFJldHVybiB0aGUgbW9kaWZpZWQgbGlzdCBvZiBtaWRpIGV2ZW50cy5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyBNaWRpIGZpbGUgb25seSBoYXMgb25lIGFjdHVhbCB0cmFjaywgYnV0IHdlJ3ZlIHNwbGl0IHRoYXRcbiAgICAgICAgICogaW50byBtdWx0aXBsZSBmYWtlIHRyYWNrcywgb25lIHBlciBjaGFubmVsLCBhbmQgZGlzcGxheWVkIHRoYXRcbiAgICAgICAgICogdG8gdGhlIGVuZC11c2VyLiAgU28gY2hhbmdpbmcgdGhlIGluc3RydW1lbnQsIGFuZCB0cmFja3MgdG9cbiAgICAgICAgICogaW5jbHVkZSwgaXMgaW1wbGVtZW50ZWQgZGlmZmVyZW50bHkgdGhhbiBBcHBseU9wdGlvbnNUb0V2ZW50cygpLlxuICAgICAgICAgKlxuICAgICAgICAgKiAtIFdlIGNoYW5nZSB0aGUgaW5zdHJ1bWVudCBiYXNlZCBvbiB0aGUgY2hhbm5lbCwgbm90IHRoZSB0cmFjay5cbiAgICAgICAgICogLSBXZSBpbmNsdWRlL2V4Y2x1ZGUgY2hhbm5lbHMsIG5vdCB0cmFja3MuXG4gICAgICAgICAqIC0gV2UgZXhjbHVkZSBhIGNoYW5uZWwgYnkgc2V0dGluZyB0aGUgbm90ZSB2b2x1bWUvdmVsb2NpdHkgdG8gMC5cbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGUgTGlzdDxNaWRpRXZlbnQ+W11cbiAgICAgICAgQXBwbHlPcHRpb25zUGVyQ2hhbm5lbChNaWRpT3B0aW9ucyBvcHRpb25zKVxuICAgICAgICB7XG4gICAgICAgICAgICAvKiBEZXRlcm1pbmUgd2hpY2ggY2hhbm5lbHMgdG8gaW5jbHVkZS9leGNsdWRlLlxuICAgICAgICAgICAgICogQWxzbywgZGV0ZXJtaW5lIHRoZSBpbnN0cnVtZW50cyBmb3IgZWFjaCBjaGFubmVsLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpbnRbXSBpbnN0cnVtZW50cyA9IG5ldyBpbnRbMTZdO1xuICAgICAgICAgICAgYm9vbFtdIGtlZXBjaGFubmVsID0gbmV3IGJvb2xbMTZdO1xuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCAxNjsgaSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGluc3RydW1lbnRzW2ldID0gMDtcbiAgICAgICAgICAgICAgICBrZWVwY2hhbm5lbFtpXSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGludCB0cmFja251bSA9IDA7IHRyYWNrbnVtIDwgdHJhY2tzLkNvdW50OyB0cmFja251bSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIE1pZGlUcmFjayB0cmFjayA9IHRyYWNrc1t0cmFja251bV07XG4gICAgICAgICAgICAgICAgaW50IGNoYW5uZWwgPSB0cmFjay5Ob3Rlc1swXS5DaGFubmVsO1xuICAgICAgICAgICAgICAgIGluc3RydW1lbnRzW2NoYW5uZWxdID0gb3B0aW9ucy5pbnN0cnVtZW50c1t0cmFja251bV07XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubXV0ZVt0cmFja251bV0gPT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGtlZXBjaGFubmVsW2NoYW5uZWxdID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBMaXN0PE1pZGlFdmVudD5bXSBuZXdldmVudHMgPSBDbG9uZU1pZGlFdmVudHMoZXZlbnRzKTtcblxuICAgICAgICAgICAgLyogU2V0IHRoZSB0ZW1wbyBhdCB0aGUgYmVnaW5uaW5nIG9mIGVhY2ggdHJhY2sgKi9cbiAgICAgICAgICAgIGZvciAoaW50IHRyYWNrbnVtID0gMDsgdHJhY2tudW0gPCBuZXdldmVudHMuTGVuZ3RoOyB0cmFja251bSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIE1pZGlFdmVudCBtZXZlbnQgPSBDcmVhdGVUZW1wb0V2ZW50KG9wdGlvbnMudGVtcG8pO1xuICAgICAgICAgICAgICAgIG5ld2V2ZW50c1t0cmFja251bV0uSW5zZXJ0KDAsIG1ldmVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIENoYW5nZSB0aGUgbm90ZSBudW1iZXIgKHRyYW5zcG9zZSksIGluc3RydW1lbnQsIGFuZCB0ZW1wbyAqL1xuICAgICAgICAgICAgZm9yIChpbnQgdHJhY2tudW0gPSAwOyB0cmFja251bSA8IG5ld2V2ZW50cy5MZW5ndGg7IHRyYWNrbnVtKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZm9yZWFjaCAoTWlkaUV2ZW50IG1ldmVudCBpbiBuZXdldmVudHNbdHJhY2tudW1dKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaW50IG51bSA9IG1ldmVudC5Ob3RlbnVtYmVyICsgb3B0aW9ucy50cmFuc3Bvc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChudW0gPCAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgbnVtID0gMDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG51bSA+IDEyNylcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bSA9IDEyNztcbiAgICAgICAgICAgICAgICAgICAgbWV2ZW50Lk5vdGVudW1iZXIgPSAoYnl0ZSludW07XG4gICAgICAgICAgICAgICAgICAgIGlmICgha2VlcGNoYW5uZWxbbWV2ZW50LkNoYW5uZWxdKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXZlbnQuVmVsb2NpdHkgPSAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy51c2VEZWZhdWx0SW5zdHJ1bWVudHMpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldmVudC5JbnN0cnVtZW50ID0gKGJ5dGUpaW5zdHJ1bWVudHNbbWV2ZW50LkNoYW5uZWxdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1ldmVudC5UZW1wbyA9IG9wdGlvbnMudGVtcG87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMucGF1c2VUaW1lICE9IDApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmV3ZXZlbnRzID0gU3RhcnRBdFBhdXNlVGltZShuZXdldmVudHMsIG9wdGlvbnMucGF1c2VUaW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdldmVudHM7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8qKiBBcHBseSB0aGUgZ2l2ZW4gc2hlZXQgbXVzaWMgb3B0aW9ucyB0byB0aGUgTWlkaU5vdGVzLlxuICAgICAgICAgKiAgUmV0dXJuIHRoZSBtaWRpIHRyYWNrcyB3aXRoIHRoZSBjaGFuZ2VzIGFwcGxpZWQuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgTGlzdDxNaWRpVHJhY2s+IENoYW5nZU1pZGlOb3RlcyhNaWRpT3B0aW9ucyBvcHRpb25zKVxuICAgICAgICB7XG4gICAgICAgICAgICBMaXN0PE1pZGlUcmFjaz4gbmV3dHJhY2tzID0gbmV3IExpc3Q8TWlkaVRyYWNrPigpO1xuXG4gICAgICAgICAgICBmb3IgKGludCB0cmFjayA9IDA7IHRyYWNrIDwgdHJhY2tzLkNvdW50OyB0cmFjaysrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnRyYWNrc1t0cmFja10pXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuZXd0cmFja3MuQWRkKHRyYWNrc1t0cmFja10uQ2xvbmUoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBUbyBtYWtlIHRoZSBzaGVldCBtdXNpYyBsb29rIG5pY2VyLCB3ZSByb3VuZCB0aGUgc3RhcnQgdGltZXNcbiAgICAgICAgICAgICAqIHNvIHRoYXQgbm90ZXMgY2xvc2UgdG9nZXRoZXIgYXBwZWFyIGFzIGEgc2luZ2xlIGNob3JkLiAgV2VcbiAgICAgICAgICAgICAqIGFsc28gZXh0ZW5kIHRoZSBub3RlIGR1cmF0aW9ucywgc28gdGhhdCB3ZSBoYXZlIGxvbmdlciBub3Rlc1xuICAgICAgICAgICAgICogYW5kIGZld2VyIHJlc3Qgc3ltYm9scy5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgVGltZVNpZ25hdHVyZSB0aW1lID0gdGltZXNpZztcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnRpbWUgIT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aW1lID0gb3B0aW9ucy50aW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgTWlkaUZpbGUuUm91bmRTdGFydFRpbWVzKG5ld3RyYWNrcywgb3B0aW9ucy5jb21iaW5lSW50ZXJ2YWwsIHRpbWVzaWcpO1xuICAgICAgICAgICAgTWlkaUZpbGUuUm91bmREdXJhdGlvbnMobmV3dHJhY2tzLCB0aW1lLlF1YXJ0ZXIpO1xuXG4gICAgICAgICAgICBpZiAob3B0aW9ucy50d29TdGFmZnMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmV3dHJhY2tzID0gTWlkaUZpbGUuQ29tYmluZVRvVHdvVHJhY2tzKG5ld3RyYWNrcywgdGltZXNpZy5NZWFzdXJlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNoaWZ0dGltZSAhPSAwKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIE1pZGlGaWxlLlNoaWZ0VGltZShuZXd0cmFja3MsIG9wdGlvbnMuc2hpZnR0aW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnRyYW5zcG9zZSAhPSAwKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIE1pZGlGaWxlLlRyYW5zcG9zZShuZXd0cmFja3MsIG9wdGlvbnMudHJhbnNwb3NlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG5ld3RyYWNrcztcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqIFNoaWZ0IHRoZSBzdGFydHRpbWUgb2YgdGhlIG5vdGVzIGJ5IHRoZSBnaXZlbiBhbW91bnQuXG4gICAgICAgICAqIFRoaXMgaXMgdXNlZCBieSB0aGUgU2hpZnQgTm90ZXMgbWVudSB0byBzaGlmdCBub3RlcyBsZWZ0L3JpZ2h0LlxuICAgICAgICAgKi9cbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkXG4gICAgICAgIFNoaWZ0VGltZShMaXN0PE1pZGlUcmFjaz4gdHJhY2tzLCBpbnQgYW1vdW50KVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3JlYWNoIChNaWRpVHJhY2sgdHJhY2sgaW4gdHJhY2tzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlOb3RlIG5vdGUgaW4gdHJhY2suTm90ZXMpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBub3RlLlN0YXJ0VGltZSArPSBhbW91bnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqIFNoaWZ0IHRoZSBub3RlIGtleXMgdXAvZG93biBieSB0aGUgZ2l2ZW4gYW1vdW50ICovXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZFxuICAgICAgICBUcmFuc3Bvc2UoTGlzdDxNaWRpVHJhY2s+IHRyYWNrcywgaW50IGFtb3VudClcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaVRyYWNrIHRyYWNrIGluIHRyYWNrcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmb3JlYWNoIChNaWRpTm90ZSBub3RlIGluIHRyYWNrLk5vdGVzKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbm90ZS5OdW1iZXIgKz0gYW1vdW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAobm90ZS5OdW1iZXIgPCAwKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub3RlLk51bWJlciA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8qIEZpbmQgdGhlIGhpZ2hlc3QgYW5kIGxvd2VzdCBub3RlcyB0aGF0IG92ZXJsYXAgdGhpcyBpbnRlcnZhbCAoc3RhcnR0aW1lIHRvIGVuZHRpbWUpLlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBpcyB1c2VkIGJ5IFNwbGl0VHJhY2sgdG8gZGV0ZXJtaW5lIHdoaWNoIHN0YWZmICh0b3Agb3IgYm90dG9tKSBhIG5vdGVcbiAgICAgICAgICogc2hvdWxkIGdvIHRvLlxuICAgICAgICAgKlxuICAgICAgICAgKiBGb3IgbW9yZSBhY2N1cmF0ZSBTcGxpdFRyYWNrKCkgcmVzdWx0cywgd2UgbGltaXQgdGhlIGludGVydmFsL2R1cmF0aW9uIG9mIHRoaXMgbm90ZSBcbiAgICAgICAgICogKGFuZCBvdGhlciBub3RlcykgdG8gb25lIG1lYXN1cmUuIFdlIGNhcmUgb25seSBhYm91dCBoaWdoL2xvdyBub3RlcyB0aGF0IGFyZVxuICAgICAgICAgKiByZWFzb25hYmx5IGNsb3NlIHRvIHRoaXMgbm90ZS5cbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGUgc3RhdGljIHZvaWRcbiAgICAgICAgRmluZEhpZ2hMb3dOb3RlcyhMaXN0PE1pZGlOb3RlPiBub3RlcywgaW50IG1lYXN1cmVsZW4sIGludCBzdGFydGluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgIGludCBzdGFydHRpbWUsIGludCBlbmR0aW1lLCByZWYgaW50IGhpZ2gsIHJlZiBpbnQgbG93KVxuICAgICAgICB7XG5cbiAgICAgICAgICAgIGludCBpID0gc3RhcnRpbmRleDtcbiAgICAgICAgICAgIGlmIChzdGFydHRpbWUgKyBtZWFzdXJlbGVuIDwgZW5kdGltZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlbmR0aW1lID0gc3RhcnR0aW1lICsgbWVhc3VyZWxlbjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2hpbGUgKGkgPCBub3Rlcy5Db3VudCAmJiBub3Rlc1tpXS5TdGFydFRpbWUgPCBlbmR0aW1lKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmIChub3Rlc1tpXS5FbmRUaW1lIDwgc3RhcnR0aW1lKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdGVzW2ldLlN0YXJ0VGltZSArIG1lYXN1cmVsZW4gPCBzdGFydHRpbWUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaGlnaCA8IG5vdGVzW2ldLk51bWJlcilcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGhpZ2ggPSBub3Rlc1tpXS5OdW1iZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsb3cgPiBub3Rlc1tpXS5OdW1iZXIpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsb3cgPSBub3Rlc1tpXS5OdW1iZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qIEZpbmQgdGhlIGhpZ2hlc3QgYW5kIGxvd2VzdCBub3RlcyB0aGF0IHN0YXJ0IGF0IHRoaXMgZXhhY3Qgc3RhcnQgdGltZSAqL1xuICAgICAgICBwcml2YXRlIHN0YXRpYyB2b2lkXG4gICAgICAgIEZpbmRFeGFjdEhpZ2hMb3dOb3RlcyhMaXN0PE1pZGlOb3RlPiBub3RlcywgaW50IHN0YXJ0aW5kZXgsIGludCBzdGFydHRpbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWYgaW50IGhpZ2gsIHJlZiBpbnQgbG93KVxuICAgICAgICB7XG5cbiAgICAgICAgICAgIGludCBpID0gc3RhcnRpbmRleDtcblxuICAgICAgICAgICAgd2hpbGUgKG5vdGVzW2ldLlN0YXJ0VGltZSA8IHN0YXJ0dGltZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdoaWxlIChpIDwgbm90ZXMuQ291bnQgJiYgbm90ZXNbaV0uU3RhcnRUaW1lID09IHN0YXJ0dGltZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoaGlnaCA8IG5vdGVzW2ldLk51bWJlcilcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGhpZ2ggPSBub3Rlc1tpXS5OdW1iZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsb3cgPiBub3Rlc1tpXS5OdW1iZXIpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsb3cgPSBub3Rlc1tpXS5OdW1iZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cblxuICAgICAgICAvKiBTcGxpdCB0aGUgZ2l2ZW4gTWlkaVRyYWNrIGludG8gdHdvIHRyYWNrcywgdG9wIGFuZCBib3R0b20uXG4gICAgICAgICAqIFRoZSBoaWdoZXN0IG5vdGVzIHdpbGwgZ28gaW50byB0b3AsIHRoZSBsb3dlc3QgaW50byBib3R0b20uXG4gICAgICAgICAqIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byBzcGxpdCBwaWFubyBzb25ncyBpbnRvIGxlZnQtaGFuZCAoYm90dG9tKVxuICAgICAgICAgKiBhbmQgcmlnaHQtaGFuZCAodG9wKSB0cmFja3MuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgc3RhdGljIExpc3Q8TWlkaVRyYWNrPiBTcGxpdFRyYWNrKE1pZGlUcmFjayB0cmFjaywgaW50IG1lYXN1cmVsZW4pXG4gICAgICAgIHtcbiAgICAgICAgICAgIExpc3Q8TWlkaU5vdGU+IG5vdGVzID0gdHJhY2suTm90ZXM7XG4gICAgICAgICAgICBpbnQgY291bnQgPSBub3Rlcy5Db3VudDtcblxuICAgICAgICAgICAgTWlkaVRyYWNrIHRvcCA9IG5ldyBNaWRpVHJhY2soMSk7XG4gICAgICAgICAgICBNaWRpVHJhY2sgYm90dG9tID0gbmV3IE1pZGlUcmFjaygyKTtcbiAgICAgICAgICAgIExpc3Q8TWlkaVRyYWNrPiByZXN1bHQgPSBuZXcgTGlzdDxNaWRpVHJhY2s+KDIpO1xuICAgICAgICAgICAgcmVzdWx0LkFkZCh0b3ApOyByZXN1bHQuQWRkKGJvdHRvbSk7XG5cbiAgICAgICAgICAgIGlmIChjb3VudCA9PSAwKVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICAgICAgICAgIGludCBwcmV2aGlnaCA9IDc2OyAvKiBFNSwgdG9wIG9mIHRyZWJsZSBzdGFmZiAqL1xuICAgICAgICAgICAgaW50IHByZXZsb3cgPSA0NTsgLyogQTMsIGJvdHRvbSBvZiBiYXNzIHN0YWZmICovXG4gICAgICAgICAgICBpbnQgc3RhcnRpbmRleCA9IDA7XG5cbiAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlOb3RlIG5vdGUgaW4gbm90ZXMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaW50IGhpZ2gsIGxvdywgaGlnaEV4YWN0LCBsb3dFeGFjdDtcblxuICAgICAgICAgICAgICAgIGludCBudW1iZXIgPSBub3RlLk51bWJlcjtcbiAgICAgICAgICAgICAgICBoaWdoID0gbG93ID0gaGlnaEV4YWN0ID0gbG93RXhhY3QgPSBudW1iZXI7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAobm90ZXNbc3RhcnRpbmRleF0uRW5kVGltZSA8IG5vdGUuU3RhcnRUaW1lKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRpbmRleCsrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIEkndmUgdHJpZWQgc2V2ZXJhbCBhbGdvcml0aG1zIGZvciBzcGxpdHRpbmcgYSB0cmFjayBpbiB0d28sXG4gICAgICAgICAgICAgICAgICogYW5kIHRoZSBvbmUgYmVsb3cgc2VlbXMgdG8gd29yayB0aGUgYmVzdDpcbiAgICAgICAgICAgICAgICAgKiAtIElmIHRoaXMgbm90ZSBpcyBtb3JlIHRoYW4gYW4gb2N0YXZlIGZyb20gdGhlIGhpZ2gvbG93IG5vdGVzXG4gICAgICAgICAgICAgICAgICogICAodGhhdCBzdGFydCBleGFjdGx5IGF0IHRoaXMgc3RhcnQgdGltZSksIGNob29zZSB0aGUgY2xvc2VzdCBvbmUuXG4gICAgICAgICAgICAgICAgICogLSBJZiB0aGlzIG5vdGUgaXMgbW9yZSB0aGFuIGFuIG9jdGF2ZSBmcm9tIHRoZSBoaWdoL2xvdyBub3Rlc1xuICAgICAgICAgICAgICAgICAqICAgKGluIHRoaXMgbm90ZSdzIHRpbWUgZHVyYXRpb24pLCBjaG9vc2UgdGhlIGNsb3Nlc3Qgb25lLlxuICAgICAgICAgICAgICAgICAqIC0gSWYgdGhlIGhpZ2ggYW5kIGxvdyBub3RlcyAodGhhdCBzdGFydCBleGFjdGx5IGF0IHRoaXMgc3RhcnR0aW1lKVxuICAgICAgICAgICAgICAgICAqICAgYXJlIG1vcmUgdGhhbiBhbiBvY3RhdmUgYXBhcnQsIGNob29zZSB0aGUgY2xvc2VzdCBub3RlLlxuICAgICAgICAgICAgICAgICAqIC0gSWYgdGhlIGhpZ2ggYW5kIGxvdyBub3RlcyAodGhhdCBvdmVybGFwIHRoaXMgc3RhcnR0aW1lKVxuICAgICAgICAgICAgICAgICAqICAgYXJlIG1vcmUgdGhhbiBhbiBvY3RhdmUgYXBhcnQsIGNob29zZSB0aGUgY2xvc2VzdCBub3RlLlxuICAgICAgICAgICAgICAgICAqIC0gRWxzZSwgbG9vayBhdCB0aGUgcHJldmlvdXMgaGlnaC9sb3cgbm90ZXMgdGhhdCB3ZXJlIG1vcmUgdGhhbiBhbiBcbiAgICAgICAgICAgICAgICAgKiAgIG9jdGF2ZSBhcGFydC4gIENob29zZSB0aGUgY2xvc2VzZXQgbm90ZS5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBGaW5kSGlnaExvd05vdGVzKG5vdGVzLCBtZWFzdXJlbGVuLCBzdGFydGluZGV4LCBub3RlLlN0YXJ0VGltZSwgbm90ZS5FbmRUaW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmIGhpZ2gsIHJlZiBsb3cpO1xuICAgICAgICAgICAgICAgIEZpbmRFeGFjdEhpZ2hMb3dOb3Rlcyhub3Rlcywgc3RhcnRpbmRleCwgbm90ZS5TdGFydFRpbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZiBoaWdoRXhhY3QsIHJlZiBsb3dFeGFjdCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaGlnaEV4YWN0IC0gbnVtYmVyID4gMTIgfHwgbnVtYmVyIC0gbG93RXhhY3QgPiAxMilcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoaWdoRXhhY3QgLSBudW1iZXIgPD0gbnVtYmVyIC0gbG93RXhhY3QpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcC5BZGROb3RlKG5vdGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgYm90dG9tLkFkZE5vdGUobm90ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaGlnaCAtIG51bWJlciA+IDEyIHx8IG51bWJlciAtIGxvdyA+IDEyKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhpZ2ggLSBudW1iZXIgPD0gbnVtYmVyIC0gbG93KVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3AuQWRkTm90ZShub3RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbS5BZGROb3RlKG5vdGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGhpZ2hFeGFjdCAtIGxvd0V4YWN0ID4gMTIpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaGlnaEV4YWN0IC0gbnVtYmVyIDw9IG51bWJlciAtIGxvd0V4YWN0KVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3AuQWRkTm90ZShub3RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbS5BZGROb3RlKG5vdGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGhpZ2ggLSBsb3cgPiAxMilcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoaWdoIC0gbnVtYmVyIDw9IG51bWJlciAtIGxvdylcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9wLkFkZE5vdGUobm90ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBib3R0b20uQWRkTm90ZShub3RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJldmhpZ2ggLSBudW1iZXIgPD0gbnVtYmVyIC0gcHJldmxvdylcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9wLkFkZE5vdGUobm90ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBib3R0b20uQWRkTm90ZShub3RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIFRoZSBwcmV2aGlnaC9wcmV2bG93IGFyZSBzZXQgdG8gdGhlIGxhc3QgaGlnaC9sb3dcbiAgICAgICAgICAgICAgICAgKiB0aGF0IGFyZSBtb3JlIHRoYW4gYW4gb2N0YXZlIGFwYXJ0LlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGlmIChoaWdoIC0gbG93ID4gMTIpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBwcmV2aGlnaCA9IGhpZ2g7XG4gICAgICAgICAgICAgICAgICAgIHByZXZsb3cgPSBsb3c7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0b3AuTm90ZXMuU29ydCh0cmFjay5Ob3Rlc1swXSk7XG4gICAgICAgICAgICBib3R0b20uTm90ZXMuU29ydCh0cmFjay5Ob3Rlc1swXSk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8qKiBDb21iaW5lIHRoZSBub3RlcyBpbiB0aGUgZ2l2ZW4gdHJhY2tzIGludG8gYSBzaW5nbGUgTWlkaVRyYWNrLiBcbiAgICAgICAgICogIFRoZSBpbmRpdmlkdWFsIHRyYWNrcyBhcmUgYWxyZWFkeSBzb3J0ZWQuICBUbyBtZXJnZSB0aGVtLCB3ZVxuICAgICAgICAgKiAgdXNlIGEgbWVyZ2Vzb3J0LWxpa2UgYWxnb3JpdGhtLlxuICAgICAgICAgKi9cbiAgICAgICAgcHVibGljIHN0YXRpYyBNaWRpVHJhY2sgQ29tYmluZVRvU2luZ2xlVHJhY2soTGlzdDxNaWRpVHJhY2s+IHRyYWNrcylcbiAgICAgICAge1xuICAgICAgICAgICAgLyogQWRkIGFsbCBub3RlcyBpbnRvIG9uZSB0cmFjayAqL1xuICAgICAgICAgICAgTWlkaVRyYWNrIHJlc3VsdCA9IG5ldyBNaWRpVHJhY2soMSk7XG5cbiAgICAgICAgICAgIGlmICh0cmFja3MuQ291bnQgPT0gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHJhY2tzLkNvdW50ID09IDEpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgTWlkaVRyYWNrIHRyYWNrID0gdHJhY2tzWzBdO1xuICAgICAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlOb3RlIG5vdGUgaW4gdHJhY2suTm90ZXMpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuQWRkTm90ZShub3RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW50W10gbm90ZWluZGV4ID0gbmV3IGludFs2NF07XG4gICAgICAgICAgICBpbnRbXSBub3RlY291bnQgPSBuZXcgaW50WzY0XTtcblxuICAgICAgICAgICAgZm9yIChpbnQgdHJhY2tudW0gPSAwOyB0cmFja251bSA8IHRyYWNrcy5Db3VudDsgdHJhY2tudW0rKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBub3RlaW5kZXhbdHJhY2tudW1dID0gMDtcbiAgICAgICAgICAgICAgICBub3RlY291bnRbdHJhY2tudW1dID0gdHJhY2tzW3RyYWNrbnVtXS5Ob3Rlcy5Db3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIE1pZGlOb3RlIHByZXZub3RlID0gbnVsbDtcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIE1pZGlOb3RlIGxvd2VzdG5vdGUgPSBudWxsO1xuICAgICAgICAgICAgICAgIGludCBsb3dlc3RUcmFjayA9IC0xO1xuICAgICAgICAgICAgICAgIGZvciAoaW50IHRyYWNrbnVtID0gMDsgdHJhY2tudW0gPCB0cmFja3MuQ291bnQ7IHRyYWNrbnVtKyspXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBNaWRpVHJhY2sgdHJhY2sgPSB0cmFja3NbdHJhY2tudW1dO1xuICAgICAgICAgICAgICAgICAgICBpZiAobm90ZWluZGV4W3RyYWNrbnVtXSA+PSBub3RlY291bnRbdHJhY2tudW1dKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBNaWRpTm90ZSBub3RlID0gdHJhY2suTm90ZXNbbm90ZWluZGV4W3RyYWNrbnVtXV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb3dlc3Rub3RlID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VzdG5vdGUgPSBub3RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXN0VHJhY2sgPSB0cmFja251bTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChub3RlLlN0YXJ0VGltZSA8IGxvd2VzdG5vdGUuU3RhcnRUaW1lKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb3dlc3Rub3RlID0gbm90ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VzdFRyYWNrID0gdHJhY2tudW07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobm90ZS5TdGFydFRpbWUgPT0gbG93ZXN0bm90ZS5TdGFydFRpbWUgJiYgbm90ZS5OdW1iZXIgPCBsb3dlc3Rub3RlLk51bWJlcilcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXN0bm90ZSA9IG5vdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb3dlc3RUcmFjayA9IHRyYWNrbnVtO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsb3dlc3Rub3RlID09IG51bGwpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAvKiBXZSd2ZSBmaW5pc2hlZCB0aGUgbWVyZ2UgKi9cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5vdGVpbmRleFtsb3dlc3RUcmFja10rKztcbiAgICAgICAgICAgICAgICBpZiAoKHByZXZub3RlICE9IG51bGwpICYmIChwcmV2bm90ZS5TdGFydFRpbWUgPT0gbG93ZXN0bm90ZS5TdGFydFRpbWUpICYmXG4gICAgICAgICAgICAgICAgICAgIChwcmV2bm90ZS5OdW1iZXIgPT0gbG93ZXN0bm90ZS5OdW1iZXIpKVxuICAgICAgICAgICAgICAgIHtcblxuICAgICAgICAgICAgICAgICAgICAvKiBEb24ndCBhZGQgZHVwbGljYXRlIG5vdGVzLCB3aXRoIHRoZSBzYW1lIHN0YXJ0IHRpbWUgYW5kIG51bWJlciAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAobG93ZXN0bm90ZS5EdXJhdGlvbiA+IHByZXZub3RlLkR1cmF0aW9uKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2bm90ZS5EdXJhdGlvbiA9IGxvd2VzdG5vdGUuRHVyYXRpb247XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LkFkZE5vdGUobG93ZXN0bm90ZSk7XG4gICAgICAgICAgICAgICAgICAgIHByZXZub3RlID0gbG93ZXN0bm90ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8qKiBDb21iaW5lIHRoZSBub3RlcyBpbiBhbGwgdGhlIHRyYWNrcyBnaXZlbiBpbnRvIHR3byBNaWRpVHJhY2tzLFxuICAgICAgICAgKiBhbmQgcmV0dXJuIHRoZW0uXG4gICAgICAgICAqIFxuICAgICAgICAgKiBUaGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIGZvciBwaWFubyBzb25ncywgd2hlbiB3ZSB3YW50IHRvIGRpc3BsYXlcbiAgICAgICAgICogYSBsZWZ0LWhhbmQgdHJhY2sgYW5kIGEgcmlnaHQtaGFuZCB0cmFjay4gIFRoZSBsb3dlciBub3RlcyBnbyBpbnRvIFxuICAgICAgICAgKiB0aGUgbGVmdC1oYW5kIHRyYWNrLCBhbmQgdGhlIGhpZ2hlciBub3RlcyBnbyBpbnRvIHRoZSByaWdodCBoYW5kIFxuICAgICAgICAgKiB0cmFjay5cbiAgICAgICAgICovXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgTGlzdDxNaWRpVHJhY2s+IENvbWJpbmVUb1R3b1RyYWNrcyhMaXN0PE1pZGlUcmFjaz4gdHJhY2tzLCBpbnQgbWVhc3VyZWxlbilcbiAgICAgICAge1xuICAgICAgICAgICAgTWlkaVRyYWNrIHNpbmdsZSA9IENvbWJpbmVUb1NpbmdsZVRyYWNrKHRyYWNrcyk7XG4gICAgICAgICAgICBMaXN0PE1pZGlUcmFjaz4gcmVzdWx0ID0gU3BsaXRUcmFjayhzaW5nbGUsIG1lYXN1cmVsZW4pO1xuXG4gICAgICAgICAgICBMaXN0PE1pZGlFdmVudD4gbHlyaWNzID0gbmV3IExpc3Q8TWlkaUV2ZW50PigpO1xuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaVRyYWNrIHRyYWNrIGluIHRyYWNrcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAodHJhY2suTHlyaWNzICE9IG51bGwpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBseXJpY3MuQWRkUmFuZ2UodHJhY2suTHlyaWNzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobHlyaWNzLkNvdW50ID4gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBseXJpY3MuU29ydChseXJpY3NbMF0pO1xuICAgICAgICAgICAgICAgIHJlc3VsdFswXS5MeXJpY3MgPSBseXJpY3M7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8qKiBDaGVjayB0aGF0IHRoZSBNaWRpTm90ZSBzdGFydCB0aW1lcyBhcmUgaW4gaW5jcmVhc2luZyBvcmRlci5cbiAgICAgICAgICogVGhpcyBpcyBmb3IgZGVidWdnaW5nIHB1cnBvc2VzLlxuICAgICAgICAgKi9cbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgdm9pZCBDaGVja1N0YXJ0VGltZXMoTGlzdDxNaWRpVHJhY2s+IHRyYWNrcylcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaVRyYWNrIHRyYWNrIGluIHRyYWNrcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpbnQgcHJldnRpbWUgPSAtMTtcbiAgICAgICAgICAgICAgICBmb3JlYWNoIChNaWRpTm90ZSBub3RlIGluIHRyYWNrLk5vdGVzKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdGUuU3RhcnRUaW1lIDwgcHJldnRpbWUpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeXN0ZW0uQXJndW1lbnRFeGNlcHRpb24oXCJzdGFydCB0aW1lcyBub3QgaW4gaW5jcmVhc2luZyBvcmRlclwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwcmV2dGltZSA9IG5vdGUuU3RhcnRUaW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqIEluIE1pZGkgRmlsZXMsIHRpbWUgaXMgbWVhc3VyZWQgaW4gcHVsc2VzLiAgTm90ZXMgdGhhdCBoYXZlXG4gICAgICAgICAqIHB1bHNlIHRpbWVzIHRoYXQgYXJlIGNsb3NlIHRvZ2V0aGVyIChsaWtlIHdpdGhpbiAxMCBwdWxzZXMpXG4gICAgICAgICAqIHdpbGwgc291bmQgbGlrZSB0aGV5J3JlIHRoZSBzYW1lIGNob3JkLiAgV2Ugd2FudCB0byBkcmF3XG4gICAgICAgICAqIHRoZXNlIG5vdGVzIGFzIGEgc2luZ2xlIGNob3JkLCBpdCBtYWtlcyB0aGUgc2hlZXQgbXVzaWMgbXVjaFxuICAgICAgICAgKiBlYXNpZXIgdG8gcmVhZC4gIFdlIGRvbid0IHdhbnQgdG8gZHJhdyBub3RlcyB0aGF0IGFyZSBjbG9zZVxuICAgICAgICAgKiB0b2dldGhlciBhcyB0d28gc2VwYXJhdGUgY2hvcmRzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgU3ltYm9sU3BhY2luZyBjbGFzcyBvbmx5IGFsaWducyBub3RlcyB0aGF0IGhhdmUgZXhhY3RseSB0aGUgc2FtZVxuICAgICAgICAgKiBzdGFydCB0aW1lcy4gIE5vdGVzIHdpdGggc2xpZ2h0bHkgZGlmZmVyZW50IHN0YXJ0IHRpbWVzIHdpbGxcbiAgICAgICAgICogYXBwZWFyIGluIHNlcGFyYXRlIHZlcnRpY2FsIGNvbHVtbnMuICBUaGlzIGlzbid0IHdoYXQgd2Ugd2FudC5cbiAgICAgICAgICogV2Ugd2FudCB0byBhbGlnbiBub3RlcyB3aXRoIGFwcHJveGltYXRlbHkgdGhlIHNhbWUgc3RhcnQgdGltZXMuXG4gICAgICAgICAqIFNvLCB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gYXNzaWduIHRoZSBzYW1lIHN0YXJ0dGltZSBmb3Igbm90ZXNcbiAgICAgICAgICogdGhhdCBhcmUgY2xvc2UgdG9nZXRoZXIgKHRpbWV3aXNlKS5cbiAgICAgICAgICovXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZFxuICAgICAgICBSb3VuZFN0YXJ0VGltZXMoTGlzdDxNaWRpVHJhY2s+IHRyYWNrcywgaW50IG1pbGxpc2VjLCBUaW1lU2lnbmF0dXJlIHRpbWUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIC8qIEdldCBhbGwgdGhlIHN0YXJ0dGltZXMgaW4gYWxsIHRyYWNrcywgaW4gc29ydGVkIG9yZGVyICovXG4gICAgICAgICAgICBMaXN0PGludD4gc3RhcnR0aW1lcyA9IG5ldyBMaXN0PGludD4oKTtcbiAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlUcmFjayB0cmFjayBpbiB0cmFja3MpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZm9yZWFjaCAoTWlkaU5vdGUgbm90ZSBpbiB0cmFjay5Ob3RlcylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0dGltZXMuQWRkKG5vdGUuU3RhcnRUaW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGFydHRpbWVzLlNvcnQoKTtcblxuICAgICAgICAgICAgLyogTm90ZXMgd2l0aGluIFwibWlsbGlzZWNcIiBtaWxsaXNlY29uZHMgYXBhcnQgd2lsbCBiZSBjb21iaW5lZC4gKi9cbiAgICAgICAgICAgIGludCBpbnRlcnZhbCA9IHRpbWUuUXVhcnRlciAqIG1pbGxpc2VjICogMTAwMCAvIHRpbWUuVGVtcG87XG5cbiAgICAgICAgICAgIC8qIElmIHR3byBzdGFydHRpbWVzIGFyZSB3aXRoaW4gaW50ZXJ2YWwgbWlsbGlzZWMsIG1ha2UgdGhlbSB0aGUgc2FtZSAqL1xuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCBzdGFydHRpbWVzLkNvdW50IC0gMTsgaSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmIChzdGFydHRpbWVzW2kgKyAxXSAtIHN0YXJ0dGltZXNbaV0gPD0gaW50ZXJ2YWwpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBzdGFydHRpbWVzW2kgKyAxXSA9IHN0YXJ0dGltZXNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBDaGVja1N0YXJ0VGltZXModHJhY2tzKTtcblxuICAgICAgICAgICAgLyogQWRqdXN0IHRoZSBub3RlIHN0YXJ0dGltZXMsIHNvIHRoYXQgaXQgbWF0Y2hlcyBvbmUgb2YgdGhlIHN0YXJ0dGltZXMgdmFsdWVzICovXG4gICAgICAgICAgICBmb3JlYWNoIChNaWRpVHJhY2sgdHJhY2sgaW4gdHJhY2tzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGludCBpID0gMDtcblxuICAgICAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlOb3RlIG5vdGUgaW4gdHJhY2suTm90ZXMpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IHN0YXJ0dGltZXMuQ291bnQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGUuU3RhcnRUaW1lIC0gaW50ZXJ2YWwgPiBzdGFydHRpbWVzW2ldKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAobm90ZS5TdGFydFRpbWUgPiBzdGFydHRpbWVzW2ldICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBub3RlLlN0YXJ0VGltZSAtIHN0YXJ0dGltZXNbaV0gPD0gaW50ZXJ2YWwpXG4gICAgICAgICAgICAgICAgICAgIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbm90ZS5TdGFydFRpbWUgPSBzdGFydHRpbWVzW2ldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRyYWNrLk5vdGVzLlNvcnQodHJhY2suTm90ZXNbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvKiogV2Ugd2FudCBub3RlIGR1cmF0aW9ucyB0byBzcGFuIHVwIHRvIHRoZSBuZXh0IG5vdGUgaW4gZ2VuZXJhbC5cbiAgICAgICAgICogVGhlIHNoZWV0IG11c2ljIGxvb2tzIG5pY2VyIHRoYXQgd2F5LiAgSW4gY29udHJhc3QsIHNoZWV0IG11c2ljXG4gICAgICAgICAqIHdpdGggbG90cyBvZiAxNnRoLzMybmQgbm90ZXMgc2VwYXJhdGVkIGJ5IHNtYWxsIHJlc3RzIGRvZXNuJ3RcbiAgICAgICAgICogbG9vayBhcyBuaWNlLiAgSGF2aW5nIG5pY2UgbG9va2luZyBzaGVldCBtdXNpYyBpcyBtb3JlIGltcG9ydGFudFxuICAgICAgICAgKiB0aGFuIGZhaXRoZnVsbHkgcmVwcmVzZW50aW5nIHRoZSBNaWRpIEZpbGUgZGF0YS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlcmVmb3JlLCB0aGlzIGZ1bmN0aW9uIHJvdW5kcyB0aGUgZHVyYXRpb24gb2YgTWlkaU5vdGVzIHVwIHRvXG4gICAgICAgICAqIHRoZSBuZXh0IG5vdGUgd2hlcmUgcG9zc2libGUuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWRcbiAgICAgICAgUm91bmREdXJhdGlvbnMoTGlzdDxNaWRpVHJhY2s+IHRyYWNrcywgaW50IHF1YXJ0ZXJub3RlKVxuICAgICAgICB7XG5cbiAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlUcmFjayB0cmFjayBpbiB0cmFja3MpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgTWlkaU5vdGUgcHJldk5vdGUgPSBudWxsO1xuICAgICAgICAgICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgdHJhY2suTm90ZXMuQ291bnQgLSAxOyBpKyspXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBNaWRpTm90ZSBub3RlMSA9IHRyYWNrLk5vdGVzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJldk5vdGUgPT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldk5vdGUgPSBub3RlMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qIEdldCB0aGUgbmV4dCBub3RlIHRoYXQgaGFzIGEgZGlmZmVyZW50IHN0YXJ0IHRpbWUgKi9cbiAgICAgICAgICAgICAgICAgICAgTWlkaU5vdGUgbm90ZTIgPSBub3RlMTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpbnQgaiA9IGkgKyAxOyBqIDwgdHJhY2suTm90ZXMuQ291bnQ7IGorKylcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm90ZTIgPSB0cmFjay5Ob3Rlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub3RlMS5TdGFydFRpbWUgPCBub3RlMi5TdGFydFRpbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaW50IG1heGR1cmF0aW9uID0gbm90ZTIuU3RhcnRUaW1lIC0gbm90ZTEuU3RhcnRUaW1lO1xuXG4gICAgICAgICAgICAgICAgICAgIGludCBkdXIgPSAwO1xuICAgICAgICAgICAgICAgICAgICBpZiAocXVhcnRlcm5vdGUgPD0gbWF4ZHVyYXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXIgPSBxdWFydGVybm90ZTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocXVhcnRlcm5vdGUgLyAyIDw9IG1heGR1cmF0aW9uKVxuICAgICAgICAgICAgICAgICAgICAgICAgZHVyID0gcXVhcnRlcm5vdGUgLyAyO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChxdWFydGVybm90ZSAvIDMgPD0gbWF4ZHVyYXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXIgPSBxdWFydGVybm90ZSAvIDM7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHF1YXJ0ZXJub3RlIC8gNCA8PSBtYXhkdXJhdGlvbilcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1ciA9IHF1YXJ0ZXJub3RlIC8gNDtcblxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChkdXIgPCBub3RlMS5EdXJhdGlvbilcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHVyID0gbm90ZTEuRHVyYXRpb247XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBTcGVjaWFsIGNhc2U6IElmIHRoZSBwcmV2aW91cyBub3RlJ3MgZHVyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICogbWF0Y2hlcyB0aGlzIG5vdGUncyBkdXJhdGlvbiwgd2UgY2FuIG1ha2UgYSBub3RlcGFpci5cbiAgICAgICAgICAgICAgICAgICAgICogU28gZG9uJ3QgZXhwYW5kIHRoZSBkdXJhdGlvbiBpbiB0aGF0IGNhc2UuXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoKHByZXZOb3RlLlN0YXJ0VGltZSArIHByZXZOb3RlLkR1cmF0aW9uID09IG5vdGUxLlN0YXJ0VGltZSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIChwcmV2Tm90ZS5EdXJhdGlvbiA9PSBub3RlMS5EdXJhdGlvbikpXG4gICAgICAgICAgICAgICAgICAgIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZHVyID0gbm90ZTEuRHVyYXRpb247XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbm90ZTEuRHVyYXRpb24gPSBkdXI7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmFjay5Ob3Rlc1tpICsgMV0uU3RhcnRUaW1lICE9IG5vdGUxLlN0YXJ0VGltZSlcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldk5vdGUgPSBub3RlMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBTcGxpdCB0aGUgZ2l2ZW4gdHJhY2sgaW50byBtdWx0aXBsZSB0cmFja3MsIHNlcGFyYXRpbmcgZWFjaFxuICAgICAgICAgKiBjaGFubmVsIGludG8gYSBzZXBhcmF0ZSB0cmFjay5cbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGUgc3RhdGljIExpc3Q8TWlkaVRyYWNrPlxuICAgICAgICBTcGxpdENoYW5uZWxzKE1pZGlUcmFjayBvcmlndHJhY2ssIExpc3Q8TWlkaUV2ZW50PiBldmVudHMpXG4gICAgICAgIHtcblxuICAgICAgICAgICAgLyogRmluZCB0aGUgaW5zdHJ1bWVudCB1c2VkIGZvciBlYWNoIGNoYW5uZWwgKi9cbiAgICAgICAgICAgIGludFtdIGNoYW5uZWxJbnN0cnVtZW50cyA9IG5ldyBpbnRbMTZdO1xuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaUV2ZW50IG1ldmVudCBpbiBldmVudHMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gRXZlbnRQcm9ncmFtQ2hhbmdlKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY2hhbm5lbEluc3RydW1lbnRzW21ldmVudC5DaGFubmVsXSA9IG1ldmVudC5JbnN0cnVtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNoYW5uZWxJbnN0cnVtZW50c1s5XSA9IDEyODsgLyogQ2hhbm5lbCA5ID0gUGVyY3Vzc2lvbiAqL1xuXG4gICAgICAgICAgICBMaXN0PE1pZGlUcmFjaz4gcmVzdWx0ID0gbmV3IExpc3Q8TWlkaVRyYWNrPigpO1xuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaU5vdGUgbm90ZSBpbiBvcmlndHJhY2suTm90ZXMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYm9vbCBmb3VuZGNoYW5uZWwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBmb3JlYWNoIChNaWRpVHJhY2sgdHJhY2sgaW4gcmVzdWx0KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdGUuQ2hhbm5lbCA9PSB0cmFjay5Ob3Rlc1swXS5DaGFubmVsKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZGNoYW5uZWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhY2suQWRkTm90ZShub3RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWZvdW5kY2hhbm5lbClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIE1pZGlUcmFjayB0cmFjayA9IG5ldyBNaWRpVHJhY2socmVzdWx0LkNvdW50ICsgMSk7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNrLkFkZE5vdGUobm90ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNrLkluc3RydW1lbnQgPSBjaGFubmVsSW5zdHJ1bWVudHNbbm90ZS5DaGFubmVsXTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LkFkZCh0cmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9yaWd0cmFjay5MeXJpY3MgIT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmb3JlYWNoIChNaWRpRXZlbnQgbHlyaWNFdmVudCBpbiBvcmlndHJhY2suTHlyaWNzKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yZWFjaCAoTWlkaVRyYWNrIHRyYWNrIGluIHJlc3VsdClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGx5cmljRXZlbnQuQ2hhbm5lbCA9PSB0cmFjay5Ob3Rlc1swXS5DaGFubmVsKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYWNrLkFkZEx5cmljKGx5cmljRXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqIEd1ZXNzIHRoZSBtZWFzdXJlIGxlbmd0aC4gIFdlIGFzc3VtZSB0aGF0IHRoZSBtZWFzdXJlXG4gICAgICAgICAqIGxlbmd0aCBtdXN0IGJlIGJldHdlZW4gMC41IHNlY29uZHMgYW5kIDQgc2Vjb25kcy5cbiAgICAgICAgICogVGFrZSBhbGwgdGhlIG5vdGUgc3RhcnQgdGltZXMgdGhhdCBmYWxsIGJldHdlZW4gMC41IGFuZCBcbiAgICAgICAgICogNCBzZWNvbmRzLCBhbmQgcmV0dXJuIHRoZSBzdGFydHRpbWVzLlxuICAgICAgICAgKi9cbiAgICAgICAgcHVibGljIExpc3Q8aW50PlxuICAgICAgICBHdWVzc01lYXN1cmVMZW5ndGgoKVxuICAgICAgICB7XG4gICAgICAgICAgICBMaXN0PGludD4gcmVzdWx0ID0gbmV3IExpc3Q8aW50PigpO1xuXG4gICAgICAgICAgICBpbnQgcHVsc2VzX3Blcl9zZWNvbmQgPSAoaW50KSgxMDAwMDAwLjAgLyB0aW1lc2lnLlRlbXBvICogdGltZXNpZy5RdWFydGVyKTtcbiAgICAgICAgICAgIGludCBtaW5tZWFzdXJlID0gcHVsc2VzX3Blcl9zZWNvbmQgLyAyOyAgLyogVGhlIG1pbmltdW0gbWVhc3VyZSBsZW5ndGggaW4gcHVsc2VzICovXG4gICAgICAgICAgICBpbnQgbWF4bWVhc3VyZSA9IHB1bHNlc19wZXJfc2Vjb25kICogNDsgIC8qIFRoZSBtYXhpbXVtIG1lYXN1cmUgbGVuZ3RoIGluIHB1bHNlcyAqL1xuXG4gICAgICAgICAgICAvKiBHZXQgdGhlIHN0YXJ0IHRpbWUgb2YgdGhlIGZpcnN0IG5vdGUgaW4gdGhlIG1pZGkgZmlsZS4gKi9cbiAgICAgICAgICAgIGludCBmaXJzdG5vdGUgPSB0aW1lc2lnLk1lYXN1cmUgKiA1O1xuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaVRyYWNrIHRyYWNrIGluIHRyYWNrcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3Rub3RlID4gdHJhY2suTm90ZXNbMF0uU3RhcnRUaW1lKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3Rub3RlID0gdHJhY2suTm90ZXNbMF0uU3RhcnRUaW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogaW50ZXJ2YWwgPSAwLjA2IHNlY29uZHMsIGNvbnZlcnRlZCBpbnRvIHB1bHNlcyAqL1xuICAgICAgICAgICAgaW50IGludGVydmFsID0gdGltZXNpZy5RdWFydGVyICogNjAwMDAgLyB0aW1lc2lnLlRlbXBvO1xuXG4gICAgICAgICAgICBmb3JlYWNoIChNaWRpVHJhY2sgdHJhY2sgaW4gdHJhY2tzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGludCBwcmV2dGltZSA9IDA7XG4gICAgICAgICAgICAgICAgZm9yZWFjaCAoTWlkaU5vdGUgbm90ZSBpbiB0cmFjay5Ob3RlcylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3RlLlN0YXJ0VGltZSAtIHByZXZ0aW1lIDw9IGludGVydmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICAgICAgcHJldnRpbWUgPSBub3RlLlN0YXJ0VGltZTtcblxuICAgICAgICAgICAgICAgICAgICBpbnQgdGltZV9mcm9tX2ZpcnN0bm90ZSA9IG5vdGUuU3RhcnRUaW1lIC0gZmlyc3Rub3RlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIFJvdW5kIHRoZSB0aW1lIGRvd24gdG8gYSBtdWx0aXBsZSBvZiA0ICovXG4gICAgICAgICAgICAgICAgICAgIHRpbWVfZnJvbV9maXJzdG5vdGUgPSB0aW1lX2Zyb21fZmlyc3Rub3RlIC8gNCAqIDQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aW1lX2Zyb21fZmlyc3Rub3RlIDwgbWlubWVhc3VyZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGltZV9mcm9tX2ZpcnN0bm90ZSA+IG1heG1lYXN1cmUpXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdC5Db250YWlucyh0aW1lX2Zyb21fZmlyc3Rub3RlKSlcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LkFkZCh0aW1lX2Zyb21fZmlyc3Rub3RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdC5Tb3J0KCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIFJldHVybiB0aGUgbGFzdCBzdGFydCB0aW1lICovXG4gICAgICAgIHB1YmxpYyBpbnQgRW5kVGltZSgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGludCBsYXN0U3RhcnQgPSAwO1xuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaVRyYWNrIHRyYWNrIGluIHRyYWNrcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAodHJhY2suTm90ZXMuQ291bnQgPT0gMClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpbnQgbGFzdCA9IHRyYWNrLk5vdGVzW3RyYWNrLk5vdGVzLkNvdW50IC0gMV0uU3RhcnRUaW1lO1xuICAgICAgICAgICAgICAgIGxhc3RTdGFydCA9IE1hdGguTWF4KGxhc3QsIGxhc3RTdGFydCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbGFzdFN0YXJ0O1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIFJldHVybiB0cnVlIGlmIHRoaXMgbWlkaSBmaWxlIGhhcyBseXJpY3MgKi9cbiAgICAgICAgcHVibGljIGJvb2wgSGFzTHlyaWNzKClcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaVRyYWNrIHRyYWNrIGluIHRyYWNrcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAodHJhY2suTHlyaWNzICE9IG51bGwpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgb3ZlcnJpZGUgc3RyaW5nIFRvU3RyaW5nKClcbiAgICAgICAge1xuICAgICAgICAgICAgc3RyaW5nIHJlc3VsdCA9IFwiTWlkaSBGaWxlIHRyYWNrcz1cIiArIHRyYWNrcy5Db3VudCArIFwiIHF1YXJ0ZXI9XCIgKyBxdWFydGVybm90ZSArIFwiXFxuXCI7XG4gICAgICAgICAgICByZXN1bHQgKz0gVGltZS5Ub1N0cmluZygpICsgXCJcXG5cIjtcbiAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlUcmFjayB0cmFjayBpbiB0cmFja3MpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IHRyYWNrLlRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICB9ICAvKiBFbmQgY2xhc3MgTWlkaUZpbGUgKi9cblxufSAgLyogRW5kIG5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyAqL1xuXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTIgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5JTztcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljIHtcblxuLyoqIEBjbGFzcyBNaWRpRmlsZUV4Y2VwdGlvblxuICogQSBNaWRpRmlsZUV4Y2VwdGlvbiBpcyB0aHJvd24gd2hlbiBhbiBlcnJvciBvY2N1cnNcbiAqIHdoaWxlIHBhcnNpbmcgdGhlIE1pZGkgRmlsZS4gIFRoZSBjb25zdHJ1Y3RvciB0YWtlc1xuICogdGhlIGZpbGUgb2Zmc2V0IChpbiBieXRlcykgd2hlcmUgdGhlIGVycm9yIG9jY3VycmVkLFxuICogYW5kIGEgc3RyaW5nIGRlc2NyaWJpbmcgdGhlIGVycm9yLlxuICovXG5wdWJsaWMgY2xhc3MgTWlkaUZpbGVFeGNlcHRpb24gOiBTeXN0ZW0uRXhjZXB0aW9uIHtcbiAgICBwdWJsaWMgTWlkaUZpbGVFeGNlcHRpb24gKHN0cmluZyBzLCBpbnQgb2Zmc2V0KSA6XG4gICAgICAgIGJhc2UocyArIFwiIGF0IG9mZnNldCBcIiArIG9mZnNldCkge1xuICAgIH1cbn1cblxufVxuXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTIgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5JTztcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljIHtcblxuXG4vKiogQGNsYXNzIE1pZGlGaWxlUmVhZGVyXG4gKiBUaGUgTWlkaUZpbGVSZWFkZXIgaXMgdXNlZCB0byByZWFkIGxvdy1sZXZlbCBiaW5hcnkgZGF0YSBmcm9tIGEgZmlsZS5cbiAqIFRoaXMgY2xhc3MgY2FuIGRvIHRoZSBmb2xsb3dpbmc6XG4gKlxuICogLSBQZWVrIGF0IHRoZSBuZXh0IGJ5dGUgaW4gdGhlIGZpbGUuXG4gKiAtIFJlYWQgYSBieXRlXG4gKiAtIFJlYWQgYSAxNi1iaXQgYmlnIGVuZGlhbiBzaG9ydFxuICogLSBSZWFkIGEgMzItYml0IGJpZyBlbmRpYW4gaW50XG4gKiAtIFJlYWQgYSBmaXhlZCBsZW5ndGggYXNjaWkgc3RyaW5nIChub3QgbnVsbCB0ZXJtaW5hdGVkKVxuICogLSBSZWFkIGEgXCJ2YXJpYWJsZSBsZW5ndGhcIiBpbnRlZ2VyLiAgVGhlIGZvcm1hdCBvZiB0aGUgdmFyaWFibGUgbGVuZ3RoXG4gKiAgIGludCBpcyBkZXNjcmliZWQgYXQgdGhlIHRvcCBvZiB0aGlzIGZpbGUuXG4gKiAtIFNraXAgYWhlYWQgYSBnaXZlbiBudW1iZXIgb2YgYnl0ZXNcbiAqIC0gUmV0dXJuIHRoZSBjdXJyZW50IG9mZnNldC5cbiAqL1xuXG5wdWJsaWMgY2xhc3MgTWlkaUZpbGVSZWFkZXIge1xuICAgIHByaXZhdGUgYnl0ZVtdIGRhdGE7ICAgICAgIC8qKiBUaGUgZW50aXJlIG1pZGkgZmlsZSBkYXRhICovXG4gICAgcHJpdmF0ZSBpbnQgcGFyc2Vfb2Zmc2V0OyAgLyoqIFRoZSBjdXJyZW50IG9mZnNldCB3aGlsZSBwYXJzaW5nICovXG5cbiAgICAvKiogQ3JlYXRlIGEgbmV3IE1pZGlGaWxlUmVhZGVyIGZvciB0aGUgZ2l2ZW4gZmlsZW5hbWUgKi9cbiAgICAvL3B1YmxpYyBNaWRpRmlsZVJlYWRlcihzdHJpbmcgZmlsZW5hbWUpIHtcbiAgICAvLyAgICBGaWxlSW5mbyBpbmZvID0gbmV3IEZpbGVJbmZvKGZpbGVuYW1lKTtcbiAgICAvLyAgICBpZiAoIWluZm8uRXhpc3RzKSB7XG4gICAgLy8gICAgICAgIHRocm93IG5ldyBNaWRpRmlsZUV4Y2VwdGlvbihcIkZpbGUgXCIgKyBmaWxlbmFtZSArIFwiIGRvZXMgbm90IGV4aXN0XCIsIDApO1xuICAgIC8vICAgIH1cbiAgICAvLyAgICBpZiAoaW5mby5MZW5ndGggPT0gMCkge1xuICAgIC8vICAgICAgICB0aHJvdyBuZXcgTWlkaUZpbGVFeGNlcHRpb24oXCJGaWxlIFwiICsgZmlsZW5hbWUgKyBcIiBpcyBlbXB0eSAoMCBieXRlcylcIiwgMCk7XG4gICAgLy8gICAgfVxuICAgIC8vICAgIEZpbGVTdHJlYW0gZmlsZSA9IEZpbGUuT3BlbihmaWxlbmFtZSwgRmlsZU1vZGUuT3BlbiwgXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZpbGVBY2Nlc3MuUmVhZCwgRmlsZVNoYXJlLlJlYWQpO1xuXG4gICAgLy8gICAgLyogUmVhZCB0aGUgZW50aXJlIGZpbGUgaW50byBtZW1vcnkgKi9cbiAgICAvLyAgICBkYXRhID0gbmV3IGJ5dGVbIGluZm8uTGVuZ3RoIF07XG4gICAgLy8gICAgaW50IG9mZnNldCA9IDA7XG4gICAgLy8gICAgaW50IGxlbiA9IChpbnQpaW5mby5MZW5ndGg7XG4gICAgLy8gICAgd2hpbGUgKHRydWUpIHtcbiAgICAvLyAgICAgICAgaWYgKG9mZnNldCA9PSBpbmZvLkxlbmd0aClcbiAgICAvLyAgICAgICAgICAgIGJyZWFrO1xuICAgIC8vICAgICAgICBpbnQgbiA9IGZpbGUuUmVhZChkYXRhLCBvZmZzZXQsIChpbnQpKGluZm8uTGVuZ3RoIC0gb2Zmc2V0KSk7XG4gICAgLy8gICAgICAgIGlmIChuIDw9IDApXG4gICAgLy8gICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgb2Zmc2V0ICs9IG47XG4gICAgLy8gICAgfVxuICAgIC8vICAgIHBhcnNlX29mZnNldCA9IDA7XG4gICAgLy8gICAgZmlsZS5DbG9zZSgpO1xuICAgIC8vfVxuXG4gICAgLyoqIENyZWF0ZSBhIG5ldyBNaWRpRmlsZVJlYWRlciBmcm9tIHRoZSBnaXZlbiBkYXRhICovXG4gICAgcHVibGljIE1pZGlGaWxlUmVhZGVyKGJ5dGVbXSBieXRlcykge1xuICAgICAgICBkYXRhID0gYnl0ZXM7XG4gICAgICAgIHBhcnNlX29mZnNldCA9IDA7XG4gICAgfVxuXG4gICAgLyoqIENoZWNrIHRoYXQgdGhlIGdpdmVuIG51bWJlciBvZiBieXRlcyBkb2Vzbid0IGV4Y2VlZCB0aGUgZmlsZSBzaXplICovXG4gICAgcHJpdmF0ZSB2b2lkIGNoZWNrUmVhZChpbnQgYW1vdW50KSB7XG4gICAgICAgIGlmIChwYXJzZV9vZmZzZXQgKyBhbW91bnQgPiBkYXRhLkxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1pZGlGaWxlRXhjZXB0aW9uKFwiRmlsZSBpcyB0cnVuY2F0ZWRcIiwgcGFyc2Vfb2Zmc2V0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBSZWFkIHRoZSBuZXh0IGJ5dGUgaW4gdGhlIGZpbGUsIGJ1dCBkb24ndCBpbmNyZW1lbnQgdGhlIHBhcnNlIG9mZnNldCAqL1xuICAgIHB1YmxpYyBieXRlIFBlZWsoKSB7XG4gICAgICAgIGNoZWNrUmVhZCgxKTtcbiAgICAgICAgcmV0dXJuIGRhdGFbcGFyc2Vfb2Zmc2V0XTtcbiAgICB9XG5cbiAgICAvKiogUmVhZCBhIGJ5dGUgZnJvbSB0aGUgZmlsZSAqL1xuICAgIHB1YmxpYyBieXRlIFJlYWRCeXRlKCkgeyBcbiAgICAgICAgY2hlY2tSZWFkKDEpO1xuICAgICAgICBieXRlIHggPSBkYXRhW3BhcnNlX29mZnNldF07XG4gICAgICAgIHBhcnNlX29mZnNldCsrO1xuICAgICAgICByZXR1cm4geDtcbiAgICB9XG5cbiAgICAvKiogUmVhZCB0aGUgZ2l2ZW4gbnVtYmVyIG9mIGJ5dGVzIGZyb20gdGhlIGZpbGUgKi9cbiAgICBwdWJsaWMgYnl0ZVtdIFJlYWRCeXRlcyhpbnQgYW1vdW50KSB7XG4gICAgICAgIGNoZWNrUmVhZChhbW91bnQpO1xuICAgICAgICBieXRlW10gcmVzdWx0ID0gbmV3IGJ5dGVbYW1vdW50XTtcbiAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCBhbW91bnQ7IGkrKykge1xuICAgICAgICAgICAgcmVzdWx0W2ldID0gZGF0YVtpICsgcGFyc2Vfb2Zmc2V0XTtcbiAgICAgICAgfVxuICAgICAgICBwYXJzZV9vZmZzZXQgKz0gYW1vdW50O1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKiBSZWFkIGEgMTYtYml0IHNob3J0IGZyb20gdGhlIGZpbGUgKi9cbiAgICBwdWJsaWMgdXNob3J0IFJlYWRTaG9ydCgpIHtcbiAgICAgICAgY2hlY2tSZWFkKDIpO1xuICAgICAgICB1c2hvcnQgeCA9ICh1c2hvcnQpICggKGRhdGFbcGFyc2Vfb2Zmc2V0XSA8PCA4KSB8IGRhdGFbcGFyc2Vfb2Zmc2V0KzFdICk7XG4gICAgICAgIHBhcnNlX29mZnNldCArPSAyO1xuICAgICAgICByZXR1cm4geDtcbiAgICB9XG5cbiAgICAvKiogUmVhZCBhIDMyLWJpdCBpbnQgZnJvbSB0aGUgZmlsZSAqL1xuICAgIHB1YmxpYyBpbnQgUmVhZEludCgpIHtcbiAgICAgICAgY2hlY2tSZWFkKDQpO1xuICAgICAgICBpbnQgeCA9IChpbnQpKCAoZGF0YVtwYXJzZV9vZmZzZXRdIDw8IDI0KSB8IChkYXRhW3BhcnNlX29mZnNldCsxXSA8PCAxNikgfFxuICAgICAgICAgICAgICAgICAgICAgICAoZGF0YVtwYXJzZV9vZmZzZXQrMl0gPDwgOCkgfCBkYXRhW3BhcnNlX29mZnNldCszXSApO1xuICAgICAgICBwYXJzZV9vZmZzZXQgKz0gNDtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuXG4gICAgLyoqIFJlYWQgYW4gYXNjaWkgc3RyaW5nIHdpdGggdGhlIGdpdmVuIGxlbmd0aCAqL1xuICAgIHB1YmxpYyBzdHJpbmcgUmVhZEFzY2lpKGludCBsZW4pIHtcbiAgICAgICAgY2hlY2tSZWFkKGxlbik7XG4gICAgICAgIHN0cmluZyBzID0gQVNDSUlFbmNvZGluZy5BU0NJSS5HZXRTdHJpbmcoZGF0YSwgcGFyc2Vfb2Zmc2V0LCBsZW4pO1xuICAgICAgICBwYXJzZV9vZmZzZXQgKz0gbGVuO1xuICAgICAgICByZXR1cm4gcztcbiAgICB9XG5cbiAgICAvKiogUmVhZCBhIHZhcmlhYmxlLWxlbmd0aCBpbnRlZ2VyICgxIHRvIDQgYnl0ZXMpLiBUaGUgaW50ZWdlciBlbmRzXG4gICAgICogd2hlbiB5b3UgZW5jb3VudGVyIGEgYnl0ZSB0aGF0IGRvZXNuJ3QgaGF2ZSB0aGUgOHRoIGJpdCBzZXRcbiAgICAgKiAoYSBieXRlIGxlc3MgdGhhbiAweDgwKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgaW50IFJlYWRWYXJsZW4oKSB7XG4gICAgICAgIHVpbnQgcmVzdWx0ID0gMDtcbiAgICAgICAgYnl0ZSBiO1xuXG4gICAgICAgIGIgPSBSZWFkQnl0ZSgpO1xuICAgICAgICByZXN1bHQgPSAodWludCkoYiAmIDB4N2YpO1xuXG4gICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoKGIgJiAweDgwKSAhPSAwKSB7XG4gICAgICAgICAgICAgICAgYiA9IFJlYWRCeXRlKCk7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gKHVpbnQpKCAocmVzdWx0IDw8IDcpICsgKGIgJiAweDdmKSApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChpbnQpcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKiBTa2lwIG92ZXIgdGhlIGdpdmVuIG51bWJlciBvZiBieXRlcyAqLyBcbiAgICBwdWJsaWMgdm9pZCBTa2lwKGludCBhbW91bnQpIHtcbiAgICAgICAgY2hlY2tSZWFkKGFtb3VudCk7XG4gICAgICAgIHBhcnNlX29mZnNldCArPSBhbW91bnQ7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB0aGUgY3VycmVudCBwYXJzZSBvZmZzZXQgKi9cbiAgICBwdWJsaWMgaW50IEdldE9mZnNldCgpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlX29mZnNldDtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHRoZSByYXcgbWlkaSBmaWxlIGJ5dGUgZGF0YSAqL1xuICAgIHB1YmxpYyBieXRlW10gR2V0RGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxufVxuXG59IFxuXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTIgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5JTztcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljXG57XG5cbiAgICAvKiogQGNsYXNzIE1pZGlOb3RlXG4gICAgICogQSBNaWRpTm90ZSBjb250YWluc1xuICAgICAqXG4gICAgICogc3RhcnR0aW1lIC0gVGhlIHRpbWUgKG1lYXN1cmVkIGluIHB1bHNlcykgd2hlbiB0aGUgbm90ZSBpcyBwcmVzc2VkLlxuICAgICAqIGNoYW5uZWwgICAtIFRoZSBjaGFubmVsIHRoZSBub3RlIGlzIGZyb20uICBUaGlzIGlzIHVzZWQgd2hlbiBtYXRjaGluZ1xuICAgICAqICAgICAgICAgICAgIE5vdGVPZmYgZXZlbnRzIHdpdGggdGhlIGNvcnJlc3BvbmRpbmcgTm90ZU9uIGV2ZW50LlxuICAgICAqICAgICAgICAgICAgIFRoZSBjaGFubmVscyBmb3IgdGhlIE5vdGVPbiBhbmQgTm90ZU9mZiBldmVudHMgbXVzdCBiZVxuICAgICAqICAgICAgICAgICAgIHRoZSBzYW1lLlxuICAgICAqIG5vdGVudW1iZXIgLSBUaGUgbm90ZSBudW1iZXIsIGZyb20gMCB0byAxMjcuICBNaWRkbGUgQyBpcyA2MC5cbiAgICAgKiBkdXJhdGlvbiAgLSBUaGUgdGltZSBkdXJhdGlvbiAobWVhc3VyZWQgaW4gcHVsc2VzKSBhZnRlciB3aGljaCB0aGUgXG4gICAgICogICAgICAgICAgICAgbm90ZSBpcyByZWxlYXNlZC5cbiAgICAgKlxuICAgICAqIEEgTWlkaU5vdGUgaXMgY3JlYXRlZCB3aGVuIHdlIGVuY291bnRlciBhIE5vdGVPZmYgZXZlbnQuICBUaGUgZHVyYXRpb25cbiAgICAgKiBpcyBpbml0aWFsbHkgdW5rbm93biAoc2V0IHRvIDApLiAgV2hlbiB0aGUgY29ycmVzcG9uZGluZyBOb3RlT2ZmIGV2ZW50XG4gICAgICogaXMgZm91bmQsIHRoZSBkdXJhdGlvbiBpcyBzZXQgYnkgdGhlIG1ldGhvZCBOb3RlT2ZmKCkuXG4gICAgICovXG4gICAgcHVibGljIGNsYXNzIE1pZGlOb3RlIDogSUNvbXBhcmVyPE1pZGlOb3RlPlxuICAgIHtcbiAgICAgICAgcHJpdmF0ZSBpbnQgaWQ7ICAgICAgICAgIC8qKiBOb3RlIElELiBUaGlzIGNhbiBiZSB1c2VkIHRvIGtlZXAgdHJhY2sgb2YgY2xvbmVzIGFmdGVyIGNhbGxzIHN1Y2ggYXMgTWlkaUZpbGUuQ2hhbmdlTWlkaU5vdGVzICAqL1xuICAgICAgICBwcml2YXRlIGludCBzdGFydHRpbWU7ICAgLyoqIFRoZSBzdGFydCB0aW1lLCBpbiBwdWxzZXMgKi9cbiAgICAgICAgcHJpdmF0ZSBpbnQgY2hhbm5lbDsgICAgIC8qKiBUaGUgY2hhbm5lbCAqL1xuICAgICAgICBwcml2YXRlIGludCBub3RlbnVtYmVyOyAgLyoqIFRoZSBub3RlLCBmcm9tIDAgdG8gMTI3LiBNaWRkbGUgQyBpcyA2MCAqL1xuICAgICAgICBwcml2YXRlIGludCBkdXJhdGlvbjsgICAgLyoqIFRoZSBkdXJhdGlvbiwgaW4gcHVsc2VzICovXG4gICAgICAgIHByaXZhdGUgaW50IHZlbG9jaXR5OyAgICAvKiogVmVsb2NpdHkgb2YgdGhlIG5vdGUsIGZyb20gMCB0byAxMjcgKi9cblxuXG4gICAgICAgIC8qIENyZWF0ZSBhIG5ldyBNaWRpTm90ZS4gIFRoaXMgaXMgY2FsbGVkIHdoZW4gYSBOb3RlT24gZXZlbnQgaXNcbiAgICAgICAgICogZW5jb3VudGVyZWQgaW4gdGhlIE1pZGlGaWxlLlxuICAgICAgICAgKi9cbiAgICAgICAgcHVibGljIE1pZGlOb3RlKGludCBpZCwgaW50IHN0YXJ0dGltZSwgaW50IGNoYW5uZWwsIGludCBub3RlbnVtYmVyLCBpbnQgZHVyYXRpb24sIGludCB2ZWxvY2l0eSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICAgICAgdGhpcy5zdGFydHRpbWUgPSBzdGFydHRpbWU7XG4gICAgICAgICAgICB0aGlzLmNoYW5uZWwgPSBjaGFubmVsO1xuICAgICAgICAgICAgdGhpcy5ub3RlbnVtYmVyID0gbm90ZW51bWJlcjtcbiAgICAgICAgICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBpbnQgSWRcbiAgICAgICAge1xuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIGlkOyB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIHB1YmxpYyBpbnQgU3RhcnRUaW1lXG4gICAgICAgIHtcbiAgICAgICAgICAgIGdldCB7IHJldHVybiBzdGFydHRpbWU7IH1cbiAgICAgICAgICAgIHNldCB7IHN0YXJ0dGltZSA9IHZhbHVlOyB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgaW50IEVuZFRpbWVcbiAgICAgICAge1xuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIHN0YXJ0dGltZSArIGR1cmF0aW9uOyB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgaW50IENoYW5uZWxcbiAgICAgICAge1xuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIGNoYW5uZWw7IH1cbiAgICAgICAgICAgIHNldCB7IGNoYW5uZWwgPSB2YWx1ZTsgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGludCBOdW1iZXJcbiAgICAgICAge1xuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIG5vdGVudW1iZXI7IH1cbiAgICAgICAgICAgIHNldCB7IG5vdGVudW1iZXIgPSB2YWx1ZTsgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGludCBEdXJhdGlvblxuICAgICAgICB7XG4gICAgICAgICAgICBnZXQgeyByZXR1cm4gZHVyYXRpb247IH1cbiAgICAgICAgICAgIHNldCB7IGR1cmF0aW9uID0gdmFsdWU7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBpbnQgVmVsb2NpdHlcbiAgICAgICAge1xuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIHZlbG9jaXR5OyB9XG4gICAgICAgICAgICBzZXQgeyB2ZWxvY2l0eSA9IHZhbHVlOyB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiBBIE5vdGVPZmYgZXZlbnQgb2NjdXJzIGZvciB0aGlzIG5vdGUgYXQgdGhlIGdpdmVuIHRpbWUuXG4gICAgICAgICAqIENhbGN1bGF0ZSB0aGUgbm90ZSBkdXJhdGlvbiBiYXNlZCBvbiB0aGUgbm90ZW9mZiBldmVudC5cbiAgICAgICAgICovXG4gICAgICAgIHB1YmxpYyB2b2lkIE5vdGVPZmYoaW50IGVuZHRpbWUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGR1cmF0aW9uID0gZW5kdGltZSAtIHN0YXJ0dGltZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBDb21wYXJlIHR3byBNaWRpTm90ZXMgYmFzZWQgb24gdGhlaXIgc3RhcnQgdGltZXMuXG4gICAgICAgICAqICBJZiB0aGUgc3RhcnQgdGltZXMgYXJlIGVxdWFsLCBjb21wYXJlIGJ5IHRoZWlyIG51bWJlcnMuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgaW50IENvbXBhcmUoTWlkaU5vdGUgeCwgTWlkaU5vdGUgeSlcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKHguU3RhcnRUaW1lID09IHkuU3RhcnRUaW1lKVxuICAgICAgICAgICAgICAgIHJldHVybiB4Lk51bWJlciAtIHkuTnVtYmVyO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiB4LlN0YXJ0VGltZSAtIHkuU3RhcnRUaW1lO1xuICAgICAgICB9XG5cblxuICAgICAgICBwdWJsaWMgTWlkaU5vdGUgQ2xvbmUoKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE1pZGlOb3RlKGlkLCBzdGFydHRpbWUsIGNoYW5uZWwsIG5vdGVudW1iZXIsIGR1cmF0aW9uLCB2ZWxvY2l0eSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgb3ZlcnJpZGVcbiAgICAgICAgc3RyaW5nIFRvU3RyaW5nKClcbiAgICAgICAge1xuICAgICAgICAgICAgc3RyaW5nW10gc2NhbGUgPSB7IFwiQVwiLCBcIkEjXCIsIFwiQlwiLCBcIkNcIiwgXCJDI1wiLCBcIkRcIiwgXCJEI1wiLCBcIkVcIiwgXCJGXCIsIFwiRiNcIiwgXCJHXCIsIFwiRyNcIiB9O1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZy5Gb3JtYXQoXCJNaWRpTm90ZSBjaGFubmVsPXswfSBudW1iZXI9ezF9IHsyfSBzdGFydD17M30gZHVyYXRpb249ezR9XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFubmVsLCBub3RlbnVtYmVyLCBzY2FsZVsobm90ZW51bWJlciArIDMpICUgMTJdLCBzdGFydHRpbWUsIGR1cmF0aW9uKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cblxufSAgLyogRW5kIG5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyAqL1xuXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTMgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5JTztcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyB7XG5cbi8qKiBAY2xhc3MgTWlkaU9wdGlvbnNcbiAqXG4gKiBUaGUgTWlkaU9wdGlvbnMgY2xhc3MgY29udGFpbnMgdGhlIGF2YWlsYWJsZSBvcHRpb25zIGZvclxuICogbW9kaWZ5aW5nIHRoZSBzaGVldCBtdXNpYyBhbmQgc291bmQuICBUaGVzZSBvcHRpb25zIGFyZVxuICogY29sbGVjdGVkIGZyb20gdGhlIG1lbnUvZGlhbG9nIHNldHRpbmdzLCBhbmQgdGhlbiBhcmUgcGFzc2VkXG4gKiB0byB0aGUgU2hlZXRNdXNpYyBhbmQgTWlkaVBsYXllciBjbGFzc2VzLlxuICovXG5wdWJsaWMgY2xhc3MgTWlkaU9wdGlvbnMge1xuXG4gICAgLy8gVGhlIHBvc3NpYmxlIHZhbHVlcyBmb3Igc2hvd05vdGVMZXR0ZXJzXG4gICAgcHVibGljIGNvbnN0IGludCBOb3RlTmFtZU5vbmUgICAgICAgICAgID0gMDtcbiAgICBwdWJsaWMgY29uc3QgaW50IE5vdGVOYW1lTGV0dGVyICAgICAgICAgPSAxO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgTm90ZU5hbWVGaXhlZERvUmVNaSAgICA9IDI7XG4gICAgcHVibGljIGNvbnN0IGludCBOb3RlTmFtZU1vdmFibGVEb1JlTWkgID0gMztcbiAgICBwdWJsaWMgY29uc3QgaW50IE5vdGVOYW1lRml4ZWROdW1iZXIgICAgPSA0O1xuICAgIHB1YmxpYyBjb25zdCBpbnQgTm90ZU5hbWVNb3ZhYmxlTnVtYmVyICA9IDU7XG5cbiAgICAvLyBTaGVldCBNdXNpYyBPcHRpb25zXG4gICAgcHVibGljIHN0cmluZyBmaWxlbmFtZTsgICAgICAgLyoqIFRoZSBmdWxsIE1pZGkgZmlsZW5hbWUgKi9cbiAgICBwdWJsaWMgc3RyaW5nIHRpdGxlOyAgICAgICAgICAvKiogVGhlIE1pZGkgc29uZyB0aXRsZSAqL1xuICAgIHB1YmxpYyBib29sW10gdHJhY2tzOyAgICAgICAgIC8qKiBXaGljaCB0cmFja3MgdG8gZGlzcGxheSAodHJ1ZSA9IGRpc3BsYXkpICovXG4gICAgcHVibGljIGJvb2wgc2Nyb2xsVmVydDsgICAgICAgLyoqIFdoZXRoZXIgdG8gc2Nyb2xsIHZlcnRpY2FsbHkgb3IgaG9yaXpvbnRhbGx5ICovXG4gICAgcHVibGljIGJvb2wgbGFyZ2VOb3RlU2l6ZTsgICAgLyoqIERpc3BsYXkgbGFyZ2Ugb3Igc21hbGwgbm90ZSBzaXplcyAqL1xuICAgIHB1YmxpYyBib29sIHR3b1N0YWZmczsgICAgICAgIC8qKiBDb21iaW5lIHRyYWNrcyBpbnRvIHR3byBzdGFmZnMgPyAqL1xuICAgIHB1YmxpYyBpbnQgc2hvd05vdGVMZXR0ZXJzOyAgICAgLyoqIFNob3cgdGhlIG5hbWUgKEEsIEEjLCBldGMpIG5leHQgdG8gdGhlIG5vdGVzICovXG4gICAgcHVibGljIGJvb2wgc2hvd0x5cmljczsgICAgICAgLyoqIFNob3cgdGhlIGx5cmljcyB1bmRlciBlYWNoIG5vdGUgKi9cbiAgICBwdWJsaWMgYm9vbCBzaG93TWVhc3VyZXM7ICAgICAvKiogU2hvdyB0aGUgbWVhc3VyZSBudW1iZXJzIGZvciBlYWNoIHN0YWZmICovXG4gICAgcHVibGljIGludCBzaGlmdHRpbWU7ICAgICAgICAgLyoqIFNoaWZ0IG5vdGUgc3RhcnR0aW1lcyBieSB0aGUgZ2l2ZW4gYW1vdW50ICovXG4gICAgcHVibGljIGludCB0cmFuc3Bvc2U7ICAgICAgICAgLyoqIFNoaWZ0IG5vdGUga2V5IHVwL2Rvd24gYnkgZ2l2ZW4gYW1vdW50ICovXG4gICAgcHVibGljIGludCBrZXk7ICAgICAgICAgICAgICAgLyoqIFVzZSB0aGUgZ2l2ZW4gS2V5U2lnbmF0dXJlIChub3Rlc2NhbGUpICovXG4gICAgcHVibGljIFRpbWVTaWduYXR1cmUgdGltZTsgICAgLyoqIFVzZSB0aGUgZ2l2ZW4gdGltZSBzaWduYXR1cmUgKi9cbiAgICBwdWJsaWMgaW50IGNvbWJpbmVJbnRlcnZhbDsgICAvKiogQ29tYmluZSBub3RlcyB3aXRoaW4gZ2l2ZW4gdGltZSBpbnRlcnZhbCAobXNlYykgKi9cbiAgICBwdWJsaWMgQ29sb3JbXSBjb2xvcnM7ICAgICAgICAvKiogVGhlIG5vdGUgY29sb3JzIHRvIHVzZSAqL1xuICAgIHB1YmxpYyBDb2xvciBzaGFkZUNvbG9yOyAgICAgIC8qKiBUaGUgY29sb3IgdG8gdXNlIGZvciBzaGFkaW5nLiAqL1xuICAgIHB1YmxpYyBDb2xvciBzaGFkZTJDb2xvcjsgICAgIC8qKiBUaGUgY29sb3IgdG8gdXNlIGZvciBzaGFkaW5nIHRoZSBsZWZ0IGhhbmQgcGlhbm8gKi9cblxuICAgIC8vIFNvdW5kIG9wdGlvbnNcbiAgICBwdWJsaWMgYm9vbCBbXW11dGU7ICAgICAgICAgICAgLyoqIFdoaWNoIHRyYWNrcyB0byBtdXRlICh0cnVlID0gbXV0ZSkgKi9cbiAgICBwdWJsaWMgaW50IHRlbXBvOyAgICAgICAgICAgICAgLyoqIFRoZSB0ZW1wbywgaW4gbWljcm9zZWNvbmRzIHBlciBxdWFydGVyIG5vdGUgKi9cbiAgICBwdWJsaWMgaW50IHBhdXNlVGltZTsgICAgICAgICAgLyoqIFN0YXJ0IHRoZSBtaWRpIG11c2ljIGF0IHRoZSBnaXZlbiBwYXVzZSB0aW1lICovXG4gICAgcHVibGljIGludFtdIGluc3RydW1lbnRzOyAgICAgIC8qKiBUaGUgaW5zdHJ1bWVudHMgdG8gdXNlIHBlciB0cmFjayAqL1xuICAgIHB1YmxpYyBib29sIHVzZURlZmF1bHRJbnN0cnVtZW50czsgIC8qKiBJZiB0cnVlLCBkb24ndCBjaGFuZ2UgaW5zdHJ1bWVudHMgKi9cbiAgICBwdWJsaWMgYm9vbCBwbGF5TWVhc3VyZXNJbkxvb3A7ICAgICAvKiogUGxheSB0aGUgc2VsZWN0ZWQgbWVhc3VyZXMgaW4gYSBsb29wICovXG4gICAgcHVibGljIGludCBwbGF5TWVhc3VyZXNJbkxvb3BTdGFydDsgLyoqIFN0YXJ0IG1lYXN1cmUgdG8gcGxheSBpbiBsb29wICovXG4gICAgcHVibGljIGludCBwbGF5TWVhc3VyZXNJbkxvb3BFbmQ7ICAgLyoqIEVuZCBtZWFzdXJlIHRvIHBsYXkgaW4gbG9vcCAqL1xuXG5cbiAgICBwdWJsaWMgTWlkaU9wdGlvbnMoKSB7XG4gICAgfVxuXG4gICAgcHVibGljIE1pZGlPcHRpb25zKE1pZGlGaWxlIG1pZGlmaWxlKSB7XG4gICAgICAgIGZpbGVuYW1lID0gbWlkaWZpbGUuRmlsZU5hbWU7XG4gICAgICAgIHRpdGxlID0gUGF0aC5HZXRGaWxlTmFtZShtaWRpZmlsZS5GaWxlTmFtZSk7XG4gICAgICAgIGludCBudW10cmFja3MgPSBtaWRpZmlsZS5UcmFja3MuQ291bnQ7XG4gICAgICAgIHRyYWNrcyA9IG5ldyBib29sW251bXRyYWNrc107XG4gICAgICAgIG11dGUgPSAgbmV3IGJvb2xbbnVtdHJhY2tzXTtcbiAgICAgICAgaW5zdHJ1bWVudHMgPSBuZXcgaW50W251bXRyYWNrc107XG4gICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgdHJhY2tzLkxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0cmFja3NbaV0gPSB0cnVlO1xuICAgICAgICAgICAgbXV0ZVtpXSA9IGZhbHNlO1xuICAgICAgICAgICAgaW5zdHJ1bWVudHNbaV0gPSBtaWRpZmlsZS5UcmFja3NbaV0uSW5zdHJ1bWVudDtcbiAgICAgICAgICAgIGlmIChtaWRpZmlsZS5UcmFja3NbaV0uSW5zdHJ1bWVudE5hbWUgPT0gXCJQZXJjdXNzaW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0cmFja3NbaV0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBtdXRlW2ldID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBcbiAgICAgICAgdXNlRGVmYXVsdEluc3RydW1lbnRzID0gdHJ1ZTtcbiAgICAgICAgc2Nyb2xsVmVydCA9IHRydWU7XG4gICAgICAgIGxhcmdlTm90ZVNpemUgPSBmYWxzZTtcbiAgICAgICAgaWYgKHRyYWNrcy5MZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgdHdvU3RhZmZzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHR3b1N0YWZmcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHNob3dOb3RlTGV0dGVycyA9IE5vdGVOYW1lTm9uZTtcbiAgICAgICAgc2hvd0x5cmljcyA9IHRydWU7XG4gICAgICAgIHNob3dNZWFzdXJlcyA9IGZhbHNlO1xuICAgICAgICBzaGlmdHRpbWUgPSAwO1xuICAgICAgICB0cmFuc3Bvc2UgPSAwO1xuICAgICAgICBrZXkgPSAtMTtcbiAgICAgICAgdGltZSA9IG1pZGlmaWxlLlRpbWU7XG4gICAgICAgIGNvbG9ycyA9IG51bGw7XG4gICAgICAgIHNoYWRlQ29sb3IgPSBDb2xvci5Gcm9tQXJnYigxMDAsIDUzLCAxMjMsIDI1NSk7XG4gICAgICAgIHNoYWRlMkNvbG9yID0gQ29sb3IuRnJvbVJnYig4MCwgMTAwLCAyNTApO1xuICAgICAgICBjb21iaW5lSW50ZXJ2YWwgPSA0MDtcbiAgICAgICAgdGVtcG8gPSBtaWRpZmlsZS5UaW1lLlRlbXBvO1xuICAgICAgICBwYXVzZVRpbWUgPSAwO1xuICAgICAgICBwbGF5TWVhc3VyZXNJbkxvb3AgPSBmYWxzZTsgXG4gICAgICAgIHBsYXlNZWFzdXJlc0luTG9vcFN0YXJ0ID0gMDtcbiAgICAgICAgcGxheU1lYXN1cmVzSW5Mb29wRW5kID0gbWlkaWZpbGUuRW5kVGltZSgpIC8gbWlkaWZpbGUuVGltZS5NZWFzdXJlO1xuICAgIH1cblxuICAgIC8qIEpvaW4gdGhlIGFycmF5IGludG8gYSBjb21tYSBzZXBhcmF0ZWQgc3RyaW5nICovXG4gICAgc3RhdGljIHN0cmluZyBKb2luKGJvb2xbXSB2YWx1ZXMpIHtcbiAgICAgICAgU3RyaW5nQnVpbGRlciByZXN1bHQgPSBuZXcgU3RyaW5nQnVpbGRlcigpO1xuICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IHZhbHVlcy5MZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LkFwcGVuZChcIixcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQuQXBwZW5kKHZhbHVlc1tpXS5Ub1N0cmluZygpKTsgXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdC5Ub1N0cmluZygpO1xuICAgIH1cblxuICAgIHN0YXRpYyBzdHJpbmcgSm9pbihpbnRbXSB2YWx1ZXMpIHtcbiAgICAgICAgU3RyaW5nQnVpbGRlciByZXN1bHQgPSBuZXcgU3RyaW5nQnVpbGRlcigpO1xuICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IHZhbHVlcy5MZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LkFwcGVuZChcIixcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQuQXBwZW5kKHZhbHVlc1tpXS5Ub1N0cmluZygpKTsgXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdC5Ub1N0cmluZygpO1xuICAgIH1cblxuICAgIHN0YXRpYyBzdHJpbmcgSm9pbihDb2xvcltdIHZhbHVlcykge1xuICAgICAgICBTdHJpbmdCdWlsZGVyIHJlc3VsdCA9IG5ldyBTdHJpbmdCdWlsZGVyKCk7XG4gICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgdmFsdWVzLkxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQuQXBwZW5kKFwiLFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdC5BcHBlbmQoQ29sb3JUb1N0cmluZyh2YWx1ZXNbaV0pKTsgXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdC5Ub1N0cmluZygpO1xuICAgIH1cblxuICAgIHN0YXRpYyBzdHJpbmcgQ29sb3JUb1N0cmluZyhDb2xvciBjKSB7XG4gICAgICAgIHJldHVybiBcIlwiICsgYy5SICsgXCIgXCIgKyBjLkcgKyBcIiBcIiArIGMuQjtcbiAgICB9XG5cbiAgICBcbiAgICAvKiBNZXJnZSBpbiB0aGUgc2F2ZWQgb3B0aW9ucyB0byB0aGlzIE1pZGlPcHRpb25zLiovXG4gICAgcHVibGljIHZvaWQgTWVyZ2UoTWlkaU9wdGlvbnMgc2F2ZWQpIHtcbiAgICAgICAgaWYgKHNhdmVkLnRyYWNrcyAhPSBudWxsICYmIHNhdmVkLnRyYWNrcy5MZW5ndGggPT0gdHJhY2tzLkxlbmd0aCkge1xuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCB0cmFja3MuTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0cmFja3NbaV0gPSBzYXZlZC50cmFja3NbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNhdmVkLm11dGUgIT0gbnVsbCAmJiBzYXZlZC5tdXRlLkxlbmd0aCA9PSBtdXRlLkxlbmd0aCkge1xuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCBtdXRlLkxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbXV0ZVtpXSA9IHNhdmVkLm11dGVbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNhdmVkLmluc3RydW1lbnRzICE9IG51bGwgJiYgc2F2ZWQuaW5zdHJ1bWVudHMuTGVuZ3RoID09IGluc3RydW1lbnRzLkxlbmd0aCkge1xuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCBpbnN0cnVtZW50cy5MZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGluc3RydW1lbnRzW2ldID0gc2F2ZWQuaW5zdHJ1bWVudHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNhdmVkLnRpbWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGltZSA9IG5ldyBUaW1lU2lnbmF0dXJlKHNhdmVkLnRpbWUuTnVtZXJhdG9yLCBzYXZlZC50aW1lLkRlbm9taW5hdG9yLFxuICAgICAgICAgICAgICAgICAgICBzYXZlZC50aW1lLlF1YXJ0ZXIsIHNhdmVkLnRpbWUuVGVtcG8pO1xuICAgICAgICB9XG4gICAgICAgIHVzZURlZmF1bHRJbnN0cnVtZW50cyA9IHNhdmVkLnVzZURlZmF1bHRJbnN0cnVtZW50cztcbiAgICAgICAgc2Nyb2xsVmVydCA9IHNhdmVkLnNjcm9sbFZlcnQ7XG4gICAgICAgIGxhcmdlTm90ZVNpemUgPSBzYXZlZC5sYXJnZU5vdGVTaXplO1xuICAgICAgICBzaG93THlyaWNzID0gc2F2ZWQuc2hvd0x5cmljcztcbiAgICAgICAgdHdvU3RhZmZzID0gc2F2ZWQudHdvU3RhZmZzO1xuICAgICAgICBzaG93Tm90ZUxldHRlcnMgPSBzYXZlZC5zaG93Tm90ZUxldHRlcnM7XG4gICAgICAgIHRyYW5zcG9zZSA9IHNhdmVkLnRyYW5zcG9zZTtcbiAgICAgICAga2V5ID0gc2F2ZWQua2V5O1xuICAgICAgICBjb21iaW5lSW50ZXJ2YWwgPSBzYXZlZC5jb21iaW5lSW50ZXJ2YWw7XG4gICAgICAgIGlmIChzYXZlZC5zaGFkZUNvbG9yICE9IENvbG9yLldoaXRlKSB7XG4gICAgICAgICAgICBzaGFkZUNvbG9yID0gc2F2ZWQuc2hhZGVDb2xvcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2F2ZWQuc2hhZGUyQ29sb3IgIT0gQ29sb3IuV2hpdGUpIHtcbiAgICAgICAgICAgIHNoYWRlMkNvbG9yID0gc2F2ZWQuc2hhZGUyQ29sb3I7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNhdmVkLmNvbG9ycyAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb2xvcnMgPSBzYXZlZC5jb2xvcnM7XG4gICAgICAgIH1cbiAgICAgICAgc2hvd01lYXN1cmVzID0gc2F2ZWQuc2hvd01lYXN1cmVzO1xuICAgICAgICBwbGF5TWVhc3VyZXNJbkxvb3AgPSBzYXZlZC5wbGF5TWVhc3VyZXNJbkxvb3A7XG4gICAgICAgIHBsYXlNZWFzdXJlc0luTG9vcFN0YXJ0ID0gc2F2ZWQucGxheU1lYXN1cmVzSW5Mb29wU3RhcnQ7XG4gICAgICAgIHBsYXlNZWFzdXJlc0luTG9vcEVuZCA9IHNhdmVkLnBsYXlNZWFzdXJlc0luTG9vcEVuZDtcbiAgICB9XG59XG5cbn1cblxuXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTIgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5JTztcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljXG57XG5cbiAgICAvKiogQGNsYXNzIE1pZGlUcmFja1xuICAgICAqIFRoZSBNaWRpVHJhY2sgdGFrZXMgYXMgaW5wdXQgdGhlIHJhdyBNaWRpRXZlbnRzIGZvciB0aGUgdHJhY2ssIGFuZCBnZXRzOlxuICAgICAqIC0gVGhlIGxpc3Qgb2YgbWlkaSBub3RlcyBpbiB0aGUgdHJhY2suXG4gICAgICogLSBUaGUgZmlyc3QgaW5zdHJ1bWVudCB1c2VkIGluIHRoZSB0cmFjay5cbiAgICAgKlxuICAgICAqIEZvciBlYWNoIE5vdGVPbiBldmVudCBpbiB0aGUgbWlkaSBmaWxlLCBhIG5ldyBNaWRpTm90ZSBpcyBjcmVhdGVkXG4gICAgICogYW5kIGFkZGVkIHRvIHRoZSB0cmFjaywgdXNpbmcgdGhlIEFkZE5vdGUoKSBtZXRob2QuXG4gICAgICogXG4gICAgICogVGhlIE5vdGVPZmYoKSBtZXRob2QgaXMgY2FsbGVkIHdoZW4gYSBOb3RlT2ZmIGV2ZW50IGlzIGVuY291bnRlcmVkLFxuICAgICAqIGluIG9yZGVyIHRvIHVwZGF0ZSB0aGUgZHVyYXRpb24gb2YgdGhlIE1pZGlOb3RlLlxuICAgICAqL1xuICAgIHB1YmxpYyBjbGFzcyBNaWRpVHJhY2tcbiAgICB7XG4gICAgICAgIHByaXZhdGUgc3RhdGljIGludCBub3RlSWRDb3VudGVyID0gMDsgLyoqIENvdW50ZXIgdXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgbm90ZSBJRHMgKi9cbiAgICAgICAgcHJpdmF0ZSBpbnQgdHJhY2tudW07ICAgICAgICAgICAgIC8qKiBUaGUgdHJhY2sgbnVtYmVyICovXG4gICAgICAgIHByaXZhdGUgTGlzdDxNaWRpTm90ZT4gbm90ZXM7ICAgICAvKiogTGlzdCBvZiBNaWRpIG5vdGVzICovXG4gICAgICAgIHByaXZhdGUgaW50IGluc3RydW1lbnQ7ICAgICAgICAgICAvKiogSW5zdHJ1bWVudCBmb3IgdGhpcyB0cmFjayAqL1xuICAgICAgICBwcml2YXRlIExpc3Q8TWlkaUV2ZW50PiBseXJpY3M7ICAgLyoqIFRoZSBseXJpY3MgaW4gdGhpcyB0cmFjayAqL1xuXG4gICAgICAgIC8qKiBDcmVhdGUgYW4gZW1wdHkgTWlkaVRyYWNrLiAgVXNlZCBieSB0aGUgQ2xvbmUgbWV0aG9kICovXG4gICAgICAgIHB1YmxpYyBNaWRpVHJhY2soaW50IHRyYWNrbnVtKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnRyYWNrbnVtID0gdHJhY2tudW07XG4gICAgICAgICAgICBub3RlcyA9IG5ldyBMaXN0PE1pZGlOb3RlPigyMCk7XG4gICAgICAgICAgICBpbnN0cnVtZW50ID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBDcmVhdGUgYSBNaWRpVHJhY2sgYmFzZWQgb24gdGhlIE1pZGkgZXZlbnRzLiAgRXh0cmFjdCB0aGUgTm90ZU9uL05vdGVPZmZcbiAgICAgICAgICogIGV2ZW50cyB0byBnYXRoZXIgdGhlIGxpc3Qgb2YgTWlkaU5vdGVzLlxuICAgICAgICAgKi9cbiAgICAgICAgcHVibGljIE1pZGlUcmFjayhMaXN0PE1pZGlFdmVudD4gZXZlbnRzLCBpbnQgdHJhY2tudW0pXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMudHJhY2tudW0gPSB0cmFja251bTtcbiAgICAgICAgICAgIG5vdGVzID0gbmV3IExpc3Q8TWlkaU5vdGU+KGV2ZW50cy5Db3VudCk7XG4gICAgICAgICAgICBpbnN0cnVtZW50ID0gMDtcblxuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaUV2ZW50IG1ldmVudCBpbiBldmVudHMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gTWlkaUZpbGUuRXZlbnROb3RlT24gJiYgbWV2ZW50LlZlbG9jaXR5ID4gMClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIE1pZGlOb3RlIG5vdGUgPSBuZXcgTWlkaU5vdGUobm90ZUlkQ291bnRlcisrLCBtZXZlbnQuU3RhcnRUaW1lLCBtZXZlbnQuQ2hhbm5lbCwgbWV2ZW50Lk5vdGVudW1iZXIsIDAsIG1ldmVudC5WZWxvY2l0eSk7XG4gICAgICAgICAgICAgICAgICAgIEFkZE5vdGUobm90ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gTWlkaUZpbGUuRXZlbnROb3RlT24gJiYgbWV2ZW50LlZlbG9jaXR5ID09IDApXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBOb3RlT2ZmKG1ldmVudC5DaGFubmVsLCBtZXZlbnQuTm90ZW51bWJlciwgbWV2ZW50LlN0YXJ0VGltZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1ldmVudC5FdmVudEZsYWcgPT0gTWlkaUZpbGUuRXZlbnROb3RlT2ZmKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgTm90ZU9mZihtZXZlbnQuQ2hhbm5lbCwgbWV2ZW50Lk5vdGVudW1iZXIsIG1ldmVudC5TdGFydFRpbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChtZXZlbnQuRXZlbnRGbGFnID09IE1pZGlGaWxlLkV2ZW50UHJvZ3JhbUNoYW5nZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGluc3RydW1lbnQgPSBtZXZlbnQuSW5zdHJ1bWVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobWV2ZW50Lk1ldGFldmVudCA9PSBNaWRpRmlsZS5NZXRhRXZlbnRMeXJpYylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIEFkZEx5cmljKG1ldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vdGVzLkNvdW50ID4gMCAmJiBub3Rlc1swXS5DaGFubmVsID09IDkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaW5zdHJ1bWVudCA9IDEyODsgIC8qIFBlcmN1c3Npb24gKi9cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGludCBseXJpY2NvdW50ID0gMDtcbiAgICAgICAgICAgIGlmIChseXJpY3MgIT0gbnVsbCkgeyBseXJpY2NvdW50ID0gbHlyaWNzLkNvdW50OyB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgaW50IE51bWJlclxuICAgICAgICB7XG4gICAgICAgICAgICBnZXQgeyByZXR1cm4gdHJhY2tudW07IH1cbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBMaXN0PE1pZGlOb3RlPiBOb3Rlc1xuICAgICAgICB7XG4gICAgICAgICAgICBnZXQgeyByZXR1cm4gbm90ZXM7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBpbnQgSW5zdHJ1bWVudFxuICAgICAgICB7XG4gICAgICAgICAgICBnZXQgeyByZXR1cm4gaW5zdHJ1bWVudDsgfVxuICAgICAgICAgICAgc2V0IHsgaW5zdHJ1bWVudCA9IHZhbHVlOyB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgc3RyaW5nIEluc3RydW1lbnROYW1lXG4gICAgICAgIHtcbiAgICAgICAgICAgIGdldFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmIChpbnN0cnVtZW50ID49IDAgJiYgaW5zdHJ1bWVudCA8PSAxMjgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBNaWRpRmlsZS5JbnN0cnVtZW50c1tpbnN0cnVtZW50XTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIExpc3Q8TWlkaUV2ZW50PiBMeXJpY3NcbiAgICAgICAge1xuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIGx5cmljczsgfVxuICAgICAgICAgICAgc2V0IHsgbHlyaWNzID0gdmFsdWU7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBBZGQgYSBNaWRpTm90ZSB0byB0aGlzIHRyYWNrLiAgVGhpcyBpcyBjYWxsZWQgZm9yIGVhY2ggTm90ZU9uIGV2ZW50ICovXG4gICAgICAgIHB1YmxpYyB2b2lkIEFkZE5vdGUoTWlkaU5vdGUgbSlcbiAgICAgICAge1xuICAgICAgICAgICAgbm90ZXMuQWRkKG0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEEgTm90ZU9mZiBldmVudCBvY2N1cmVkLiAgRmluZCB0aGUgTWlkaU5vdGUgb2YgdGhlIGNvcnJlc3BvbmRpbmdcbiAgICAgICAgICogTm90ZU9uIGV2ZW50LCBhbmQgdXBkYXRlIHRoZSBkdXJhdGlvbiBvZiB0aGUgTWlkaU5vdGUuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgdm9pZCBOb3RlT2ZmKGludCBjaGFubmVsLCBpbnQgbm90ZW51bWJlciwgaW50IGVuZHRpbWUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciAoaW50IGkgPSBub3Rlcy5Db3VudCAtIDE7IGkgPj0gMDsgaS0tKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIE1pZGlOb3RlIG5vdGUgPSBub3Rlc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAobm90ZS5DaGFubmVsID09IGNoYW5uZWwgJiYgbm90ZS5OdW1iZXIgPT0gbm90ZW51bWJlciAmJlxuICAgICAgICAgICAgICAgICAgICBub3RlLkR1cmF0aW9uID09IDApXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBub3RlLk5vdGVPZmYoZW5kdGltZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQWRkIGEgTHlyaWMgTWlkaUV2ZW50ICovXG4gICAgICAgIHB1YmxpYyB2b2lkIEFkZEx5cmljKE1pZGlFdmVudCBtZXZlbnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmIChseXJpY3MgPT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBseXJpY3MgPSBuZXcgTGlzdDxNaWRpRXZlbnQ+KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBseXJpY3MuQWRkKG1ldmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogUmV0dXJuIGEgZGVlcCBjb3B5IGNsb25lIG9mIHRoaXMgTWlkaVRyYWNrLiAqL1xuICAgICAgICBwdWJsaWMgTWlkaVRyYWNrIENsb25lKClcbiAgICAgICAge1xuICAgICAgICAgICAgTWlkaVRyYWNrIHRyYWNrID0gbmV3IE1pZGlUcmFjayhOdW1iZXIpO1xuICAgICAgICAgICAgdHJhY2suaW5zdHJ1bWVudCA9IGluc3RydW1lbnQ7XG4gICAgICAgICAgICBmb3JlYWNoIChNaWRpTm90ZSBub3RlIGluIG5vdGVzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRyYWNrLm5vdGVzLkFkZChub3RlLkNsb25lKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGx5cmljcyAhPSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRyYWNrLmx5cmljcyA9IG5ldyBMaXN0PE1pZGlFdmVudD4oKTtcbiAgICAgICAgICAgICAgICBmb3JlYWNoIChNaWRpRXZlbnQgZXYgaW4gbHlyaWNzKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2subHlyaWNzLkFkZChldik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRyYWNrO1xuICAgICAgICB9XG4gICAgICAgIHB1YmxpYyBvdmVycmlkZSBzdHJpbmcgVG9TdHJpbmcoKVxuICAgICAgICB7XG4gICAgICAgICAgICBzdHJpbmcgcmVzdWx0ID0gXCJUcmFjayBudW1iZXI9XCIgKyB0cmFja251bSArIFwiIGluc3RydW1lbnQ9XCIgKyBpbnN0cnVtZW50ICsgXCJcXG5cIjtcbiAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlOb3RlIG4gaW4gbm90ZXMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgbiArIFwiXFxuXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQgKz0gXCJFbmQgVHJhY2tcXG5cIjtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICB9XG5cbn1cblxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAwNy0yMDExIE1hZGhhdiBWYWlkeWFuYXRoYW5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuXG51c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljIHtcblxuLyoqIEVudW1lcmF0aW9uIG9mIHRoZSBub3RlcyBpbiBhIHNjYWxlIChBLCBBIywgLi4uIEcjKSAqL1xucHVibGljIGNsYXNzIE5vdGVTY2FsZSB7XG4gICAgcHVibGljIGNvbnN0IGludCBBICAgICAgPSAwO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgQXNoYXJwID0gMTtcbiAgICBwdWJsaWMgY29uc3QgaW50IEJmbGF0ICA9IDE7XG4gICAgcHVibGljIGNvbnN0IGludCBCICAgICAgPSAyO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgQyAgICAgID0gMztcbiAgICBwdWJsaWMgY29uc3QgaW50IENzaGFycCA9IDQ7XG4gICAgcHVibGljIGNvbnN0IGludCBEZmxhdCAgPSA0O1xuICAgIHB1YmxpYyBjb25zdCBpbnQgRCAgICAgID0gNTtcbiAgICBwdWJsaWMgY29uc3QgaW50IERzaGFycCA9IDY7XG4gICAgcHVibGljIGNvbnN0IGludCBFZmxhdCAgPSA2O1xuICAgIHB1YmxpYyBjb25zdCBpbnQgRSAgICAgID0gNztcbiAgICBwdWJsaWMgY29uc3QgaW50IEYgICAgICA9IDg7XG4gICAgcHVibGljIGNvbnN0IGludCBGc2hhcnAgPSA5O1xuICAgIHB1YmxpYyBjb25zdCBpbnQgR2ZsYXQgID0gOTtcbiAgICBwdWJsaWMgY29uc3QgaW50IEcgICAgICA9IDEwO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgR3NoYXJwID0gMTE7XG4gICAgcHVibGljIGNvbnN0IGludCBBZmxhdCAgPSAxMTtcblxuICAgIC8qKiBDb252ZXJ0IGEgbm90ZSAoQSwgQSMsIEIsIGV0YykgYW5kIG9jdGF2ZSBpbnRvIGFcbiAgICAgKiBNaWRpIE5vdGUgbnVtYmVyLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgaW50IFRvTnVtYmVyKGludCBub3Rlc2NhbGUsIGludCBvY3RhdmUpIHtcbiAgICAgICAgcmV0dXJuIDkgKyBub3Rlc2NhbGUgKyBvY3RhdmUgKiAxMjtcbiAgICB9XG5cbiAgICAvKiogQ29udmVydCBhIE1pZGkgbm90ZSBudW1iZXIgaW50byBhIG5vdGVzY2FsZSAoQSwgQSMsIEIpICovXG4gICAgcHVibGljIHN0YXRpYyBpbnQgRnJvbU51bWJlcihpbnQgbnVtYmVyKSB7XG4gICAgICAgIHJldHVybiAobnVtYmVyICsgMykgJSAxMjtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHRydWUgaWYgdGhpcyBub3Rlc2NhbGUgbnVtYmVyIGlzIGEgYmxhY2sga2V5ICovXG4gICAgcHVibGljIHN0YXRpYyBib29sIElzQmxhY2tLZXkoaW50IG5vdGVzY2FsZSkge1xuICAgICAgICBpZiAobm90ZXNjYWxlID09IEFzaGFycCB8fFxuICAgICAgICAgICAgbm90ZXNjYWxlID09IENzaGFycCB8fFxuICAgICAgICAgICAgbm90ZXNjYWxlID09IERzaGFycCB8fFxuICAgICAgICAgICAgbm90ZXNjYWxlID09IEZzaGFycCB8fFxuICAgICAgICAgICAgbm90ZXNjYWxlID09IEdzaGFycCkge1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG4vKiogQGNsYXNzIFdoaXRlTm90ZVxuICogVGhlIFdoaXRlTm90ZSBjbGFzcyByZXByZXNlbnRzIGEgd2hpdGUga2V5IG5vdGUsIGEgbm9uLXNoYXJwLFxuICogbm9uLWZsYXQgbm90ZS4gIFRvIGRpc3BsYXkgbWlkaSBub3RlcyBhcyBzaGVldCBtdXNpYywgdGhlIG5vdGVzXG4gKiBtdXN0IGJlIGNvbnZlcnRlZCB0byB3aGl0ZSBub3RlcyBhbmQgYWNjaWRlbnRhbHMuIFxuICpcbiAqIFdoaXRlIG5vdGVzIGNvbnNpc3Qgb2YgYSBsZXR0ZXIgKEEgdGhydSBHKSBhbmQgYW4gb2N0YXZlICgwIHRocnUgMTApLlxuICogVGhlIG9jdGF2ZSBjaGFuZ2VzIGZyb20gRyB0byBBLiAgQWZ0ZXIgRzIgY29tZXMgQTMuICBNaWRkbGUtQyBpcyBDNC5cbiAqXG4gKiBUaGUgbWFpbiBvcGVyYXRpb25zIGFyZSBjYWxjdWxhdGluZyBkaXN0YW5jZXMgYmV0d2VlbiBub3RlcywgYW5kIGNvbXBhcmluZyBub3Rlcy5cbiAqLyBcblxucHVibGljIGNsYXNzIFdoaXRlTm90ZSA6IElDb21wYXJlcjxXaGl0ZU5vdGU+IHtcblxuICAgIC8qIFRoZSBwb3NzaWJsZSBub3RlIGxldHRlcnMgKi9cbiAgICBwdWJsaWMgY29uc3QgaW50IEEgPSAwO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgQiA9IDE7XG4gICAgcHVibGljIGNvbnN0IGludCBDID0gMjtcbiAgICBwdWJsaWMgY29uc3QgaW50IEQgPSAzO1xuICAgIHB1YmxpYyBjb25zdCBpbnQgRSA9IDQ7XG4gICAgcHVibGljIGNvbnN0IGludCBGID0gNTtcbiAgICBwdWJsaWMgY29uc3QgaW50IEcgPSA2O1xuXG4gICAgLyogQ29tbW9uIHdoaXRlIG5vdGVzIHVzZWQgaW4gY2FsY3VsYXRpb25zICovXG4gICAgcHVibGljIHN0YXRpYyBXaGl0ZU5vdGUgVG9wVHJlYmxlID0gbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRSwgNSk7XG4gICAgcHVibGljIHN0YXRpYyBXaGl0ZU5vdGUgQm90dG9tVHJlYmxlID0gbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRiwgNCk7XG4gICAgcHVibGljIHN0YXRpYyBXaGl0ZU5vdGUgVG9wQmFzcyA9IG5ldyBXaGl0ZU5vdGUoV2hpdGVOb3RlLkcsIDMpO1xuICAgIHB1YmxpYyBzdGF0aWMgV2hpdGVOb3RlIEJvdHRvbUJhc3MgPSBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5BLCAzKTtcbiAgICBwdWJsaWMgc3RhdGljIFdoaXRlTm90ZSBNaWRkbGVDID0gbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuQywgNCk7XG5cbiAgICBwcml2YXRlIGludCBsZXR0ZXI7ICAvKiBUaGUgbGV0dGVyIG9mIHRoZSBub3RlLCBBIHRocnUgRyAqL1xuICAgIHByaXZhdGUgaW50IG9jdGF2ZTsgIC8qIFRoZSBvY3RhdmUsIDAgdGhydSAxMC4gKi9cblxuICAgIC8qIEdldCB0aGUgbGV0dGVyICovXG4gICAgcHVibGljIGludCBMZXR0ZXIge1xuICAgICAgICBnZXQgeyByZXR1cm4gbGV0dGVyOyB9XG4gICAgfVxuXG4gICAgLyogR2V0IHRoZSBvY3RhdmUgKi9cbiAgICBwdWJsaWMgaW50IE9jdGF2ZSB7XG4gICAgICAgIGdldCB7IHJldHVybiBvY3RhdmU7IH1cbiAgICB9XG5cblxuICAgIC8qKiBDcmVhdGUgYSBuZXcgbm90ZSB3aXRoIHRoZSBnaXZlbiBsZXR0ZXIgYW5kIG9jdGF2ZS4gKi9cbiAgICBwdWJsaWMgV2hpdGVOb3RlKGludCBsZXR0ZXIsIGludCBvY3RhdmUpIHtcbiAgICAgICAgaWYgKCEobGV0dGVyID49IDAgJiYgbGV0dGVyIDw9IDYpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgU3lzdGVtLkFyZ3VtZW50RXhjZXB0aW9uKFwiTGV0dGVyIFwiICsgbGV0dGVyICsgXCIgaXMgaW5jb3JyZWN0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5sZXR0ZXIgPSBsZXR0ZXI7XG4gICAgICAgIHRoaXMub2N0YXZlID0gb2N0YXZlO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdGhlIGRpc3RhbmNlIChpbiB3aGl0ZSBub3RlcykgYmV0d2VlbiB0aGlzIG5vdGVcbiAgICAgKiBhbmQgbm90ZSB3LCBpLmUuICB0aGlzIC0gdy4gIEZvciBleGFtcGxlLCBDNCAtIEE0ID0gMixcbiAgICAgKi9cbiAgICBwdWJsaWMgaW50IERpc3QoV2hpdGVOb3RlIHcpIHtcbiAgICAgICAgcmV0dXJuIChvY3RhdmUgLSB3Lm9jdGF2ZSkgKiA3ICsgKGxldHRlciAtIHcubGV0dGVyKTtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHRoaXMgbm90ZSBwbHVzIHRoZSBnaXZlbiBhbW91bnQgKGluIHdoaXRlIG5vdGVzKS5cbiAgICAgKiBUaGUgYW1vdW50IG1heSBiZSBwb3NpdGl2ZSBvciBuZWdhdGl2ZS4gIEZvciBleGFtcGxlLFxuICAgICAqIEE0ICsgMiA9IEM0LCBhbmQgQzQgKyAoLTIpID0gQTQuXG4gICAgICovXG4gICAgcHVibGljIFdoaXRlTm90ZSBBZGQoaW50IGFtb3VudCkge1xuICAgICAgICBpbnQgbnVtID0gb2N0YXZlICogNyArIGxldHRlcjtcbiAgICAgICAgbnVtICs9IGFtb3VudDtcbiAgICAgICAgaWYgKG51bSA8IDApIHtcbiAgICAgICAgICAgIG51bSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBXaGl0ZU5vdGUobnVtICUgNywgbnVtIC8gNyk7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB0aGUgbWlkaSBub3RlIG51bWJlciBjb3JyZXNwb25kaW5nIHRvIHRoaXMgd2hpdGUgbm90ZS5cbiAgICAgKiBUaGUgbWlkaSBub3RlIG51bWJlcnMgY292ZXIgYWxsIGtleXMsIGluY2x1ZGluZyBzaGFycHMvZmxhdHMsXG4gICAgICogc28gZWFjaCBvY3RhdmUgaXMgMTIgbm90ZXMuICBNaWRkbGUgQyAoQzQpIGlzIDYwLiAgU29tZSBleGFtcGxlXG4gICAgICogbnVtYmVycyBmb3IgdmFyaW91cyBub3RlczpcbiAgICAgKlxuICAgICAqICBBIDIgPSAzM1xuICAgICAqICBBIzIgPSAzNFxuICAgICAqICBHIDIgPSA0M1xuICAgICAqICBHIzIgPSA0NCBcbiAgICAgKiAgQSAzID0gNDVcbiAgICAgKiAgQSA0ID0gNTdcbiAgICAgKiAgQSM0ID0gNThcbiAgICAgKiAgQiA0ID0gNTlcbiAgICAgKiAgQyA0ID0gNjBcbiAgICAgKi9cblxuICAgIHB1YmxpYyBpbnQgTnVtYmVyKCkge1xuICAgICAgICBpbnQgb2Zmc2V0ID0gMDtcbiAgICAgICAgc3dpdGNoIChsZXR0ZXIpIHtcbiAgICAgICAgICAgIGNhc2UgQTogb2Zmc2V0ID0gTm90ZVNjYWxlLkE7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBCOiBvZmZzZXQgPSBOb3RlU2NhbGUuQjsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEM6IG9mZnNldCA9IE5vdGVTY2FsZS5DOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgRDogb2Zmc2V0ID0gTm90ZVNjYWxlLkQ7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBFOiBvZmZzZXQgPSBOb3RlU2NhbGUuRTsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEY6IG9mZnNldCA9IE5vdGVTY2FsZS5GOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgRzogb2Zmc2V0ID0gTm90ZVNjYWxlLkc7IGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDogb2Zmc2V0ID0gMDsgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE5vdGVTY2FsZS5Ub051bWJlcihvZmZzZXQsIG9jdGF2ZSk7XG4gICAgfVxuXG4gICAgLyoqIENvbXBhcmUgdGhlIHR3byBub3Rlcy4gIFJldHVyblxuICAgICAqICA8IDAgIGlmIHggaXMgbGVzcyAobG93ZXIpIHRoYW4geVxuICAgICAqICAgIDAgIGlmIHggaXMgZXF1YWwgdG8geVxuICAgICAqICA+IDAgIGlmIHggaXMgZ3JlYXRlciAoaGlnaGVyKSB0aGFuIHlcbiAgICAgKi9cbiAgICBwdWJsaWMgaW50IENvbXBhcmUoV2hpdGVOb3RlIHgsIFdoaXRlTm90ZSB5KSB7XG4gICAgICAgIHJldHVybiB4LkRpc3QoeSk7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB0aGUgaGlnaGVyIG5vdGUsIHggb3IgeSAqL1xuICAgIHB1YmxpYyBzdGF0aWMgV2hpdGVOb3RlIE1heChXaGl0ZU5vdGUgeCwgV2hpdGVOb3RlIHkpIHtcbiAgICAgICAgaWYgKHguRGlzdCh5KSA+IDApXG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIHk7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB0aGUgbG93ZXIgbm90ZSwgeCBvciB5ICovXG4gICAgcHVibGljIHN0YXRpYyBXaGl0ZU5vdGUgTWluKFdoaXRlTm90ZSB4LCBXaGl0ZU5vdGUgeSkge1xuICAgICAgICBpZiAoeC5EaXN0KHkpIDwgMClcbiAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4geTtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHRoZSB0b3Agbm90ZSBpbiB0aGUgc3RhZmYgb2YgdGhlIGdpdmVuIGNsZWYgKi9cbiAgICBwdWJsaWMgc3RhdGljIFdoaXRlTm90ZSBUb3AoQ2xlZiBjbGVmKSB7XG4gICAgICAgIGlmIChjbGVmID09IENsZWYuVHJlYmxlKVxuICAgICAgICAgICAgcmV0dXJuIFRvcFRyZWJsZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIFRvcEJhc3M7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB0aGUgYm90dG9tIG5vdGUgaW4gdGhlIHN0YWZmIG9mIHRoZSBnaXZlbiBjbGVmICovXG4gICAgcHVibGljIHN0YXRpYyBXaGl0ZU5vdGUgQm90dG9tKENsZWYgY2xlZikge1xuICAgICAgICBpZiAoY2xlZiA9PSBDbGVmLlRyZWJsZSlcbiAgICAgICAgICAgIHJldHVybiBCb3R0b21UcmVibGU7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBCb3R0b21CYXNzO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdGhlIHN0cmluZyA8bGV0dGVyPjxvY3RhdmU+IGZvciB0aGlzIG5vdGUuICovXG4gICAgcHVibGljIG92ZXJyaWRlIFxuICAgIHN0cmluZyBUb1N0cmluZygpIHtcbiAgICAgICAgc3RyaW5nW10gcyA9IHsgXCJBXCIsIFwiQlwiLCBcIkNcIiwgXCJEXCIsIFwiRVwiLCBcIkZcIiwgXCJHXCIgfTtcbiAgICAgICAgcmV0dXJuIHNbbGV0dGVyXSArIG9jdGF2ZTtcbiAgICB9XG59XG5cblxuXG59XG4iLCJ1c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcbntcbiAgICBwdWJsaWMgY2xhc3MgUGFpbnRFdmVudEFyZ3NcbiAgICB7XG4gICAgICAgIHB1YmxpYyBSZWN0YW5nbGUgQ2xpcFJlY3RhbmdsZSB7IGdldDsgc2V0OyB9XG5cbiAgICAgICAgcHVibGljIEdyYXBoaWNzIEdyYXBoaWNzKCkgeyByZXR1cm4gbmV3IEdyYXBoaWNzKFwibWFpblwiKTsgfVxuICAgIH1cbn1cbiIsInVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY1xue1xuICAgIHB1YmxpYyBjbGFzcyBQYW5lbFxuICAgIHtcbiAgICAgICAgcHJpdmF0ZSBQb2ludCBhdXRvU2Nyb2xsUG9zaXRpb249bmV3IFBvaW50KDAsMCk7XG4gICAgICAgIHB1YmxpYyBQb2ludCBBdXRvU2Nyb2xsUG9zaXRpb24geyBnZXQgeyByZXR1cm4gYXV0b1Njcm9sbFBvc2l0aW9uOyB9IHNldCB7IGF1dG9TY3JvbGxQb3NpdGlvbiA9IHZhbHVlOyB9IH1cblxuICAgICAgICBwdWJsaWMgaW50IFdpZHRoO1xuICAgICAgICBwdWJsaWMgaW50IEhlaWdodDtcbiAgICB9XG59XG4iLCJ1c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcbntcbiAgICBwdWJsaWMgc3RhdGljIGNsYXNzIFBhdGhcbiAgICB7XG4gICAgICAgIHB1YmxpYyBzdGF0aWMgc3RyaW5nIEdldEZpbGVOYW1lKHN0cmluZyBmaWxlbmFtZSkgeyByZXR1cm4gbnVsbDsgfVxuICAgIH1cbn1cbiIsInVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY1xue1xuICAgIHB1YmxpYyBjbGFzcyBQZW5cbiAgICB7XG4gICAgICAgIHB1YmxpYyBDb2xvciBDb2xvcjtcbiAgICAgICAgcHVibGljIGludCBXaWR0aDtcbiAgICAgICAgcHVibGljIExpbmVDYXAgRW5kQ2FwO1xuXG4gICAgICAgIHB1YmxpYyBQZW4oQ29sb3IgY29sb3IsIGludCB3aWR0aClcbiAgICAgICAge1xuICAgICAgICAgICAgQ29sb3IgPSBjb2xvcjtcbiAgICAgICAgICAgIFdpZHRoID0gd2lkdGg7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJ1c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcbntcbiAgICBwdWJsaWMgY2xhc3MgUG9pbnRcbiAgICB7XG4gICAgICAgIHB1YmxpYyBpbnQgWDtcbiAgICAgICAgcHVibGljIGludCBZO1xuXG4gICAgICAgIHB1YmxpYyBQb2ludChpbnQgeCwgaW50IHkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIFggPSB4O1xuICAgICAgICAgICAgWSA9IHk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJ1c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcbntcbiAgICBwdWJsaWMgY2xhc3MgUmVjdGFuZ2xlXG4gICAge1xuICAgICAgICBwdWJsaWMgaW50IFg7XG4gICAgICAgIHB1YmxpYyBpbnQgWTtcbiAgICAgICAgcHVibGljIGludCBXaWR0aDtcbiAgICAgICAgcHVibGljIGludCBIZWlnaHQ7XG5cbiAgICAgICAgcHVibGljIFJlY3RhbmdsZShpbnQgeCwgaW50IHksIGludCB3aWR0aCwgaW50IGhlaWdodClcbiAgICAgICAge1xuICAgICAgICAgICAgWCA9IHg7XG4gICAgICAgICAgICBZID0geTtcbiAgICAgICAgICAgIFdpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICBIZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTEgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5JTztcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY1xue1xuXG4gICAgLyogQGNsYXNzIFN0YWZmXG4gICAgICogVGhlIFN0YWZmIGlzIHVzZWQgdG8gZHJhdyBhIHNpbmdsZSBTdGFmZiAoYSByb3cgb2YgbWVhc3VyZXMpIGluIHRoZSBcbiAgICAgKiBTaGVldE11c2ljIENvbnRyb2wuIEEgU3RhZmYgbmVlZHMgdG8gZHJhd1xuICAgICAqIC0gVGhlIENsZWZcbiAgICAgKiAtIFRoZSBrZXkgc2lnbmF0dXJlXG4gICAgICogLSBUaGUgaG9yaXpvbnRhbCBsaW5lc1xuICAgICAqIC0gQSBsaXN0IG9mIE11c2ljU3ltYm9sc1xuICAgICAqIC0gVGhlIGxlZnQgYW5kIHJpZ2h0IHZlcnRpY2FsIGxpbmVzXG4gICAgICpcbiAgICAgKiBUaGUgaGVpZ2h0IG9mIHRoZSBTdGFmZiBpcyBkZXRlcm1pbmVkIGJ5IHRoZSBudW1iZXIgb2YgcGl4ZWxzIGVhY2hcbiAgICAgKiBNdXNpY1N5bWJvbCBleHRlbmRzIGFib3ZlIGFuZCBiZWxvdyB0aGUgc3RhZmYuXG4gICAgICpcbiAgICAgKiBUaGUgdmVydGljYWwgbGluZXMgKGxlZnQgYW5kIHJpZ2h0IHNpZGVzKSBvZiB0aGUgc3RhZmYgYXJlIGpvaW5lZFxuICAgICAqIHdpdGggdGhlIHN0YWZmcyBhYm92ZSBhbmQgYmVsb3cgaXQsIHdpdGggb25lIGV4Y2VwdGlvbi4gIFxuICAgICAqIFRoZSBsYXN0IHRyYWNrIGlzIG5vdCBqb2luZWQgd2l0aCB0aGUgZmlyc3QgdHJhY2suXG4gICAgICovXG5cbiAgICBwdWJsaWMgY2xhc3MgU3RhZmZcbiAgICB7XG4gICAgICAgIHByaXZhdGUgTGlzdDxNdXNpY1N5bWJvbD4gc3ltYm9sczsgIC8qKiBUaGUgbXVzaWMgc3ltYm9scyBpbiB0aGlzIHN0YWZmICovXG4gICAgICAgIHByaXZhdGUgTGlzdDxMeXJpY1N5bWJvbD4gbHlyaWNzOyAgIC8qKiBUaGUgbHlyaWNzIHRvIGRpc3BsYXkgKGNhbiBiZSBudWxsKSAqL1xuICAgICAgICBwcml2YXRlIGludCB5dG9wOyAgICAgICAgICAgICAgICAgICAvKiogVGhlIHkgcGl4ZWwgb2YgdGhlIHRvcCBvZiB0aGUgc3RhZmYgKi9cbiAgICAgICAgcHJpdmF0ZSBDbGVmU3ltYm9sIGNsZWZzeW07ICAgICAgICAgLyoqIFRoZSBsZWZ0LXNpZGUgQ2xlZiBzeW1ib2wgKi9cbiAgICAgICAgcHJpdmF0ZSBBY2NpZFN5bWJvbFtdIGtleXM7ICAgICAgICAgLyoqIFRoZSBrZXkgc2lnbmF0dXJlIHN5bWJvbHMgKi9cbiAgICAgICAgcHJpdmF0ZSBib29sIHNob3dNZWFzdXJlczsgICAgICAgICAgLyoqIElmIHRydWUsIHNob3cgdGhlIG1lYXN1cmUgbnVtYmVycyAqL1xuICAgICAgICBwcml2YXRlIGludCBrZXlzaWdXaWR0aDsgICAgICAgICAgICAvKiogVGhlIHdpZHRoIG9mIHRoZSBjbGVmIGFuZCBrZXkgc2lnbmF0dXJlICovXG4gICAgICAgIHByaXZhdGUgaW50IHdpZHRoOyAgICAgICAgICAgICAgICAgIC8qKiBUaGUgd2lkdGggb2YgdGhlIHN0YWZmIGluIHBpeGVscyAqL1xuICAgICAgICBwcml2YXRlIGludCBoZWlnaHQ7ICAgICAgICAgICAgICAgICAvKiogVGhlIGhlaWdodCBvZiB0aGUgc3RhZmYgaW4gcGl4ZWxzICovXG4gICAgICAgIHByaXZhdGUgaW50IHRyYWNrbnVtOyAgICAgICAgICAgICAgIC8qKiBUaGUgdHJhY2sgdGhpcyBzdGFmZiByZXByZXNlbnRzICovXG4gICAgICAgIHByaXZhdGUgaW50IHRvdGFsdHJhY2tzOyAgICAgICAgICAgIC8qKiBUaGUgdG90YWwgbnVtYmVyIG9mIHRyYWNrcyAqL1xuICAgICAgICBwcml2YXRlIGludCBzdGFydHRpbWU7ICAgICAgICAgICAgICAvKiogVGhlIHRpbWUgKGluIHB1bHNlcykgb2YgZmlyc3Qgc3ltYm9sICovXG4gICAgICAgIHByaXZhdGUgaW50IGVuZHRpbWU7ICAgICAgICAgICAgICAgIC8qKiBUaGUgdGltZSAoaW4gcHVsc2VzKSBvZiBsYXN0IHN5bWJvbCAqL1xuICAgICAgICBwcml2YXRlIGludCBtZWFzdXJlTGVuZ3RoOyAgICAgICAgICAvKiogVGhlIHRpbWUgKGluIHB1bHNlcykgb2YgYSBtZWFzdXJlICovXG5cbiAgICAgICAgLyoqIENyZWF0ZSBhIG5ldyBzdGFmZiB3aXRoIHRoZSBnaXZlbiBsaXN0IG9mIG11c2ljIHN5bWJvbHMsXG4gICAgICAgICAqIGFuZCB0aGUgZ2l2ZW4ga2V5IHNpZ25hdHVyZS4gIFRoZSBjbGVmIGlzIGRldGVybWluZWQgYnlcbiAgICAgICAgICogdGhlIGNsZWYgb2YgdGhlIGZpcnN0IGNob3JkIHN5bWJvbC4gVGhlIHRyYWNrIG51bWJlciBpcyB1c2VkXG4gICAgICAgICAqIHRvIGRldGVybWluZSB3aGV0aGVyIHRvIGpvaW4gdGhpcyBsZWZ0L3JpZ2h0IHZlcnRpY2FsIHNpZGVzXG4gICAgICAgICAqIHdpdGggdGhlIHN0YWZmcyBhYm92ZSBhbmQgYmVsb3cuIFRoZSBTaGVldE11c2ljT3B0aW9ucyBhcmUgdXNlZFxuICAgICAgICAgKiB0byBjaGVjayB3aGV0aGVyIHRvIGRpc3BsYXkgbWVhc3VyZSBudW1iZXJzIG9yIG5vdC5cbiAgICAgICAgICovXG4gICAgICAgIHB1YmxpYyBTdGFmZihMaXN0PE11c2ljU3ltYm9sPiBzeW1ib2xzLCBLZXlTaWduYXR1cmUga2V5LFxuICAgICAgICAgICAgICAgICAgICAgTWlkaU9wdGlvbnMgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgIGludCB0cmFja251bSwgaW50IHRvdGFsdHJhY2tzKVxuICAgICAgICB7XG5cbiAgICAgICAgICAgIGtleXNpZ1dpZHRoID0gU2hlZXRNdXNpYy5LZXlTaWduYXR1cmVXaWR0aChrZXkpO1xuICAgICAgICAgICAgdGhpcy50cmFja251bSA9IHRyYWNrbnVtO1xuICAgICAgICAgICAgdGhpcy50b3RhbHRyYWNrcyA9IHRvdGFsdHJhY2tzO1xuICAgICAgICAgICAgc2hvd01lYXN1cmVzID0gKG9wdGlvbnMuc2hvd01lYXN1cmVzICYmIHRyYWNrbnVtID09IDApO1xuICAgICAgICAgICAgbWVhc3VyZUxlbmd0aCA9IG9wdGlvbnMudGltZS5NZWFzdXJlO1xuICAgICAgICAgICAgQ2xlZiBjbGVmID0gRmluZENsZWYoc3ltYm9scyk7XG5cbiAgICAgICAgICAgIGNsZWZzeW0gPSBuZXcgQ2xlZlN5bWJvbChjbGVmLCAwLCBmYWxzZSk7XG4gICAgICAgICAgICBrZXlzID0ga2V5LkdldFN5bWJvbHMoY2xlZik7XG4gICAgICAgICAgICB0aGlzLnN5bWJvbHMgPSBzeW1ib2xzO1xuICAgICAgICAgICAgQ2FsY3VsYXRlV2lkdGgob3B0aW9ucy5zY3JvbGxWZXJ0KTtcbiAgICAgICAgICAgIENhbGN1bGF0ZUhlaWdodCgpO1xuICAgICAgICAgICAgQ2FsY3VsYXRlU3RhcnRFbmRUaW1lKCk7XG4gICAgICAgICAgICBGdWxsSnVzdGlmeSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIFJldHVybiB0aGUgd2lkdGggb2YgdGhlIHN0YWZmICovXG4gICAgICAgIHB1YmxpYyBpbnQgV2lkdGhcbiAgICAgICAge1xuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIHdpZHRoOyB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiogUmV0dXJuIHRoZSBoZWlnaHQgb2YgdGhlIHN0YWZmICovXG4gICAgICAgIHB1YmxpYyBpbnQgSGVpZ2h0XG4gICAgICAgIHtcbiAgICAgICAgICAgIGdldCB7IHJldHVybiBoZWlnaHQ7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBSZXR1cm4gdGhlIHRyYWNrIG51bWJlciBvZiB0aGlzIHN0YWZmIChzdGFydGluZyBmcm9tIDAgKi9cbiAgICAgICAgcHVibGljIGludCBUcmFja1xuICAgICAgICB7XG4gICAgICAgICAgICBnZXQgeyByZXR1cm4gdHJhY2tudW07IH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBSZXR1cm4gdGhlIHN0YXJ0aW5nIHRpbWUgb2YgdGhlIHN0YWZmLCB0aGUgc3RhcnQgdGltZSBvZlxuICAgICAgICAgKiAgdGhlIGZpcnN0IHN5bWJvbC4gIFRoaXMgaXMgdXNlZCBkdXJpbmcgcGxheWJhY2ssIHRvIFxuICAgICAgICAgKiAgYXV0b21hdGljYWxseSBzY3JvbGwgdGhlIG11c2ljIHdoaWxlIHBsYXlpbmcuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgaW50IFN0YXJ0VGltZVxuICAgICAgICB7XG4gICAgICAgICAgICBnZXQgeyByZXR1cm4gc3RhcnR0aW1lOyB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiogUmV0dXJuIHRoZSBlbmRpbmcgdGltZSBvZiB0aGUgc3RhZmYsIHRoZSBlbmR0aW1lIG9mXG4gICAgICAgICAqICB0aGUgbGFzdCBzeW1ib2wuICBUaGlzIGlzIHVzZWQgZHVyaW5nIHBsYXliYWNrLCB0byBcbiAgICAgICAgICogIGF1dG9tYXRpY2FsbHkgc2Nyb2xsIHRoZSBtdXNpYyB3aGlsZSBwbGF5aW5nLlxuICAgICAgICAgKi9cbiAgICAgICAgcHVibGljIGludCBFbmRUaW1lXG4gICAgICAgIHtcbiAgICAgICAgICAgIGdldCB7IHJldHVybiBlbmR0aW1lOyB9XG4gICAgICAgICAgICBzZXQgeyBlbmR0aW1lID0gdmFsdWU7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBGaW5kIHRoZSBpbml0aWFsIGNsZWYgdG8gdXNlIGZvciB0aGlzIHN0YWZmLiAgVXNlIHRoZSBjbGVmIG9mXG4gICAgICAgICAqIHRoZSBmaXJzdCBDaG9yZFN5bWJvbC5cbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGUgQ2xlZiBGaW5kQ2xlZihMaXN0PE11c2ljU3ltYm9sPiBsaXN0KVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3JlYWNoIChNdXNpY1N5bWJvbCBtIGluIGxpc3QpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKG0gaXMgQ2hvcmRTeW1ib2wpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBDaG9yZFN5bWJvbCBjID0gKENob3JkU3ltYm9sKW07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjLkNsZWY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIENsZWYuVHJlYmxlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIENhbGN1bGF0ZSB0aGUgaGVpZ2h0IG9mIHRoaXMgc3RhZmYuICBFYWNoIE11c2ljU3ltYm9sIGNvbnRhaW5zIHRoZVxuICAgICAgICAgKiBudW1iZXIgb2YgcGl4ZWxzIGl0IG5lZWRzIGFib3ZlIGFuZCBiZWxvdyB0aGUgc3RhZmYuICBHZXQgdGhlIG1heGltdW1cbiAgICAgICAgICogdmFsdWVzIGFib3ZlIGFuZCBiZWxvdyB0aGUgc3RhZmYuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgdm9pZCBDYWxjdWxhdGVIZWlnaHQoKVxuICAgICAgICB7XG4gICAgICAgICAgICBpbnQgYWJvdmUgPSAwO1xuICAgICAgICAgICAgaW50IGJlbG93ID0gMDtcblxuICAgICAgICAgICAgZm9yZWFjaCAoTXVzaWNTeW1ib2wgcyBpbiBzeW1ib2xzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGFib3ZlID0gTWF0aC5NYXgoYWJvdmUsIHMuQWJvdmVTdGFmZik7XG4gICAgICAgICAgICAgICAgYmVsb3cgPSBNYXRoLk1heChiZWxvdywgcy5CZWxvd1N0YWZmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFib3ZlID0gTWF0aC5NYXgoYWJvdmUsIGNsZWZzeW0uQWJvdmVTdGFmZik7XG4gICAgICAgICAgICBiZWxvdyA9IE1hdGguTWF4KGJlbG93LCBjbGVmc3ltLkJlbG93U3RhZmYpO1xuICAgICAgICAgICAgaWYgKHNob3dNZWFzdXJlcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBhYm92ZSA9IE1hdGguTWF4KGFib3ZlLCBTaGVldE11c2ljLk5vdGVIZWlnaHQgKiAzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHl0b3AgPSBhYm92ZSArIFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcbiAgICAgICAgICAgIGhlaWdodCA9IFNoZWV0TXVzaWMuTm90ZUhlaWdodCAqIDUgKyB5dG9wICsgYmVsb3c7XG4gICAgICAgICAgICBpZiAobHlyaWNzICE9IG51bGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ICs9IDEyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBBZGQgc29tZSBleHRyYSB2ZXJ0aWNhbCBzcGFjZSBiZXR3ZWVuIHRoZSBsYXN0IHRyYWNrXG4gICAgICAgICAgICAgKiBhbmQgZmlyc3QgdHJhY2suXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGlmICh0cmFja251bSA9PSB0b3RhbHRyYWNrcyAtIDEpXG4gICAgICAgICAgICAgICAgaGVpZ2h0ICs9IFNoZWV0TXVzaWMuTm90ZUhlaWdodCAqIDM7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQ2FsY3VsYXRlIHRoZSB3aWR0aCBvZiB0aGlzIHN0YWZmICovXG4gICAgICAgIHByaXZhdGUgdm9pZCBDYWxjdWxhdGVXaWR0aChib29sIHNjcm9sbFZlcnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmIChzY3JvbGxWZXJ0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHdpZHRoID0gU2hlZXRNdXNpYy5QYWdlV2lkdGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2lkdGggPSBrZXlzaWdXaWR0aDtcbiAgICAgICAgICAgIGZvcmVhY2ggKE11c2ljU3ltYm9sIHMgaW4gc3ltYm9scylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB3aWR0aCArPSBzLldpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvKiogQ2FsY3VsYXRlIHRoZSBzdGFydCBhbmQgZW5kIHRpbWUgb2YgdGhpcyBzdGFmZi4gKi9cbiAgICAgICAgcHJpdmF0ZSB2b2lkIENhbGN1bGF0ZVN0YXJ0RW5kVGltZSgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHN0YXJ0dGltZSA9IGVuZHRpbWUgPSAwO1xuICAgICAgICAgICAgaWYgKHN5bWJvbHMuQ291bnQgPT0gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGFydHRpbWUgPSBzeW1ib2xzWzBdLlN0YXJ0VGltZTtcbiAgICAgICAgICAgIGZvcmVhY2ggKE11c2ljU3ltYm9sIG0gaW4gc3ltYm9scylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoZW5kdGltZSA8IG0uU3RhcnRUaW1lKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZW5kdGltZSA9IG0uU3RhcnRUaW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobSBpcyBDaG9yZFN5bWJvbClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIENob3JkU3ltYm9sIGMgPSAoQ2hvcmRTeW1ib2wpbTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVuZHRpbWUgPCBjLkVuZFRpbWUpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZHRpbWUgPSBjLkVuZFRpbWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8qKiBGdWxsLUp1c3RpZnkgdGhlIHN5bWJvbHMsIHNvIHRoYXQgdGhleSBleHBhbmQgdG8gZmlsbCB0aGUgd2hvbGUgc3RhZmYuICovXG4gICAgICAgIHByaXZhdGUgdm9pZCBGdWxsSnVzdGlmeSgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmICh3aWR0aCAhPSBTaGVldE11c2ljLlBhZ2VXaWR0aClcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIGludCB0b3RhbHdpZHRoID0ga2V5c2lnV2lkdGg7XG4gICAgICAgICAgICBpbnQgdG90YWxzeW1ib2xzID0gMDtcbiAgICAgICAgICAgIGludCBpID0gMDtcblxuICAgICAgICAgICAgd2hpbGUgKGkgPCBzeW1ib2xzLkNvdW50KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGludCBzdGFydCA9IHN5bWJvbHNbaV0uU3RhcnRUaW1lO1xuICAgICAgICAgICAgICAgIHRvdGFsc3ltYm9scysrO1xuICAgICAgICAgICAgICAgIHRvdGFsd2lkdGggKz0gc3ltYm9sc1tpXS5XaWR0aDtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGkgPCBzeW1ib2xzLkNvdW50ICYmIHN5bWJvbHNbaV0uU3RhcnRUaW1lID09IHN0YXJ0KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWx3aWR0aCArPSBzeW1ib2xzW2ldLldpZHRoO1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnQgZXh0cmF3aWR0aCA9IChTaGVldE11c2ljLlBhZ2VXaWR0aCAtIHRvdGFsd2lkdGggLSAxKSAvIHRvdGFsc3ltYm9scztcbiAgICAgICAgICAgIGlmIChleHRyYXdpZHRoID4gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0ICogMilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBleHRyYXdpZHRoID0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0ICogMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkgPSAwO1xuICAgICAgICAgICAgd2hpbGUgKGkgPCBzeW1ib2xzLkNvdW50KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGludCBzdGFydCA9IHN5bWJvbHNbaV0uU3RhcnRUaW1lO1xuICAgICAgICAgICAgICAgIHN5bWJvbHNbaV0uV2lkdGggKz0gZXh0cmF3aWR0aDtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGkgPCBzeW1ib2xzLkNvdW50ICYmIHN5bWJvbHNbaV0uU3RhcnRUaW1lID09IHN0YXJ0KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqIEFkZCB0aGUgbHlyaWMgc3ltYm9scyB0aGF0IG9jY3VyIHdpdGhpbiB0aGlzIHN0YWZmLlxuICAgICAgICAgKiAgU2V0IHRoZSB4LXBvc2l0aW9uIG9mIHRoZSBseXJpYyBzeW1ib2wuIFxuICAgICAgICAgKi9cbiAgICAgICAgcHVibGljIHZvaWQgQWRkTHlyaWNzKExpc3Q8THlyaWNTeW1ib2w+IHRyYWNrbHlyaWNzKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAodHJhY2tseXJpY3MgPT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBseXJpY3MgPSBuZXcgTGlzdDxMeXJpY1N5bWJvbD4oKTtcbiAgICAgICAgICAgIGludCB4cG9zID0gMDtcbiAgICAgICAgICAgIGludCBzeW1ib2xpbmRleCA9IDA7XG4gICAgICAgICAgICBmb3JlYWNoIChMeXJpY1N5bWJvbCBseXJpYyBpbiB0cmFja2x5cmljcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAobHlyaWMuU3RhcnRUaW1lIDwgc3RhcnR0aW1lKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChseXJpYy5TdGFydFRpbWUgPiBlbmR0aW1lKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIEdldCB0aGUgeC1wb3NpdGlvbiBvZiB0aGlzIGx5cmljICovXG4gICAgICAgICAgICAgICAgd2hpbGUgKHN5bWJvbGluZGV4IDwgc3ltYm9scy5Db3VudCAmJlxuICAgICAgICAgICAgICAgICAgICAgICBzeW1ib2xzW3N5bWJvbGluZGV4XS5TdGFydFRpbWUgPCBseXJpYy5TdGFydFRpbWUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB4cG9zICs9IHN5bWJvbHNbc3ltYm9saW5kZXhdLldpZHRoO1xuICAgICAgICAgICAgICAgICAgICBzeW1ib2xpbmRleCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBseXJpYy5YID0geHBvcztcbiAgICAgICAgICAgICAgICBpZiAoc3ltYm9saW5kZXggPCBzeW1ib2xzLkNvdW50ICYmXG4gICAgICAgICAgICAgICAgICAgIChzeW1ib2xzW3N5bWJvbGluZGV4XSBpcyBCYXJTeW1ib2wpKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbHlyaWMuWCArPSBTaGVldE11c2ljLk5vdGVXaWR0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbHlyaWNzLkFkZChseXJpYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobHlyaWNzLkNvdW50ID09IDApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbHlyaWNzID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqIERyYXcgdGhlIGx5cmljcyAqL1xuICAgICAgICBwcml2YXRlIHZvaWQgRHJhd0x5cmljcyhHcmFwaGljcyBnLCBQZW4gcGVuKVxuICAgICAgICB7XG4gICAgICAgICAgICAvKiBTa2lwIHRoZSBsZWZ0IHNpZGUgQ2xlZiBzeW1ib2wgYW5kIGtleSBzaWduYXR1cmUgKi9cbiAgICAgICAgICAgIGludCB4cG9zID0ga2V5c2lnV2lkdGg7XG4gICAgICAgICAgICBpbnQgeXBvcyA9IGhlaWdodCAtIDEyO1xuXG4gICAgICAgICAgICBmb3JlYWNoIChMeXJpY1N5bWJvbCBseXJpYyBpbiBseXJpY3MpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZy5EcmF3U3RyaW5nKGx5cmljLlRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTGV0dGVyRm9udCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQnJ1c2hlcy5CbGFjayxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHBvcyArIGx5cmljLlgsIHlwb3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqIERyYXcgdGhlIG1lYXN1cmUgbnVtYmVycyBmb3IgZWFjaCBtZWFzdXJlICovXG4gICAgICAgIHByaXZhdGUgdm9pZCBEcmF3TWVhc3VyZU51bWJlcnMoR3JhcGhpY3MgZywgUGVuIHBlbilcbiAgICAgICAge1xuXG4gICAgICAgICAgICAvKiBTa2lwIHRoZSBsZWZ0IHNpZGUgQ2xlZiBzeW1ib2wgYW5kIGtleSBzaWduYXR1cmUgKi9cbiAgICAgICAgICAgIGludCB4cG9zID0ga2V5c2lnV2lkdGg7XG4gICAgICAgICAgICBpbnQgeXBvcyA9IHl0b3AgLSBTaGVldE11c2ljLk5vdGVIZWlnaHQgKiAzO1xuXG4gICAgICAgICAgICBmb3JlYWNoIChNdXNpY1N5bWJvbCBzIGluIHN5bWJvbHMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKHMgaXMgQmFyU3ltYm9sKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaW50IG1lYXN1cmUgPSAxICsgcy5TdGFydFRpbWUgLyBtZWFzdXJlTGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBnLkRyYXdTdHJpbmcoXCJcIiArIG1lYXN1cmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLkxldHRlckZvbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCcnVzaGVzLkJsYWNrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHBvcyArIFNoZWV0TXVzaWMuTm90ZVdpZHRoIC8gMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlwb3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB4cG9zICs9IHMuV2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiogRHJhdyB0aGUgbHlyaWNzICovXG5cblxuICAgICAgICAvKiogRHJhdyB0aGUgZml2ZSBob3Jpem9udGFsIGxpbmVzIG9mIHRoZSBzdGFmZiAqL1xuICAgICAgICBwcml2YXRlIHZvaWQgRHJhd0hvcml6TGluZXMoR3JhcGhpY3MgZywgUGVuIHBlbilcbiAgICAgICAge1xuICAgICAgICAgICAgaW50IGxpbmUgPSAxO1xuICAgICAgICAgICAgaW50IHkgPSB5dG9wIC0gU2hlZXRNdXNpYy5MaW5lV2lkdGg7XG4gICAgICAgICAgICBwZW4uV2lkdGggPSAxO1xuICAgICAgICAgICAgZm9yIChsaW5lID0gMTsgbGluZSA8PSA1OyBsaW5lKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZy5EcmF3TGluZShwZW4sIFNoZWV0TXVzaWMuTGVmdE1hcmdpbiwgeSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggLSAxLCB5KTtcbiAgICAgICAgICAgICAgICB5ICs9IFNoZWV0TXVzaWMuTGluZVdpZHRoICsgU2hlZXRNdXNpYy5MaW5lU3BhY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwZW4uQ29sb3IgPSBDb2xvci5CbGFjaztcblxuICAgICAgICB9XG5cbiAgICAgICAgLyoqIERyYXcgdGhlIHZlcnRpY2FsIGxpbmVzIGF0IHRoZSBmYXIgbGVmdCBhbmQgZmFyIHJpZ2h0IHNpZGVzLiAqL1xuICAgICAgICBwcml2YXRlIHZvaWQgRHJhd0VuZExpbmVzKEdyYXBoaWNzIGcsIFBlbiBwZW4pXG4gICAgICAgIHtcbiAgICAgICAgICAgIHBlbi5XaWR0aCA9IDE7XG5cbiAgICAgICAgICAgIC8qIERyYXcgdGhlIHZlcnRpY2FsIGxpbmVzIGZyb20gMCB0byB0aGUgaGVpZ2h0IG9mIHRoaXMgc3RhZmYsXG4gICAgICAgICAgICAgKiBpbmNsdWRpbmcgdGhlIHNwYWNlIGFib3ZlIGFuZCBiZWxvdyB0aGUgc3RhZmYsIHdpdGggdHdvIGV4Y2VwdGlvbnM6XG4gICAgICAgICAgICAgKiAtIElmIHRoaXMgaXMgdGhlIGZpcnN0IHRyYWNrLCBkb24ndCBzdGFydCBhYm92ZSB0aGUgc3RhZmYuXG4gICAgICAgICAgICAgKiAgIFN0YXJ0IGV4YWN0bHkgYXQgdGhlIHRvcCBvZiB0aGUgc3RhZmYgKHl0b3AgLSBMaW5lV2lkdGgpXG4gICAgICAgICAgICAgKiAtIElmIHRoaXMgaXMgdGhlIGxhc3QgdHJhY2ssIGRvbid0IGVuZCBiZWxvdyB0aGUgc3RhZmYuXG4gICAgICAgICAgICAgKiAgIEVuZCBleGFjdGx5IGF0IHRoZSBib3R0b20gb2YgdGhlIHN0YWZmLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpbnQgeXN0YXJ0LCB5ZW5kO1xuICAgICAgICAgICAgaWYgKHRyYWNrbnVtID09IDApXG4gICAgICAgICAgICAgICAgeXN0YXJ0ID0geXRvcCAtIFNoZWV0TXVzaWMuTGluZVdpZHRoO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHlzdGFydCA9IDA7XG5cbiAgICAgICAgICAgIGlmICh0cmFja251bSA9PSAodG90YWx0cmFja3MgLSAxKSlcbiAgICAgICAgICAgICAgICB5ZW5kID0geXRvcCArIDQgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgeWVuZCA9IGhlaWdodDtcblxuICAgICAgICAgICAgZy5EcmF3TGluZShwZW4sIFNoZWV0TXVzaWMuTGVmdE1hcmdpbiwgeXN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTGVmdE1hcmdpbiwgeWVuZCk7XG5cbiAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuLCB3aWR0aCAtIDEsIHlzdGFydCwgd2lkdGggLSAxLCB5ZW5kKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLyoqIERyYXcgdGhpcyBzdGFmZi4gT25seSBkcmF3IHRoZSBzeW1ib2xzIGluc2lkZSB0aGUgY2xpcCBhcmVhICovXG4gICAgICAgIHB1YmxpYyB2b2lkIERyYXcoR3JhcGhpY3MgZywgUmVjdGFuZ2xlIGNsaXAsIFBlbiBwZW4sIGludCBzZWxlY3Rpb25TdGFydFB1bHNlLCBpbnQgc2VsZWN0aW9uRW5kUHVsc2UsIEJydXNoIGRlc2VsZWN0ZWRCcnVzaClcbiAgICAgICAge1xuICAgICAgICAgICAgLyogU2hhZGUgYW55IGRlc2VsZWN0ZWQgYXJlYXMgKi9cbiAgICAgICAgICAgIFNoYWRlU2VsZWN0aW9uQmFja2dyb3VuZChnLCBjbGlwLCBzZWxlY3Rpb25TdGFydFB1bHNlLCBzZWxlY3Rpb25FbmRQdWxzZSwgZGVzZWxlY3RlZEJydXNoKTtcblxuICAgICAgICAgICAgaW50IHhwb3MgPSBTaGVldE11c2ljLkxlZnRNYXJnaW4gKyA1O1xuXG4gICAgICAgICAgICAvKiBEcmF3IHRoZSBsZWZ0IHNpZGUgQ2xlZiBzeW1ib2wgKi9cbiAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKHhwb3MsIDApO1xuICAgICAgICAgICAgY2xlZnN5bS5EcmF3KGcsIHBlbiwgeXRvcCk7XG4gICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgteHBvcywgMCk7XG4gICAgICAgICAgICB4cG9zICs9IGNsZWZzeW0uV2lkdGg7XG5cbiAgICAgICAgICAgIC8qIERyYXcgdGhlIGtleSBzaWduYXR1cmUgKi9cbiAgICAgICAgICAgIGZvcmVhY2ggKEFjY2lkU3ltYm9sIGEgaW4ga2V5cylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSh4cG9zLCAwKTtcbiAgICAgICAgICAgICAgICBhLkRyYXcoZywgcGVuLCB5dG9wKTtcbiAgICAgICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgteHBvcywgMCk7XG4gICAgICAgICAgICAgICAgeHBvcyArPSBhLldpZHRoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBEcmF3IHRoZSBhY3R1YWwgbm90ZXMsIHJlc3RzLCBiYXJzLiAgRHJhdyB0aGUgc3ltYm9scyBvbmUgXG4gICAgICAgICAgICAgKiBhZnRlciBhbm90aGVyLCB1c2luZyB0aGUgc3ltYm9sIHdpZHRoIHRvIGRldGVybWluZSB0aGVcbiAgICAgICAgICAgICAqIHggcG9zaXRpb24gb2YgdGhlIG5leHQgc3ltYm9sLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEZvciBmYXN0IHBlcmZvcm1hbmNlLCBvbmx5IGRyYXcgc3ltYm9scyB0aGF0IGFyZSBpbiB0aGUgY2xpcCBhcmVhLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmb3JlYWNoIChNdXNpY1N5bWJvbCBzIGluIHN5bWJvbHMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKEluc2lkZUNsaXBwaW5nKGNsaXAsIHhwb3MsIHMpKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oeHBvcywgMCk7XG4gICAgICAgICAgICAgICAgICAgIHMuRHJhdyhnLCBwZW4sIHl0b3ApO1xuICAgICAgICAgICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgteHBvcywgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHhwb3MgKz0gcy5XaWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIERyYXdIb3JpekxpbmVzKGcsIHBlbik7XG4gICAgICAgICAgICBEcmF3RW5kTGluZXMoZywgcGVuKTtcblxuICAgICAgICAgICAgaWYgKHNob3dNZWFzdXJlcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBEcmF3TWVhc3VyZU51bWJlcnMoZywgcGVuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChseXJpY3MgIT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBEcmF3THlyaWNzKGcsIHBlbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBcbiAgICAgICAgICogSWYgYSBzZWxlY3Rpb24gaGFzIGJlZW4gc3BlY2lmaWVkLCBzaGFkZSBhbGwgYXJlYXMgdGhhdCBhcmVuJ3QgaW4gdGhlIHNlbGVjdGlvblxuICAgICAgICAqL1xuICAgICAgICBwcml2YXRlIHZvaWQgU2hhZGVTZWxlY3Rpb25CYWNrZ3JvdW5kKEdyYXBoaWNzIGcsIFJlY3RhbmdsZSBjbGlwLCBpbnQgc2VsZWN0aW9uU3RhcnRQdWxzZSwgaW50IHNlbGVjdGlvbkVuZFB1bHNlLCBCcnVzaCBkZXNlbGVjdGVkQnJ1c2gpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmIChzZWxlY3Rpb25FbmRQdWxzZSA9PSAwKSByZXR1cm47XG5cbiAgICAgICAgICAgIGludCB4cG9zID0ga2V5c2lnV2lkdGg7XG4gICAgICAgICAgICBib29sIGxhc3RTdGF0ZUZpbGwgPSBmYWxzZTtcbiAgICAgICAgICAgIGZvcmVhY2ggKE11c2ljU3ltYm9sIHMgaW4gc3ltYm9scylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoSW5zaWRlQ2xpcHBpbmcoY2xpcCwgeHBvcywgcykgJiYgKHMuU3RhcnRUaW1lIDwgc2VsZWN0aW9uU3RhcnRQdWxzZSB8fCBzLlN0YXJ0VGltZSA+IHNlbGVjdGlvbkVuZFB1bHNlKSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKHhwb3MgLSAyLCAtMik7XG4gICAgICAgICAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShkZXNlbGVjdGVkQnJ1c2gsIDAsIDAsIHMuV2lkdGggKyA0LCB0aGlzLkhlaWdodCArIDQpO1xuICAgICAgICAgICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgtKHhwb3MgLSAyKSwgMik7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RTdGF0ZUZpbGwgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYXN0U3RhdGVGaWxsID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHhwb3MgKz0gcy5XaWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChsYXN0U3RhdGVGaWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIC8vc2hhZGUgdGhlIHJlc3Qgb2YgdGhlIHN0YWZmIGlmIHRoZSBwcmV2aW91cyBzeW1ib2wgd2FzIHNoYWRlZFxuICAgICAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKHhwb3MgLSAyLCAtMik7XG4gICAgICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGRlc2VsZWN0ZWRCcnVzaCwgMCwgMCwgd2lkdGggLSB4cG9zLCB0aGlzLkhlaWdodCArIDQpO1xuICAgICAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC0oeHBvcyAtIDIpLCAyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgc3RhdGljIGJvb2wgSW5zaWRlQ2xpcHBpbmcoUmVjdGFuZ2xlIGNsaXAsIGludCB4cG9zLCBNdXNpY1N5bWJvbCBzKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gKHhwb3MgPD0gY2xpcC5YICsgY2xpcC5XaWR0aCArIDUwKSAmJiAoeHBvcyArIHMuV2lkdGggKyA1MCA+PSBjbGlwLlgpO1xuICAgICAgICB9XG5cblxuICAgICAgICAvKiogU2hhZGUgYWxsIHRoZSBjaG9yZHMgcGxheWVkIGluIHRoZSBnaXZlbiB0aW1lLlxuICAgICAgICAgKiAgVW4tc2hhZGUgYW55IGNob3JkcyBzaGFkZWQgaW4gdGhlIHByZXZpb3VzIHB1bHNlIHRpbWUuXG4gICAgICAgICAqICBTdG9yZSB0aGUgeCBjb29yZGluYXRlIGxvY2F0aW9uIHdoZXJlIHRoZSBzaGFkZSB3YXMgZHJhd24uXG4gICAgICAgICAqICBSZXR1cm5zIHRoZSB3aWR0aCBvZiB0aGUgc2hhZGVkIHJlY3RhbmdsZVxuICAgICAgICAgKi9cbiAgICAgICAgcHVibGljIGludCBTaGFkZU5vdGVzKEdyYXBoaWNzIGcsIFNvbGlkQnJ1c2ggc2hhZGVCcnVzaCwgUGVuIHBlbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGludCBjdXJyZW50UHVsc2VUaW1lLCByZWYgaW50IHhfc2hhZGUpXG4gICAgICAgIHtcblxuICAgICAgICAgICAgLyogSWYgdGhlcmUncyBub3RoaW5nIHRvIHVuc2hhZGUsIG9yIHNoYWRlLCByZXR1cm4gKi9cbiAgICAgICAgICAgIGlmIChzdGFydHRpbWUgPiBjdXJyZW50UHVsc2VUaW1lIHx8IGVuZHRpbWUgPCBjdXJyZW50UHVsc2VUaW1lKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBTa2lwIHRoZSBsZWZ0IHNpZGUgQ2xlZiBzeW1ib2wgYW5kIGtleSBzaWduYXR1cmUgKi9cbiAgICAgICAgICAgIGludCB4cG9zID0ga2V5c2lnV2lkdGg7XG5cbiAgICAgICAgICAgIE11c2ljU3ltYm9sIGN1cnIgPSBudWxsO1xuXG4gICAgICAgICAgICAvKiBMb29wIHRocm91Z2ggdGhlIHN5bWJvbHMuIFxuICAgICAgICAgICAgICogVW5zaGFkZSBzeW1ib2xzIHdoZXJlIHN0YXJ0IDw9IHByZXZQdWxzZVRpbWUgPCBlbmRcbiAgICAgICAgICAgICAqIFNoYWRlIHN5bWJvbHMgd2hlcmUgc3RhcnQgPD0gY3VycmVudFB1bHNlVGltZSA8IGVuZFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpbnQgd2lkdGggPSAwO1xuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCBzeW1ib2xzLkNvdW50OyBpKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3VyciA9IHN5bWJvbHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGN1cnIgaXMgQmFyU3ltYm9sKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgeHBvcyArPSBjdXJyLldpZHRoO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpbnQgc3RhcnQgPSBjdXJyLlN0YXJ0VGltZTtcbiAgICAgICAgICAgICAgICBpbnQgZW5kID0gMDtcbiAgICAgICAgICAgICAgICBpZiAoaSArIDIgPCBzeW1ib2xzLkNvdW50ICYmIHN5bWJvbHNbaSArIDFdIGlzIEJhclN5bWJvbClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGVuZCA9IHN5bWJvbHNbaSArIDJdLlN0YXJ0VGltZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaSArIDEgPCBzeW1ib2xzLkNvdW50KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZW5kID0gc3ltYm9sc1tpICsgMV0uU3RhcnRUaW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBlbmQgPSBlbmR0aW1lO1xuICAgICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAgICAgLyogSWYgd2UndmUgcGFzdCB0aGUgcHJldmlvdXMgYW5kIGN1cnJlbnQgdGltZXMsIHdlJ3JlIGRvbmUuICovXG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0ID4gY3VycmVudFB1bHNlVGltZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4X3NoYWRlID09IDApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHhfc2hhZGUgPSB4cG9zO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpZHRoO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIElmIHN5bWJvbCBpcyBpbiB0aGUgY3VycmVudCB0aW1lLCBkcmF3IGEgc2hhZGVkIGJhY2tncm91bmQgKi9cbiAgICAgICAgICAgICAgICBpZiAoKHN0YXJ0IDw9IGN1cnJlbnRQdWxzZVRpbWUpICYmIChjdXJyZW50UHVsc2VUaW1lIDwgZW5kKSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoICs9IGN1cnIuV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIHhfc2hhZGUgPSB4cG9zO1xuICAgICAgICAgICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSh4cG9zLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNoYWRlQnJ1c2guSXNDbGVhcigpKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZy5DbGVhclJlY3RhbmdsZSgwLCAwLCBjdXJyLldpZHRoLCB0aGlzLkhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoc2hhZGVCcnVzaCwgMCwgMCwgY3Vyci5XaWR0aCwgdGhpcy5IZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oLXhwb3MsIDApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHhwb3MgKz0gY3Vyci5XaWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3aWR0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBSZXR1cm4gdGhlIHB1bHNlIHRpbWUgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW4gcG9pbnQuXG4gICAgICAgICAqICBGaW5kIHRoZSBub3Rlcy9zeW1ib2xzIGNvcnJlc3BvbmRpbmcgdG8gdGhlIHggcG9zaXRpb24sXG4gICAgICAgICAqICBhbmQgcmV0dXJuIHRoZSBzdGFydFRpbWUgKHB1bHNlVGltZSkgb2YgdGhlIHN5bWJvbC5cbiAgICAgICAgICovXG4gICAgICAgIHB1YmxpYyBpbnQgUHVsc2VUaW1lRm9yUG9pbnQoUG9pbnQgcG9pbnQpXG4gICAgICAgIHtcblxuICAgICAgICAgICAgaW50IHhwb3MgPSBrZXlzaWdXaWR0aDtcbiAgICAgICAgICAgIGludCBwdWxzZVRpbWUgPSBzdGFydHRpbWU7XG4gICAgICAgICAgICBmb3JlYWNoIChNdXNpY1N5bWJvbCBzeW0gaW4gc3ltYm9scylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwdWxzZVRpbWUgPSBzeW0uU3RhcnRUaW1lO1xuICAgICAgICAgICAgICAgIGlmIChwb2ludC5YIDw9IHhwb3MgKyBzeW0uV2lkdGgpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHVsc2VUaW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB4cG9zICs9IHN5bS5XaWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwdWxzZVRpbWU7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgb3ZlcnJpZGUgc3RyaW5nIFRvU3RyaW5nKClcbiAgICAgICAge1xuICAgICAgICAgICAgc3RyaW5nIHJlc3VsdCA9IFwiU3RhZmYgY2xlZj1cIiArIGNsZWZzeW0uVG9TdHJpbmcoKSArIFwiXFxuXCI7XG4gICAgICAgICAgICByZXN1bHQgKz0gXCIgIEtleXM6XFxuXCI7XG4gICAgICAgICAgICBmb3JlYWNoIChBY2NpZFN5bWJvbCBhIGluIGtleXMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IFwiICAgIFwiICsgYS5Ub1N0cmluZygpICsgXCJcXG5cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdCArPSBcIiAgU3ltYm9sczpcXG5cIjtcbiAgICAgICAgICAgIGZvcmVhY2ggKE11c2ljU3ltYm9sIHMgaW4ga2V5cylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gXCIgICAgXCIgKyBzLlRvU3RyaW5nKCkgKyBcIlxcblwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yZWFjaCAoTXVzaWNTeW1ib2wgbSBpbiBzeW1ib2xzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBcIiAgICBcIiArIG0uVG9TdHJpbmcoKSArIFwiXFxuXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQgKz0gXCJFbmQgU3RhZmZcXG5cIjtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgIH1cbn1cblxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAwNy0yMDExIE1hZGhhdiBWYWlkeWFuYXRoYW5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuXG51c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uSU87XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xuXG4vKiogQGNsYXNzIFN0ZW1cbiAqIFRoZSBTdGVtIGNsYXNzIGlzIHVzZWQgYnkgQ2hvcmRTeW1ib2wgdG8gZHJhdyB0aGUgc3RlbSBwb3J0aW9uIG9mXG4gKiB0aGUgY2hvcmQuICBUaGUgc3RlbSBoYXMgdGhlIGZvbGxvd2luZyBmaWVsZHM6XG4gKlxuICogZHVyYXRpb24gIC0gVGhlIGR1cmF0aW9uIG9mIHRoZSBzdGVtLlxuICogZGlyZWN0aW9uIC0gRWl0aGVyIFVwIG9yIERvd25cbiAqIHNpZGUgICAgICAtIEVpdGhlciBsZWZ0IG9yIHJpZ2h0XG4gKiB0b3AgICAgICAgLSBUaGUgdG9wbW9zdCBub3RlIGluIHRoZSBjaG9yZFxuICogYm90dG9tICAgIC0gVGhlIGJvdHRvbW1vc3Qgbm90ZSBpbiB0aGUgY2hvcmRcbiAqIGVuZCAgICAgICAtIFRoZSBub3RlIHBvc2l0aW9uIHdoZXJlIHRoZSBzdGVtIGVuZHMuICBUaGlzIGlzIHVzdWFsbHlcbiAqICAgICAgICAgICAgIHNpeCBub3RlcyBwYXN0IHRoZSBsYXN0IG5vdGUgaW4gdGhlIGNob3JkLiAgRm9yIDh0aC8xNnRoXG4gKiAgICAgICAgICAgICBub3RlcywgdGhlIHN0ZW0gbXVzdCBleHRlbmQgZXZlbiBtb3JlLlxuICpcbiAqIFRoZSBTaGVldE11c2ljIGNsYXNzIGNhbiBjaGFuZ2UgdGhlIGRpcmVjdGlvbiBvZiBhIHN0ZW0gYWZ0ZXIgaXRcbiAqIGhhcyBiZWVuIGNyZWF0ZWQuICBUaGUgc2lkZSBhbmQgZW5kIGZpZWxkcyBtYXkgYWxzbyBjaGFuZ2UgZHVlIHRvXG4gKiB0aGUgZGlyZWN0aW9uIGNoYW5nZS4gIEJ1dCBvdGhlciBmaWVsZHMgd2lsbCBub3QgY2hhbmdlLlxuICovXG4gXG5wdWJsaWMgY2xhc3MgU3RlbSB7XG4gICAgcHVibGljIGNvbnN0IGludCBVcCA9ICAgMTsgICAgICAvKiBUaGUgc3RlbSBwb2ludHMgdXAgKi9cbiAgICBwdWJsaWMgY29uc3QgaW50IERvd24gPSAyOyAgICAgIC8qIFRoZSBzdGVtIHBvaW50cyBkb3duICovXG4gICAgcHVibGljIGNvbnN0IGludCBMZWZ0U2lkZSA9IDE7ICAvKiBUaGUgc3RlbSBpcyB0byB0aGUgbGVmdCBvZiB0aGUgbm90ZSAqL1xuICAgIHB1YmxpYyBjb25zdCBpbnQgUmlnaHRTaWRlID0gMjsgLyogVGhlIHN0ZW0gaXMgdG8gdGhlIHJpZ2h0IG9mIHRoZSBub3RlICovXG5cbiAgICBwcml2YXRlIE5vdGVEdXJhdGlvbiBkdXJhdGlvbjsgLyoqIER1cmF0aW9uIG9mIHRoZSBzdGVtLiAqL1xuICAgIHByaXZhdGUgaW50IGRpcmVjdGlvbjsgICAgICAgICAvKiogVXAsIERvd24sIG9yIE5vbmUgKi9cbiAgICBwcml2YXRlIFdoaXRlTm90ZSB0b3A7ICAgICAgICAgLyoqIFRvcG1vc3Qgbm90ZSBpbiBjaG9yZCAqL1xuICAgIHByaXZhdGUgV2hpdGVOb3RlIGJvdHRvbTsgICAgICAvKiogQm90dG9tbW9zdCBub3RlIGluIGNob3JkICovXG4gICAgcHJpdmF0ZSBXaGl0ZU5vdGUgZW5kOyAgICAgICAgIC8qKiBMb2NhdGlvbiBvZiBlbmQgb2YgdGhlIHN0ZW0gKi9cbiAgICBwcml2YXRlIGJvb2wgbm90ZXNvdmVybGFwOyAgICAgLyoqIERvIHRoZSBjaG9yZCBub3RlcyBvdmVybGFwICovXG4gICAgcHJpdmF0ZSBpbnQgc2lkZTsgICAgICAgICAgICAgIC8qKiBMZWZ0IHNpZGUgb3IgcmlnaHQgc2lkZSBvZiBub3RlICovXG5cbiAgICBwcml2YXRlIFN0ZW0gcGFpcjsgICAgICAgICAgICAgIC8qKiBJZiBwYWlyICE9IG51bGwsIHRoaXMgaXMgYSBob3Jpem9udGFsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogYmVhbSBzdGVtIHRvIGFub3RoZXIgY2hvcmQgKi9cbiAgICBwcml2YXRlIGludCB3aWR0aF90b19wYWlyOyAgICAgIC8qKiBUaGUgd2lkdGggKGluIHBpeGVscykgdG8gdGhlIGNob3JkIHBhaXIgKi9cbiAgICBwcml2YXRlIGJvb2wgcmVjZWl2ZXJfaW5fcGFpcjsgIC8qKiBUaGlzIHN0ZW0gaXMgdGhlIHJlY2VpdmVyIG9mIGEgaG9yaXpvbnRhbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBiZWFtIHN0ZW0gZnJvbSBhbm90aGVyIGNob3JkLiAqL1xuXG4gICAgLyoqIEdldC9TZXQgdGhlIGRpcmVjdGlvbiBvZiB0aGUgc3RlbSAoVXAgb3IgRG93bikgKi9cbiAgICBwdWJsaWMgaW50IERpcmVjdGlvbiB7XG4gICAgICAgIGdldCB7IHJldHVybiBkaXJlY3Rpb247IH1cbiAgICAgICAgc2V0IHsgQ2hhbmdlRGlyZWN0aW9uKHZhbHVlKTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIGR1cmF0aW9uIG9mIHRoZSBzdGVtIChFaWd0aCwgU2l4dGVlbnRoLCBUaGlydHlTZWNvbmQpICovXG4gICAgcHVibGljIE5vdGVEdXJhdGlvbiBEdXJhdGlvbiB7XG4gICAgICAgIGdldCB7IHJldHVybiBkdXJhdGlvbjsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIHRvcCBub3RlIGluIHRoZSBjaG9yZC4gVGhpcyBpcyBuZWVkZWQgdG8gZGV0ZXJtaW5lIHRoZSBzdGVtIGRpcmVjdGlvbiAqL1xuICAgIHB1YmxpYyBXaGl0ZU5vdGUgVG9wIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHRvcDsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIGJvdHRvbSBub3RlIGluIHRoZSBjaG9yZC4gVGhpcyBpcyBuZWVkZWQgdG8gZGV0ZXJtaW5lIHRoZSBzdGVtIGRpcmVjdGlvbiAqL1xuICAgIHB1YmxpYyBXaGl0ZU5vdGUgQm90dG9tIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIGJvdHRvbTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQvU2V0IHRoZSBsb2NhdGlvbiB3aGVyZSB0aGUgc3RlbSBlbmRzLiAgVGhpcyBpcyB1c3VhbGx5IHNpeCBub3Rlc1xuICAgICAqIHBhc3QgdGhlIGxhc3Qgbm90ZSBpbiB0aGUgY2hvcmQuIFNlZSBtZXRob2QgQ2FsY3VsYXRlRW5kLlxuICAgICAqL1xuICAgIHB1YmxpYyBXaGl0ZU5vdGUgRW5kIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIGVuZDsgfVxuICAgICAgICBzZXQgeyBlbmQgPSB2YWx1ZTsgfVxuICAgIH1cblxuICAgIC8qKiBTZXQgdGhpcyBTdGVtIHRvIGJlIHRoZSByZWNlaXZlciBvZiBhIGhvcml6b250YWwgYmVhbSwgYXMgcGFydFxuICAgICAqIG9mIGEgY2hvcmQgcGFpci4gIEluIERyYXcoKSwgaWYgdGhpcyBzdGVtIGlzIGEgcmVjZWl2ZXIsIHdlXG4gICAgICogZG9uJ3QgZHJhdyBhIGN1cnZ5IHN0ZW0sIHdlIG9ubHkgZHJhdyB0aGUgdmVydGljYWwgbGluZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgYm9vbCBSZWNlaXZlciB7XG4gICAgICAgIGdldCB7IHJldHVybiByZWNlaXZlcl9pbl9wYWlyOyB9XG4gICAgICAgIHNldCB7IHJlY2VpdmVyX2luX3BhaXIgPSB2YWx1ZTsgfVxuICAgIH1cblxuICAgIC8qKiBDcmVhdGUgYSBuZXcgc3RlbS4gIFRoZSB0b3Agbm90ZSwgYm90dG9tIG5vdGUsIGFuZCBkaXJlY3Rpb24gYXJlIFxuICAgICAqIG5lZWRlZCBmb3IgZHJhd2luZyB0aGUgdmVydGljYWwgbGluZSBvZiB0aGUgc3RlbS4gIFRoZSBkdXJhdGlvbiBpcyBcbiAgICAgKiBuZWVkZWQgdG8gZHJhdyB0aGUgdGFpbCBvZiB0aGUgc3RlbS4gIFRoZSBvdmVybGFwIGJvb2xlYW4gaXMgdHJ1ZVxuICAgICAqIGlmIHRoZSBub3RlcyBpbiB0aGUgY2hvcmQgb3ZlcmxhcC4gIElmIHRoZSBub3RlcyBvdmVybGFwLCB0aGVcbiAgICAgKiBzdGVtIG11c3QgYmUgZHJhd24gb24gdGhlIHJpZ2h0IHNpZGUuXG4gICAgICovXG4gICAgcHVibGljIFN0ZW0oV2hpdGVOb3RlIGJvdHRvbSwgV2hpdGVOb3RlIHRvcCwgXG4gICAgICAgICAgICAgICAgTm90ZUR1cmF0aW9uIGR1cmF0aW9uLCBpbnQgZGlyZWN0aW9uLCBib29sIG92ZXJsYXApIHtcblxuICAgICAgICB0aGlzLnRvcCA9IHRvcDtcbiAgICAgICAgdGhpcy5ib3R0b20gPSBib3R0b207XG4gICAgICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgICAgIHRoaXMubm90ZXNvdmVybGFwID0gb3ZlcmxhcDtcbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PSBVcCB8fCBub3Rlc292ZXJsYXApXG4gICAgICAgICAgICBzaWRlID0gUmlnaHRTaWRlO1xuICAgICAgICBlbHNlIFxuICAgICAgICAgICAgc2lkZSA9IExlZnRTaWRlO1xuICAgICAgICBlbmQgPSBDYWxjdWxhdGVFbmQoKTtcbiAgICAgICAgcGFpciA9IG51bGw7XG4gICAgICAgIHdpZHRoX3RvX3BhaXIgPSAwO1xuICAgICAgICByZWNlaXZlcl9pbl9wYWlyID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqIENhbGN1bGF0ZSB0aGUgdmVydGljYWwgcG9zaXRpb24gKHdoaXRlIG5vdGUga2V5KSB3aGVyZSBcbiAgICAgKiB0aGUgc3RlbSBlbmRzIFxuICAgICAqL1xuICAgIHB1YmxpYyBXaGl0ZU5vdGUgQ2FsY3VsYXRlRW5kKCkge1xuICAgICAgICBpZiAoZGlyZWN0aW9uID09IFVwKSB7XG4gICAgICAgICAgICBXaGl0ZU5vdGUgdyA9IHRvcDtcbiAgICAgICAgICAgIHcgPSB3LkFkZCg2KTtcbiAgICAgICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uU2l4dGVlbnRoKSB7XG4gICAgICAgICAgICAgICAgdyA9IHcuQWRkKDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuICAgICAgICAgICAgICAgIHcgPSB3LkFkZCg0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRpcmVjdGlvbiA9PSBEb3duKSB7XG4gICAgICAgICAgICBXaGl0ZU5vdGUgdyA9IGJvdHRvbTtcbiAgICAgICAgICAgIHcgPSB3LkFkZCgtNik7XG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlNpeHRlZW50aCkge1xuICAgICAgICAgICAgICAgIHcgPSB3LkFkZCgtMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVGhpcnR5U2Vjb25kKSB7XG4gICAgICAgICAgICAgICAgdyA9IHcuQWRkKC00KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7ICAvKiBTaG91bGRuJ3QgaGFwcGVuICovXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogQ2hhbmdlIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHN0ZW0uICBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBieSBcbiAgICAgKiBDaG9yZFN5bWJvbC5NYWtlUGFpcigpLiAgV2hlbiB0d28gY2hvcmRzIGFyZSBqb2luZWQgYnkgYSBob3Jpem9udGFsXG4gICAgICogYmVhbSwgdGhlaXIgc3RlbXMgbXVzdCBwb2ludCBpbiB0aGUgc2FtZSBkaXJlY3Rpb24gKHVwIG9yIGRvd24pLlxuICAgICAqL1xuICAgIHB1YmxpYyB2b2lkIENoYW5nZURpcmVjdGlvbihpbnQgbmV3ZGlyZWN0aW9uKSB7XG4gICAgICAgIGRpcmVjdGlvbiA9IG5ld2RpcmVjdGlvbjtcbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PSBVcCB8fCBub3Rlc292ZXJsYXApXG4gICAgICAgICAgICBzaWRlID0gUmlnaHRTaWRlO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzaWRlID0gTGVmdFNpZGU7XG4gICAgICAgIGVuZCA9IENhbGN1bGF0ZUVuZCgpO1xuICAgIH1cblxuICAgIC8qKiBQYWlyIHRoaXMgc3RlbSB3aXRoIGFub3RoZXIgQ2hvcmQuICBJbnN0ZWFkIG9mIGRyYXdpbmcgYSBjdXJ2eSB0YWlsLFxuICAgICAqIHRoaXMgc3RlbSB3aWxsIG5vdyBoYXZlIHRvIGRyYXcgYSBiZWFtIHRvIHRoZSBnaXZlbiBzdGVtIHBhaXIuICBUaGVcbiAgICAgKiB3aWR0aCAoaW4gcGl4ZWxzKSB0byB0aGlzIHN0ZW0gcGFpciBpcyBwYXNzZWQgYXMgYXJndW1lbnQuXG4gICAgICovXG4gICAgcHVibGljIHZvaWQgU2V0UGFpcihTdGVtIHBhaXIsIGludCB3aWR0aF90b19wYWlyKSB7XG4gICAgICAgIHRoaXMucGFpciA9IHBhaXI7XG4gICAgICAgIHRoaXMud2lkdGhfdG9fcGFpciA9IHdpZHRoX3RvX3BhaXI7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB0cnVlIGlmIHRoaXMgU3RlbSBpcyBwYXJ0IG9mIGEgaG9yaXpvbnRhbCBiZWFtLiAqL1xuICAgIHB1YmxpYyBib29sIGlzQmVhbSB7XG4gICAgICAgIGdldCB7IHJldHVybiByZWNlaXZlcl9pbl9wYWlyIHx8IChwYWlyICE9IG51bGwpOyB9XG4gICAgfVxuXG4gICAgLyoqIERyYXcgdGhpcyBzdGVtLlxuICAgICAqIEBwYXJhbSB5dG9wIFRoZSB5IGxvY2F0aW9uIChpbiBwaXhlbHMpIHdoZXJlIHRoZSB0b3Agb2YgdGhlIHN0YWZmIHN0YXJ0cy5cbiAgICAgKiBAcGFyYW0gdG9wc3RhZmYgIFRoZSBub3RlIGF0IHRoZSB0b3Agb2YgdGhlIHN0YWZmLlxuICAgICAqL1xuICAgIHB1YmxpYyB2b2lkIERyYXcoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHl0b3AsIFdoaXRlTm90ZSB0b3BzdGFmZikge1xuICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLldob2xlKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIERyYXdWZXJ0aWNhbExpbmUoZywgcGVuLCB5dG9wLCB0b3BzdGFmZik7XG4gICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uUXVhcnRlciB8fCBcbiAgICAgICAgICAgIGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRRdWFydGVyIHx8IFxuICAgICAgICAgICAgZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLkhhbGYgfHxcbiAgICAgICAgICAgIGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRIYWxmIHx8XG4gICAgICAgICAgICByZWNlaXZlcl9pbl9wYWlyKSB7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYWlyICE9IG51bGwpXG4gICAgICAgICAgICBEcmF3SG9yaXpCYXJTdGVtKGcsIHBlbiwgeXRvcCwgdG9wc3RhZmYpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBEcmF3Q3VydnlTdGVtKGcsIHBlbiwgeXRvcCwgdG9wc3RhZmYpO1xuICAgIH1cblxuICAgIC8qKiBEcmF3IHRoZSB2ZXJ0aWNhbCBsaW5lIG9mIHRoZSBzdGVtIFxuICAgICAqIEBwYXJhbSB5dG9wIFRoZSB5IGxvY2F0aW9uIChpbiBwaXhlbHMpIHdoZXJlIHRoZSB0b3Agb2YgdGhlIHN0YWZmIHN0YXJ0cy5cbiAgICAgKiBAcGFyYW0gdG9wc3RhZmYgIFRoZSBub3RlIGF0IHRoZSB0b3Agb2YgdGhlIHN0YWZmLlxuICAgICAqL1xuICAgIHByaXZhdGUgdm9pZCBEcmF3VmVydGljYWxMaW5lKEdyYXBoaWNzIGcsIFBlbiBwZW4sIGludCB5dG9wLCBXaGl0ZU5vdGUgdG9wc3RhZmYpIHtcbiAgICAgICAgaW50IHhzdGFydDtcbiAgICAgICAgaWYgKHNpZGUgPT0gTGVmdFNpZGUpXG4gICAgICAgICAgICB4c3RhcnQgPSBTaGVldE11c2ljLkxpbmVTcGFjZS80ICsgMTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgeHN0YXJ0ID0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNCArIFNoZWV0TXVzaWMuTm90ZVdpZHRoO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT0gVXApIHtcbiAgICAgICAgICAgIGludCB5MSA9IHl0b3AgKyB0b3BzdGFmZi5EaXN0KGJvdHRvbSkgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQvMiBcbiAgICAgICAgICAgICAgICAgICAgICAgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQvNDtcblxuICAgICAgICAgICAgaW50IHlzdGVtID0geXRvcCArIHRvcHN0YWZmLkRpc3QoZW5kKSAqIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yO1xuXG4gICAgICAgICAgICBnLkRyYXdMaW5lKHBlbiwgeHN0YXJ0LCB5MSwgeHN0YXJ0LCB5c3RlbSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGlyZWN0aW9uID09IERvd24pIHtcbiAgICAgICAgICAgIGludCB5MSA9IHl0b3AgKyB0b3BzdGFmZi5EaXN0KHRvcCkgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQvMiBcbiAgICAgICAgICAgICAgICAgICAgICAgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG5cbiAgICAgICAgICAgIGlmIChzaWRlID09IExlZnRTaWRlKVxuICAgICAgICAgICAgICAgIHkxID0geTEgLSBTaGVldE11c2ljLk5vdGVIZWlnaHQvNDtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB5MSA9IHkxIC0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7XG5cbiAgICAgICAgICAgIGludCB5c3RlbSA9IHl0b3AgKyB0b3BzdGFmZi5EaXN0KGVuZCkgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQvMiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG5cbiAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuLCB4c3RhcnQsIHkxLCB4c3RhcnQsIHlzdGVtKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBEcmF3IGEgY3Vydnkgc3RlbSB0YWlsLiAgVGhpcyBpcyBvbmx5IHVzZWQgZm9yIHNpbmdsZSBjaG9yZHMsIG5vdCBjaG9yZCBwYWlycy5cbiAgICAgKiBAcGFyYW0geXRvcCBUaGUgeSBsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICogQHBhcmFtIHRvcHN0YWZmICBUaGUgbm90ZSBhdCB0aGUgdG9wIG9mIHRoZSBzdGFmZi5cbiAgICAgKi9cbiAgICBwcml2YXRlIHZvaWQgRHJhd0N1cnZ5U3RlbShHcmFwaGljcyBnLCBQZW4gcGVuLCBpbnQgeXRvcCwgV2hpdGVOb3RlIHRvcHN0YWZmKSB7XG5cbiAgICAgICAgcGVuLldpZHRoID0gMjtcblxuICAgICAgICBpbnQgeHN0YXJ0ID0gMDtcbiAgICAgICAgaWYgKHNpZGUgPT0gTGVmdFNpZGUpXG4gICAgICAgICAgICB4c3RhcnQgPSBTaGVldE11c2ljLkxpbmVTcGFjZS80ICsgMTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgeHN0YXJ0ID0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNCArIFNoZWV0TXVzaWMuTm90ZVdpZHRoO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT0gVXApIHtcbiAgICAgICAgICAgIGludCB5c3RlbSA9IHl0b3AgKyB0b3BzdGFmZi5EaXN0KGVuZCkgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQvMjtcblxuXG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLkVpZ2h0aCB8fFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRFaWdodGggfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVHJpcGxldCB8fFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5TaXh0ZWVudGggfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVGhpcnR5U2Vjb25kKSB7XG5cbiAgICAgICAgICAgICAgICBnLkRyYXdCZXppZXIocGVuLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0LCB5c3RlbSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeXN0ZW0gKyAzKlNoZWV0TXVzaWMuTGluZVNwYWNlLzIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCArIFNoZWV0TXVzaWMuTGluZVNwYWNlKjIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5c3RlbSArIFNoZWV0TXVzaWMuTm90ZUhlaWdodCoyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQgKyBTaGVldE11c2ljLkxpbmVTcGFjZS8yLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeXN0ZW0gKyBTaGVldE11c2ljLk5vdGVIZWlnaHQqMyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB5c3RlbSArPSBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG5cbiAgICAgICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uU2l4dGVlbnRoIHx8XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuXG4gICAgICAgICAgICAgICAgZy5EcmF3QmV6aWVyKHBlbiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCwgeXN0ZW0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlzdGVtICsgMypTaGVldE11c2ljLkxpbmVTcGFjZS8yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQgKyBTaGVldE11c2ljLkxpbmVTcGFjZSoyLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeXN0ZW0gKyBTaGVldE11c2ljLk5vdGVIZWlnaHQqMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0ICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UvMiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlzdGVtICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0KjMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB5c3RlbSArPSBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuICAgICAgICAgICAgICAgIGcuRHJhd0JlemllcihwZW4sIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQsIHlzdGVtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5c3RlbSArIDMqU2hlZXRNdXNpYy5MaW5lU3BhY2UvMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0ICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UqMiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlzdGVtICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0KjIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5c3RlbSArIFNoZWV0TXVzaWMuTm90ZUhlaWdodCozKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoZGlyZWN0aW9uID09IERvd24pIHtcbiAgICAgICAgICAgIGludCB5c3RlbSA9IHl0b3AgKyB0b3BzdGFmZi5EaXN0KGVuZCkqU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuXG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLkVpZ2h0aCB8fFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRFaWdodGggfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVHJpcGxldCB8fFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5TaXh0ZWVudGggfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVGhpcnR5U2Vjb25kKSB7XG5cbiAgICAgICAgICAgICAgICBnLkRyYXdCZXppZXIocGVuLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0LCB5c3RlbSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeXN0ZW0gLSBTaGVldE11c2ljLkxpbmVTcGFjZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0ICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UqMiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlzdGVtIC0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0KjIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCArIFNoZWV0TXVzaWMuTGluZVNwYWNlLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeXN0ZW0gLSBTaGVldE11c2ljLk5vdGVIZWlnaHQqMiAtIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTGluZVNwYWNlLzIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeXN0ZW0gLT0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuXG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlNpeHRlZW50aCB8fFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5UaGlydHlTZWNvbmQpIHtcblxuICAgICAgICAgICAgICAgIGcuRHJhd0JlemllcihwZW4sIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQsIHlzdGVtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5c3RlbSAtIFNoZWV0TXVzaWMuTGluZVNwYWNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQgKyBTaGVldE11c2ljLkxpbmVTcGFjZSoyLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeXN0ZW0gLSBTaGVldE11c2ljLk5vdGVIZWlnaHQqMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHN0YXJ0ICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5c3RlbSAtIFNoZWV0TXVzaWMuTm90ZUhlaWdodCoyIC0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5MaW5lU3BhY2UvMik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHlzdGVtIC09IFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcbiAgICAgICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVGhpcnR5U2Vjb25kKSB7XG4gICAgICAgICAgICAgICAgZy5EcmF3QmV6aWVyKHBlbiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCwgeXN0ZW0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlzdGVtIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhzdGFydCArIFNoZWV0TXVzaWMuTGluZVNwYWNlKjIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5c3RlbSAtIFNoZWV0TXVzaWMuTm90ZUhlaWdodCoyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4c3RhcnQgKyBTaGVldE11c2ljLkxpbmVTcGFjZSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlzdGVtIC0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0KjIgLSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLkxpbmVTcGFjZS8yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICAgIHBlbi5XaWR0aCA9IDE7XG5cbiAgICB9XG5cbiAgICAvKiBEcmF3IGEgaG9yaXpvbnRhbCBiZWFtIHN0ZW0sIGNvbm5lY3RpbmcgdGhpcyBzdGVtIHdpdGggdGhlIFN0ZW0gcGFpci5cbiAgICAgKiBAcGFyYW0geXRvcCBUaGUgeSBsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICogQHBhcmFtIHRvcHN0YWZmICBUaGUgbm90ZSBhdCB0aGUgdG9wIG9mIHRoZSBzdGFmZi5cbiAgICAgKi9cbiAgICBwcml2YXRlIHZvaWQgRHJhd0hvcml6QmFyU3RlbShHcmFwaGljcyBnLCBQZW4gcGVuLCBpbnQgeXRvcCwgV2hpdGVOb3RlIHRvcHN0YWZmKSB7XG4gICAgICAgIHBlbi5XaWR0aCA9IFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yO1xuXG4gICAgICAgIGludCB4c3RhcnQgPSAwO1xuICAgICAgICBpbnQgeHN0YXJ0MiA9IDA7XG5cbiAgICAgICAgaWYgKHNpZGUgPT0gTGVmdFNpZGUpXG4gICAgICAgICAgICB4c3RhcnQgPSBTaGVldE11c2ljLkxpbmVTcGFjZS80ICsgMTtcbiAgICAgICAgZWxzZSBpZiAoc2lkZSA9PSBSaWdodFNpZGUpXG4gICAgICAgICAgICB4c3RhcnQgPSBTaGVldE11c2ljLkxpbmVTcGFjZS80ICsgU2hlZXRNdXNpYy5Ob3RlV2lkdGg7XG5cbiAgICAgICAgaWYgKHBhaXIuc2lkZSA9PSBMZWZ0U2lkZSlcbiAgICAgICAgICAgIHhzdGFydDIgPSBTaGVldE11c2ljLkxpbmVTcGFjZS80ICsgMTtcbiAgICAgICAgZWxzZSBpZiAocGFpci5zaWRlID09IFJpZ2h0U2lkZSlcbiAgICAgICAgICAgIHhzdGFydDIgPSBTaGVldE11c2ljLkxpbmVTcGFjZS80ICsgU2hlZXRNdXNpYy5Ob3RlV2lkdGg7XG5cblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09IFVwKSB7XG4gICAgICAgICAgICBpbnQgeGVuZCA9IHdpZHRoX3RvX3BhaXIgKyB4c3RhcnQyO1xuICAgICAgICAgICAgaW50IHlzdGFydCA9IHl0b3AgKyB0b3BzdGFmZi5EaXN0KGVuZCkgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQvMjtcbiAgICAgICAgICAgIGludCB5ZW5kID0geXRvcCArIHRvcHN0YWZmLkRpc3QocGFpci5lbmQpICogU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7XG5cbiAgICAgICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uRWlnaHRoIHx8XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLkRvdHRlZEVpZ2h0aCB8fCBcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVHJpcGxldCB8fCBcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uU2l4dGVlbnRoIHx8XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuXG4gICAgICAgICAgICAgICAgZy5EcmF3TGluZShwZW4sIHhzdGFydCwgeXN0YXJ0LCB4ZW5kLCB5ZW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHlzdGFydCArPSBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG4gICAgICAgICAgICB5ZW5kICs9IFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcblxuICAgICAgICAgICAgLyogQSBkb3R0ZWQgZWlnaHRoIHdpbGwgY29ubmVjdCB0byBhIDE2dGggbm90ZS4gKi9cbiAgICAgICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uRG90dGVkRWlnaHRoKSB7XG4gICAgICAgICAgICAgICAgaW50IHggPSB4ZW5kIC0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICAgICAgICAgIGRvdWJsZSBzbG9wZSA9ICh5ZW5kIC0geXN0YXJ0KSAqIDEuMCAvICh4ZW5kIC0geHN0YXJ0KTtcbiAgICAgICAgICAgICAgICBpbnQgeSA9IChpbnQpKHNsb3BlICogKHggLSB4ZW5kKSArIHllbmQpOyBcblxuICAgICAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuLCB4LCB5LCB4ZW5kLCB5ZW5kKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5TaXh0ZWVudGggfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVGhpcnR5U2Vjb25kKSB7XG5cbiAgICAgICAgICAgICAgICBnLkRyYXdMaW5lKHBlbiwgeHN0YXJ0LCB5c3RhcnQsIHhlbmQsIHllbmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeXN0YXJ0ICs9IFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcbiAgICAgICAgICAgIHllbmQgKz0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuICAgICAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuLCB4c3RhcnQsIHlzdGFydCwgeGVuZCwgeWVuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGludCB4ZW5kID0gd2lkdGhfdG9fcGFpciArIHhzdGFydDI7XG4gICAgICAgICAgICBpbnQgeXN0YXJ0ID0geXRvcCArIHRvcHN0YWZmLkRpc3QoZW5kKSAqIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICAgICAgaW50IHllbmQgPSB5dG9wICsgdG9wc3RhZmYuRGlzdChwYWlyLmVuZCkgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQvMiBcbiAgICAgICAgICAgICAgICAgICAgICAgICArIFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcblxuICAgICAgICAgICAgaWYgKGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5FaWdodGggfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uRG90dGVkRWlnaHRoIHx8XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRyaXBsZXQgfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uU2l4dGVlbnRoIHx8XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuXG4gICAgICAgICAgICAgICAgZy5EcmF3TGluZShwZW4sIHhzdGFydCwgeXN0YXJ0LCB4ZW5kLCB5ZW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHlzdGFydCAtPSBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG4gICAgICAgICAgICB5ZW5kIC09IFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcblxuICAgICAgICAgICAgLyogQSBkb3R0ZWQgZWlnaHRoIHdpbGwgY29ubmVjdCB0byBhIDE2dGggbm90ZS4gKi9cbiAgICAgICAgICAgIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uRG90dGVkRWlnaHRoKSB7XG4gICAgICAgICAgICAgICAgaW50IHggPSB4ZW5kIC0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICAgICAgICAgIGRvdWJsZSBzbG9wZSA9ICh5ZW5kIC0geXN0YXJ0KSAqIDEuMCAvICh4ZW5kIC0geHN0YXJ0KTtcbiAgICAgICAgICAgICAgICBpbnQgeSA9IChpbnQpKHNsb3BlICogKHggLSB4ZW5kKSArIHllbmQpOyBcblxuICAgICAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuLCB4LCB5LCB4ZW5kLCB5ZW5kKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5TaXh0ZWVudGggfHxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uVGhpcnR5U2Vjb25kKSB7XG5cbiAgICAgICAgICAgICAgICBnLkRyYXdMaW5lKHBlbiwgeHN0YXJ0LCB5c3RhcnQsIHhlbmQsIHllbmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeXN0YXJ0IC09IFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcbiAgICAgICAgICAgIHllbmQgLT0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuICAgICAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuLCB4c3RhcnQsIHlzdGFydCwgeGVuZCwgeWVuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcGVuLldpZHRoID0gMTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb3ZlcnJpZGUgc3RyaW5nIFRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gc3RyaW5nLkZvcm1hdChcIlN0ZW0gZHVyYXRpb249ezB9IGRpcmVjdGlvbj17MX0gdG9wPXsyfSBib3R0b209ezN9IGVuZD17NH1cIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIG92ZXJsYXA9ezV9IHNpZGU9ezZ9IHdpZHRoX3RvX3BhaXI9ezd9IHJlY2VpdmVyX2luX3BhaXI9ezh9XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uLCBkaXJlY3Rpb24sIHRvcC5Ub1N0cmluZygpLCBib3R0b20uVG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kLlRvU3RyaW5nKCksIG5vdGVzb3ZlcmxhcCwgc2lkZSwgd2lkdGhfdG9fcGFpciwgcmVjZWl2ZXJfaW5fcGFpcik7XG4gICAgfVxuXG59IFxuXG5cbn1cblxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAwNy0yMDExIE1hZGhhdiBWYWlkeWFuYXRoYW5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuXG51c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uSU87XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljIHtcblxuLyoqIEBjbGFzcyBTeW1ib2xXaWR0aHNcbiAqIFRoZSBTeW1ib2xXaWR0aHMgY2xhc3MgaXMgdXNlZCB0byB2ZXJ0aWNhbGx5IGFsaWduIG5vdGVzIGluIGRpZmZlcmVudFxuICogdHJhY2tzIHRoYXQgb2NjdXIgYXQgdGhlIHNhbWUgdGltZSAodGhhdCBoYXZlIHRoZSBzYW1lIHN0YXJ0dGltZSkuXG4gKiBUaGlzIGlzIGRvbmUgYnkgdGhlIGZvbGxvd2luZzpcbiAqIC0gU3RvcmUgYSBsaXN0IG9mIGFsbCB0aGUgc3RhcnQgdGltZXMuXG4gKiAtIFN0b3JlIHRoZSB3aWR0aCBvZiBzeW1ib2xzIGZvciBlYWNoIHN0YXJ0IHRpbWUsIGZvciBlYWNoIHRyYWNrLlxuICogLSBTdG9yZSB0aGUgbWF4aW11bSB3aWR0aCBmb3IgZWFjaCBzdGFydCB0aW1lLCBhY3Jvc3MgYWxsIHRyYWNrcy5cbiAqIC0gR2V0IHRoZSBleHRyYSB3aWR0aCBuZWVkZWQgZm9yIGVhY2ggdHJhY2sgdG8gbWF0Y2ggdGhlIG1heGltdW1cbiAqICAgd2lkdGggZm9yIHRoYXQgc3RhcnQgdGltZS5cbiAqXG4gKiBTZWUgbWV0aG9kIFNoZWV0TXVzaWMuQWxpZ25TeW1ib2xzKCksIHdoaWNoIHVzZXMgdGhpcyBjbGFzcy5cbiAqL1xuXG5wdWJsaWMgY2xhc3MgU3ltYm9sV2lkdGhzIHtcblxuICAgIC8qKiBBcnJheSBvZiBtYXBzIChzdGFydHRpbWUgLT4gc3ltYm9sIHdpZHRoKSwgb25lIHBlciB0cmFjayAqL1xuICAgIHByaXZhdGUgRGljdGlvbmFyeTxpbnQsIGludD5bXSB3aWR0aHM7XG5cbiAgICAvKiogTWFwIG9mIHN0YXJ0dGltZSAtPiBtYXhpbXVtIHN5bWJvbCB3aWR0aCAqL1xuICAgIHByaXZhdGUgRGljdGlvbmFyeTxpbnQsIGludD4gbWF4d2lkdGhzO1xuXG4gICAgLyoqIEFuIGFycmF5IG9mIGFsbCB0aGUgc3RhcnR0aW1lcywgaW4gYWxsIHRyYWNrcyAqL1xuICAgIHByaXZhdGUgaW50W10gc3RhcnR0aW1lcztcblxuXG4gICAgLyoqIEluaXRpYWxpemUgdGhlIHN5bWJvbCB3aWR0aCBtYXBzLCBnaXZlbiBhbGwgdGhlIHN5bWJvbHMgaW5cbiAgICAgKiBhbGwgdGhlIHRyYWNrcywgcGx1cyB0aGUgbHlyaWNzIGluIGFsbCB0cmFja3MuXG4gICAgICovXG4gICAgcHVibGljIFN5bWJvbFdpZHRocyhMaXN0PE11c2ljU3ltYm9sPltdIHRyYWNrcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIExpc3Q8THlyaWNTeW1ib2w+W10gdHJhY2tseXJpY3MpIHtcblxuICAgICAgICAvKiBHZXQgdGhlIHN5bWJvbCB3aWR0aHMgZm9yIGFsbCB0aGUgdHJhY2tzICovXG4gICAgICAgIHdpZHRocyA9IG5ldyBEaWN0aW9uYXJ5PGludCxpbnQ+WyB0cmFja3MuTGVuZ3RoIF07XG4gICAgICAgIGZvciAoaW50IHRyYWNrID0gMDsgdHJhY2sgPCB0cmFja3MuTGVuZ3RoOyB0cmFjaysrKSB7XG4gICAgICAgICAgICB3aWR0aHNbdHJhY2tdID0gR2V0VHJhY2tXaWR0aHModHJhY2tzW3RyYWNrXSk7XG4gICAgICAgIH1cbiAgICAgICAgbWF4d2lkdGhzID0gbmV3IERpY3Rpb25hcnk8aW50LGludD4oKTtcblxuICAgICAgICAvKiBDYWxjdWxhdGUgdGhlIG1heGltdW0gc3ltYm9sIHdpZHRocyAqL1xuICAgICAgICBmb3JlYWNoIChEaWN0aW9uYXJ5PGludCxpbnQ+IGRpY3QgaW4gd2lkdGhzKSB7XG4gICAgICAgICAgICBmb3JlYWNoIChpbnQgdGltZSBpbiBkaWN0LktleXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIW1heHdpZHRocy5Db250YWluc0tleSh0aW1lKSB8fFxuICAgICAgICAgICAgICAgICAgICAobWF4d2lkdGhzW3RpbWVdIDwgZGljdFt0aW1lXSkgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgbWF4d2lkdGhzW3RpbWVdID0gZGljdFt0aW1lXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHJhY2tseXJpY3MgIT0gbnVsbCkge1xuICAgICAgICAgICAgZm9yZWFjaCAoTGlzdDxMeXJpY1N5bWJvbD4gbHlyaWNzIGluIHRyYWNrbHlyaWNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGx5cmljcyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3JlYWNoIChMeXJpY1N5bWJvbCBseXJpYyBpbiBseXJpY3MpIHtcbiAgICAgICAgICAgICAgICAgICAgaW50IHdpZHRoID0gbHlyaWMuTWluV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGludCB0aW1lID0gbHlyaWMuU3RhcnRUaW1lO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1heHdpZHRocy5Db250YWluc0tleSh0aW1lKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKG1heHdpZHRoc1t0aW1lXSA8IHdpZHRoKSApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4d2lkdGhzW3RpbWVdID0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTdG9yZSBhbGwgdGhlIHN0YXJ0IHRpbWVzIHRvIHRoZSBzdGFydHRpbWUgYXJyYXkgKi9cbiAgICAgICAgc3RhcnR0aW1lcyA9IG5ldyBpbnRbIG1heHdpZHRocy5LZXlzLkNvdW50IF07XG4gICAgICAgIG1heHdpZHRocy5LZXlzLkNvcHlUbyhzdGFydHRpbWVzLCAwKTtcbiAgICAgICAgQXJyYXkuU29ydDxpbnQ+KHN0YXJ0dGltZXMpO1xuICAgIH1cblxuICAgIC8qKiBDcmVhdGUgYSB0YWJsZSBvZiB0aGUgc3ltYm9sIHdpZHRocyBmb3IgZWFjaCBzdGFydHRpbWUgaW4gdGhlIHRyYWNrLiAqL1xuICAgIHByaXZhdGUgc3RhdGljIERpY3Rpb25hcnk8aW50LGludD4gR2V0VHJhY2tXaWR0aHMoTGlzdDxNdXNpY1N5bWJvbD4gc3ltYm9scykge1xuICAgICAgICBEaWN0aW9uYXJ5PGludCxpbnQ+IHdpZHRocyA9IG5ldyBEaWN0aW9uYXJ5PGludCxpbnQ+KCk7XG5cbiAgICAgICAgZm9yZWFjaCAoTXVzaWNTeW1ib2wgbSBpbiBzeW1ib2xzKSB7XG4gICAgICAgICAgICBpbnQgc3RhcnQgPSBtLlN0YXJ0VGltZTtcbiAgICAgICAgICAgIGludCB3ID0gbS5NaW5XaWR0aDtcblxuICAgICAgICAgICAgaWYgKG0gaXMgQmFyU3ltYm9sKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh3aWR0aHMuQ29udGFpbnNLZXkoc3RhcnQpKSB7XG4gICAgICAgICAgICAgICAgd2lkdGhzW3N0YXJ0XSArPSB3O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgd2lkdGhzW3N0YXJ0XSA9IHc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHdpZHRocztcbiAgICB9XG5cbiAgICAvKiogR2l2ZW4gYSB0cmFjayBhbmQgYSBzdGFydCB0aW1lLCByZXR1cm4gdGhlIGV4dHJhIHdpZHRoIG5lZWRlZCBzbyB0aGF0XG4gICAgICogdGhlIHN5bWJvbHMgZm9yIHRoYXQgc3RhcnQgdGltZSBhbGlnbiB3aXRoIHRoZSBvdGhlciB0cmFja3MuXG4gICAgICovXG4gICAgcHVibGljIGludCBHZXRFeHRyYVdpZHRoKGludCB0cmFjaywgaW50IHN0YXJ0KSB7XG4gICAgICAgIGlmICghd2lkdGhzW3RyYWNrXS5Db250YWluc0tleShzdGFydCkpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXh3aWR0aHNbc3RhcnRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG1heHdpZHRoc1tzdGFydF0gLSB3aWR0aHNbdHJhY2tdW3N0YXJ0XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gYW4gYXJyYXkgb2YgYWxsIHRoZSBzdGFydCB0aW1lcyBpbiBhbGwgdGhlIHRyYWNrcyAqL1xuICAgIHB1YmxpYyBpbnRbXSBTdGFydFRpbWVzIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHN0YXJ0dGltZXM7IH1cbiAgICB9XG5cblxuXG5cbn1cblxuXG59XG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTEgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyB7XG5cbi8qKiBUaGUgcG9zc2libGUgbm90ZSBkdXJhdGlvbnMgKi9cbnB1YmxpYyBlbnVtIE5vdGVEdXJhdGlvbiB7XG4gIFRoaXJ0eVNlY29uZCwgU2l4dGVlbnRoLCBUcmlwbGV0LCBFaWdodGgsXG4gIERvdHRlZEVpZ2h0aCwgUXVhcnRlciwgRG90dGVkUXVhcnRlcixcbiAgSGFsZiwgRG90dGVkSGFsZiwgV2hvbGVcbn07XG5cbi8qKiBAY2xhc3MgVGltZVNpZ25hdHVyZVxuICogVGhlIFRpbWVTaWduYXR1cmUgY2xhc3MgcmVwcmVzZW50c1xuICogLSBUaGUgdGltZSBzaWduYXR1cmUgb2YgdGhlIHNvbmcsIHN1Y2ggYXMgNC80LCAzLzQsIG9yIDYvOCB0aW1lLCBhbmRcbiAqIC0gVGhlIG51bWJlciBvZiBwdWxzZXMgcGVyIHF1YXJ0ZXIgbm90ZVxuICogLSBUaGUgbnVtYmVyIG9mIG1pY3Jvc2Vjb25kcyBwZXIgcXVhcnRlciBub3RlXG4gKlxuICogSW4gbWlkaSBmaWxlcywgYWxsIHRpbWUgaXMgbWVhc3VyZWQgaW4gXCJwdWxzZXNcIi4gIEVhY2ggbm90ZSBoYXNcbiAqIGEgc3RhcnQgdGltZSAobWVhc3VyZWQgaW4gcHVsc2VzKSwgYW5kIGEgZHVyYXRpb24gKG1lYXN1cmVkIGluIFxuICogcHVsc2VzKS4gIFRoaXMgY2xhc3MgaXMgdXNlZCBtYWlubHkgdG8gY29udmVydCBwdWxzZSBkdXJhdGlvbnNcbiAqIChsaWtlIDEyMCwgMjQwLCBldGMpIGludG8gbm90ZSBkdXJhdGlvbnMgKGhhbGYsIHF1YXJ0ZXIsIGVpZ2h0aCwgZXRjKS5cbiAqL1xuXG5wdWJsaWMgY2xhc3MgVGltZVNpZ25hdHVyZSB7XG4gICAgcHJpdmF0ZSBpbnQgbnVtZXJhdG9yOyAgICAgIC8qKiBOdW1lcmF0b3Igb2YgdGhlIHRpbWUgc2lnbmF0dXJlICovXG4gICAgcHJpdmF0ZSBpbnQgZGVub21pbmF0b3I7ICAgIC8qKiBEZW5vbWluYXRvciBvZiB0aGUgdGltZSBzaWduYXR1cmUgKi9cbiAgICBwcml2YXRlIGludCBxdWFydGVybm90ZTsgICAgLyoqIE51bWJlciBvZiBwdWxzZXMgcGVyIHF1YXJ0ZXIgbm90ZSAqL1xuICAgIHByaXZhdGUgaW50IG1lYXN1cmU7ICAgICAgICAvKiogTnVtYmVyIG9mIHB1bHNlcyBwZXIgbWVhc3VyZSAqL1xuICAgIHByaXZhdGUgaW50IHRlbXBvOyAgICAgICAgICAvKiogTnVtYmVyIG9mIG1pY3Jvc2Vjb25kcyBwZXIgcXVhcnRlciBub3RlICovXG5cbiAgICAvKiogR2V0IHRoZSBudW1lcmF0b3Igb2YgdGhlIHRpbWUgc2lnbmF0dXJlICovXG4gICAgcHVibGljIGludCBOdW1lcmF0b3Ige1xuICAgICAgICBnZXQgeyByZXR1cm4gbnVtZXJhdG9yOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgZGVub21pbmF0b3Igb2YgdGhlIHRpbWUgc2lnbmF0dXJlICovXG4gICAgcHVibGljIGludCBEZW5vbWluYXRvciB7XG4gICAgICAgIGdldCB7IHJldHVybiBkZW5vbWluYXRvcjsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBwdWxzZXMgcGVyIHF1YXJ0ZXIgbm90ZSAqL1xuICAgIHB1YmxpYyBpbnQgUXVhcnRlciB7XG4gICAgICAgIGdldCB7IHJldHVybiBxdWFydGVybm90ZTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBwdWxzZXMgcGVyIG1lYXN1cmUgKi9cbiAgICBwdWJsaWMgaW50IE1lYXN1cmUge1xuICAgICAgICBnZXQgeyByZXR1cm4gbWVhc3VyZTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBtaWNyb3NlY29uZHMgcGVyIHF1YXJ0ZXIgbm90ZSAqLyBcbiAgICBwdWJsaWMgaW50IFRlbXBvIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHRlbXBvOyB9XG4gICAgfVxuXG4gICAgLyoqIENyZWF0ZSBhIG5ldyB0aW1lIHNpZ25hdHVyZSwgd2l0aCB0aGUgZ2l2ZW4gbnVtZXJhdG9yLFxuICAgICAqIGRlbm9taW5hdG9yLCBwdWxzZXMgcGVyIHF1YXJ0ZXIgbm90ZSwgYW5kIHRlbXBvLlxuICAgICAqL1xuICAgIHB1YmxpYyBUaW1lU2lnbmF0dXJlKGludCBudW1lcmF0b3IsIGludCBkZW5vbWluYXRvciwgaW50IHF1YXJ0ZXJub3RlLCBpbnQgdGVtcG8pIHtcbiAgICAgICAgaWYgKG51bWVyYXRvciA8PSAwIHx8IGRlbm9taW5hdG9yIDw9IDAgfHwgcXVhcnRlcm5vdGUgPD0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1pZGlGaWxlRXhjZXB0aW9uKFwiSW52YWxpZCB0aW1lIHNpZ25hdHVyZVwiLCAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIE1pZGkgRmlsZSBnaXZlcyB3cm9uZyB0aW1lIHNpZ25hdHVyZSBzb21ldGltZXMgKi9cbiAgICAgICAgaWYgKG51bWVyYXRvciA9PSA1KSB7XG4gICAgICAgICAgICBudW1lcmF0b3IgPSA0O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5udW1lcmF0b3IgPSBudW1lcmF0b3I7XG4gICAgICAgIHRoaXMuZGVub21pbmF0b3IgPSBkZW5vbWluYXRvcjtcbiAgICAgICAgdGhpcy5xdWFydGVybm90ZSA9IHF1YXJ0ZXJub3RlO1xuICAgICAgICB0aGlzLnRlbXBvID0gdGVtcG87XG5cbiAgICAgICAgaW50IGJlYXQ7XG4gICAgICAgIGlmIChkZW5vbWluYXRvciA8IDQpXG4gICAgICAgICAgICBiZWF0ID0gcXVhcnRlcm5vdGUgKiAyO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBiZWF0ID0gcXVhcnRlcm5vdGUgLyAoZGVub21pbmF0b3IvNCk7XG5cbiAgICAgICAgbWVhc3VyZSA9IG51bWVyYXRvciAqIGJlYXQ7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB3aGljaCBtZWFzdXJlIHRoZSBnaXZlbiB0aW1lIChpbiBwdWxzZXMpIGJlbG9uZ3MgdG8uICovXG4gICAgcHVibGljIGludCBHZXRNZWFzdXJlKGludCB0aW1lKSB7XG4gICAgICAgIHJldHVybiB0aW1lIC8gbWVhc3VyZTtcbiAgICB9XG5cbiAgICAvKiogR2l2ZW4gYSBkdXJhdGlvbiBpbiBwdWxzZXMsIHJldHVybiB0aGUgY2xvc2VzdCBub3RlIGR1cmF0aW9uLiAqL1xuICAgIHB1YmxpYyBOb3RlRHVyYXRpb24gR2V0Tm90ZUR1cmF0aW9uKGludCBkdXJhdGlvbikge1xuICAgICAgICBpbnQgd2hvbGUgPSBxdWFydGVybm90ZSAqIDQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAxICAgICAgID0gMzIvMzJcbiAgICAgICAgIDMvNCAgICAgPSAyNC8zMlxuICAgICAgICAgMS8yICAgICA9IDE2LzMyXG4gICAgICAgICAzLzggICAgID0gMTIvMzJcbiAgICAgICAgIDEvNCAgICAgPSAgOC8zMlxuICAgICAgICAgMy8xNiAgICA9ICA2LzMyXG4gICAgICAgICAxLzggICAgID0gIDQvMzIgPSAgICA4LzY0XG4gICAgICAgICB0cmlwbGV0ICAgICAgICAgPSA1LjMzLzY0XG4gICAgICAgICAxLzE2ICAgID0gIDIvMzIgPSAgICA0LzY0XG4gICAgICAgICAxLzMyICAgID0gIDEvMzIgPSAgICAyLzY0XG4gICAgICAgICAqKi8gXG5cbiAgICAgICAgaWYgICAgICAoZHVyYXRpb24gPj0gMjgqd2hvbGUvMzIpXG4gICAgICAgICAgICByZXR1cm4gTm90ZUR1cmF0aW9uLldob2xlO1xuICAgICAgICBlbHNlIGlmIChkdXJhdGlvbiA+PSAyMCp3aG9sZS8zMikgXG4gICAgICAgICAgICByZXR1cm4gTm90ZUR1cmF0aW9uLkRvdHRlZEhhbGY7XG4gICAgICAgIGVsc2UgaWYgKGR1cmF0aW9uID49IDE0Kndob2xlLzMyKVxuICAgICAgICAgICAgcmV0dXJuIE5vdGVEdXJhdGlvbi5IYWxmO1xuICAgICAgICBlbHNlIGlmIChkdXJhdGlvbiA+PSAxMCp3aG9sZS8zMilcbiAgICAgICAgICAgIHJldHVybiBOb3RlRHVyYXRpb24uRG90dGVkUXVhcnRlcjtcbiAgICAgICAgZWxzZSBpZiAoZHVyYXRpb24gPj0gIDcqd2hvbGUvMzIpXG4gICAgICAgICAgICByZXR1cm4gTm90ZUR1cmF0aW9uLlF1YXJ0ZXI7XG4gICAgICAgIGVsc2UgaWYgKGR1cmF0aW9uID49ICA1Kndob2xlLzMyKVxuICAgICAgICAgICAgcmV0dXJuIE5vdGVEdXJhdGlvbi5Eb3R0ZWRFaWdodGg7XG4gICAgICAgIGVsc2UgaWYgKGR1cmF0aW9uID49ICA2Kndob2xlLzY0KVxuICAgICAgICAgICAgcmV0dXJuIE5vdGVEdXJhdGlvbi5FaWdodGg7XG4gICAgICAgIGVsc2UgaWYgKGR1cmF0aW9uID49ICA1Kndob2xlLzY0KVxuICAgICAgICAgICAgcmV0dXJuIE5vdGVEdXJhdGlvbi5UcmlwbGV0O1xuICAgICAgICBlbHNlIGlmIChkdXJhdGlvbiA+PSAgMyp3aG9sZS82NClcbiAgICAgICAgICAgIHJldHVybiBOb3RlRHVyYXRpb24uU2l4dGVlbnRoO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZDtcbiAgICB9XG5cbiAgICAvKiogQ29udmVydCBhIG5vdGUgZHVyYXRpb24gaW50byBhIHN0ZW0gZHVyYXRpb24uICBEb3R0ZWQgZHVyYXRpb25zXG4gICAgICogYXJlIGNvbnZlcnRlZCBpbnRvIHRoZWlyIG5vbi1kb3R0ZWQgZXF1aXZhbGVudHMuXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBOb3RlRHVyYXRpb24gR2V0U3RlbUR1cmF0aW9uKE5vdGVEdXJhdGlvbiBkdXIpIHtcbiAgICAgICAgaWYgKGR1ciA9PSBOb3RlRHVyYXRpb24uRG90dGVkSGFsZilcbiAgICAgICAgICAgIHJldHVybiBOb3RlRHVyYXRpb24uSGFsZjtcbiAgICAgICAgZWxzZSBpZiAoZHVyID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRRdWFydGVyKVxuICAgICAgICAgICAgcmV0dXJuIE5vdGVEdXJhdGlvbi5RdWFydGVyO1xuICAgICAgICBlbHNlIGlmIChkdXIgPT0gTm90ZUR1cmF0aW9uLkRvdHRlZEVpZ2h0aClcbiAgICAgICAgICAgIHJldHVybiBOb3RlRHVyYXRpb24uRWlnaHRoO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZHVyO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdGhlIHRpbWUgcGVyaW9kIChpbiBwdWxzZXMpIHRoZSB0aGUgZ2l2ZW4gZHVyYXRpb24gc3BhbnMgKi9cbiAgICBwdWJsaWMgaW50IER1cmF0aW9uVG9UaW1lKE5vdGVEdXJhdGlvbiBkdXIpIHtcbiAgICAgICAgaW50IGVpZ2h0aCA9IHF1YXJ0ZXJub3RlLzI7XG4gICAgICAgIGludCBzaXh0ZWVudGggPSBlaWdodGgvMjtcblxuICAgICAgICBzd2l0Y2ggKGR1cikge1xuICAgICAgICAgICAgY2FzZSBOb3RlRHVyYXRpb24uV2hvbGU6ICAgICAgICAgcmV0dXJuIHF1YXJ0ZXJub3RlICogNDsgXG4gICAgICAgICAgICBjYXNlIE5vdGVEdXJhdGlvbi5Eb3R0ZWRIYWxmOiAgICByZXR1cm4gcXVhcnRlcm5vdGUgKiAzOyBcbiAgICAgICAgICAgIGNhc2UgTm90ZUR1cmF0aW9uLkhhbGY6ICAgICAgICAgIHJldHVybiBxdWFydGVybm90ZSAqIDI7IFxuICAgICAgICAgICAgY2FzZSBOb3RlRHVyYXRpb24uRG90dGVkUXVhcnRlcjogcmV0dXJuIDMqZWlnaHRoOyBcbiAgICAgICAgICAgIGNhc2UgTm90ZUR1cmF0aW9uLlF1YXJ0ZXI6ICAgICAgIHJldHVybiBxdWFydGVybm90ZTsgXG4gICAgICAgICAgICBjYXNlIE5vdGVEdXJhdGlvbi5Eb3R0ZWRFaWdodGg6ICByZXR1cm4gMypzaXh0ZWVudGg7XG4gICAgICAgICAgICBjYXNlIE5vdGVEdXJhdGlvbi5FaWdodGg6ICAgICAgICByZXR1cm4gZWlnaHRoO1xuICAgICAgICAgICAgY2FzZSBOb3RlRHVyYXRpb24uVHJpcGxldDogICAgICAgcmV0dXJuIHF1YXJ0ZXJub3RlLzM7IFxuICAgICAgICAgICAgY2FzZSBOb3RlRHVyYXRpb24uU2l4dGVlbnRoOiAgICAgcmV0dXJuIHNpeHRlZW50aDtcbiAgICAgICAgICAgIGNhc2UgTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZDogIHJldHVybiBzaXh0ZWVudGgvMjsgXG4gICAgICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG92ZXJyaWRlIFxuICAgIHN0cmluZyBUb1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5Gb3JtYXQoXCJUaW1lU2lnbmF0dXJlPXswfS97MX0gcXVhcnRlcj17Mn0gdGVtcG89ezN9XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyYXRvciwgZGVub21pbmF0b3IsIHF1YXJ0ZXJub3RlLCB0ZW1wbyk7XG4gICAgfVxuICAgIFxufVxuXG59XG5cbiIsInVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLkxpbnE7XG51c2luZyBTeXN0ZW0uVGV4dDtcbnVzaW5nIFN5c3RlbS5UaHJlYWRpbmcuVGFza3M7XG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY0JyaWRnZS5UZXh0XG57XG4gICAgcHVibGljIGNsYXNzIEFTQ0lJXG4gICAge1xuICAgICAgICBwdWJsaWMgc3RyaW5nIEdldFN0cmluZyhieXRlW10gZGF0YSwgaW50IHN0YXJ0SW5kZXgsIGludCBsZW4pXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciB0b1JldHVybiA9IFwiXCI7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbiAmJiBpIDwgZGF0YS5MZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICB0b1JldHVybiArPSAoY2hhcilkYXRhW2kgKyBzdGFydEluZGV4XTtcbiAgICAgICAgICAgIHJldHVybiB0b1JldHVybjtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsInVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY0JyaWRnZS5UZXh0XG57XG4gICAgcHVibGljIHN0YXRpYyBjbGFzcyBFbmNvZGluZ1xuICAgIHtcbiAgICAgICAgcHVibGljIHN0YXRpYyBBU0NJSSBBU0NJSSA9IG5ldyBBU0NJSSgpO1xuICAgIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMSBNYWRoYXYgVmFpZHlhbmF0aGFuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cblxudXNpbmcgU3lzdGVtO1xudXNpbmcgU3lzdGVtLklPO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG51c2luZyBTeXN0ZW0uVGV4dDtcblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljIHtcblxuXG4vKiogQWNjaWRlbnRhbHMgKi9cbnB1YmxpYyBlbnVtIEFjY2lkIHtcbiAgICBOb25lLCBTaGFycCwgRmxhdCwgTmF0dXJhbFxufVxuXG4vKiogQGNsYXNzIEFjY2lkU3ltYm9sXG4gKiBBbiBhY2NpZGVudGFsIChhY2NpZCkgc3ltYm9sIHJlcHJlc2VudHMgYSBzaGFycCwgZmxhdCwgb3IgbmF0dXJhbFxuICogYWNjaWRlbnRhbCB0aGF0IGlzIGRpc3BsYXllZCBhdCBhIHNwZWNpZmljIHBvc2l0aW9uIChub3RlIGFuZCBjbGVmKS5cbiAqL1xucHVibGljIGNsYXNzIEFjY2lkU3ltYm9sIDogTXVzaWNTeW1ib2wge1xuICAgIHByaXZhdGUgQWNjaWQgYWNjaWQ7ICAgICAgICAgIC8qKiBUaGUgYWNjaWRlbnRhbCAoc2hhcnAsIGZsYXQsIG5hdHVyYWwpICovXG4gICAgcHJpdmF0ZSBXaGl0ZU5vdGUgd2hpdGVub3RlOyAgLyoqIFRoZSB3aGl0ZSBub3RlIHdoZXJlIHRoZSBzeW1ib2wgb2NjdXJzICovXG4gICAgcHJpdmF0ZSBDbGVmIGNsZWY7ICAgICAgICAgICAgLyoqIFdoaWNoIGNsZWYgdGhlIHN5bWJvbHMgaXMgaW4gKi9cbiAgICBwcml2YXRlIGludCB3aWR0aDsgICAgICAgICAgICAvKiogV2lkdGggb2Ygc3ltYm9sICovXG5cbiAgICAvKiogXG4gICAgICogQ3JlYXRlIGEgbmV3IEFjY2lkU3ltYm9sIHdpdGggdGhlIGdpdmVuIGFjY2lkZW50YWwsIHRoYXQgaXNcbiAgICAgKiBkaXNwbGF5ZWQgYXQgdGhlIGdpdmVuIG5vdGUgaW4gdGhlIGdpdmVuIGNsZWYuXG4gICAgICovXG4gICAgcHVibGljIEFjY2lkU3ltYm9sKEFjY2lkIGFjY2lkLCBXaGl0ZU5vdGUgbm90ZSwgQ2xlZiBjbGVmKSB7XG4gICAgICAgIHRoaXMuYWNjaWQgPSBhY2NpZDtcbiAgICAgICAgdGhpcy53aGl0ZW5vdGUgPSBub3RlO1xuICAgICAgICB0aGlzLmNsZWYgPSBjbGVmO1xuICAgICAgICB3aWR0aCA9IE1pbldpZHRoO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdGhlIHdoaXRlIG5vdGUgdGhpcyBhY2NpZGVudGFsIGlzIGRpc3BsYXllZCBhdCAqL1xuICAgIHB1YmxpYyBXaGl0ZU5vdGUgTm90ZSAge1xuICAgICAgICBnZXQgeyByZXR1cm4gd2hpdGVub3RlOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgdGltZSAoaW4gcHVsc2VzKSB0aGlzIHN5bWJvbCBvY2N1cnMgYXQuXG4gICAgICogTm90IHVzZWQuICBJbnN0ZWFkLCB0aGUgU3RhcnRUaW1lIG9mIHRoZSBDaG9yZFN5bWJvbCBjb250YWluaW5nIHRoaXNcbiAgICAgKiBBY2NpZFN5bWJvbCBpcyB1c2VkLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgU3RhcnRUaW1lIHsgXG4gICAgICAgIGdldCB7IHJldHVybiAtMTsgfSAgXG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbWluaW11bSB3aWR0aCAoaW4gcGl4ZWxzKSBuZWVkZWQgdG8gZHJhdyB0aGlzIHN5bWJvbCAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgTWluV2lkdGggeyBcbiAgICAgICAgZ2V0IHsgcmV0dXJuIDMqU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7IH1cbiAgICB9XG5cbiAgICAvKiogR2V0L1NldCB0aGUgd2lkdGggKGluIHBpeGVscykgb2YgdGhpcyBzeW1ib2wuIFRoZSB3aWR0aCBpcyBzZXRcbiAgICAgKiBpbiBTaGVldE11c2ljLkFsaWduU3ltYm9scygpIHRvIHZlcnRpY2FsbHkgYWxpZ24gc3ltYm9scy5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IFdpZHRoIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHdpZHRoOyB9XG4gICAgICAgIHNldCB7IHdpZHRoID0gdmFsdWU7IH1cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBudW1iZXIgb2YgcGl4ZWxzIHRoaXMgc3ltYm9sIGV4dGVuZHMgYWJvdmUgdGhlIHN0YWZmLiBVc2VkXG4gICAgICogIHRvIGRldGVybWluZSB0aGUgbWluaW11bSBoZWlnaHQgbmVlZGVkIGZvciB0aGUgc3RhZmYgKFN0YWZmLkZpbmRCb3VuZHMpLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgQWJvdmVTdGFmZiB7XG4gICAgICAgIGdldCB7IHJldHVybiBHZXRBYm92ZVN0YWZmKCk7IH1cbiAgICB9XG5cbiAgICBpbnQgR2V0QWJvdmVTdGFmZigpIHtcbiAgICAgICAgaW50IGRpc3QgPSBXaGl0ZU5vdGUuVG9wKGNsZWYpLkRpc3Qod2hpdGVub3RlKSAqIFxuICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yO1xuICAgICAgICBpZiAoYWNjaWQgPT0gQWNjaWQuU2hhcnAgfHwgYWNjaWQgPT0gQWNjaWQuTmF0dXJhbClcbiAgICAgICAgICAgIGRpc3QgLT0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICBlbHNlIGlmIChhY2NpZCA9PSBBY2NpZC5GbGF0KVxuICAgICAgICAgICAgZGlzdCAtPSAzKlNoZWV0TXVzaWMuTm90ZUhlaWdodC8yO1xuXG4gICAgICAgIGlmIChkaXN0IDwgMClcbiAgICAgICAgICAgIHJldHVybiAtZGlzdDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbnVtYmVyIG9mIHBpeGVscyB0aGlzIHN5bWJvbCBleHRlbmRzIGJlbG93IHRoZSBzdGFmZi4gVXNlZFxuICAgICAqICB0byBkZXRlcm1pbmUgdGhlIG1pbmltdW0gaGVpZ2h0IG5lZWRlZCBmb3IgdGhlIHN0YWZmIChTdGFmZi5GaW5kQm91bmRzKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IEJlbG93U3RhZmYge1xuICAgICAgICBnZXQgeyByZXR1cm4gR2V0QmVsb3dTdGFmZigpOyB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbnQgR2V0QmVsb3dTdGFmZigpIHtcbiAgICAgICAgaW50IGRpc3QgPSBXaGl0ZU5vdGUuQm90dG9tKGNsZWYpLkRpc3Qod2hpdGVub3RlKSAqIFxuICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yICsgXG4gICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICBpZiAoYWNjaWQgPT0gQWNjaWQuU2hhcnAgfHwgYWNjaWQgPT0gQWNjaWQuTmF0dXJhbCkgXG4gICAgICAgICAgICBkaXN0ICs9IFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcblxuICAgICAgICBpZiAoZGlzdCA+IDApXG4gICAgICAgICAgICByZXR1cm4gZGlzdDtcbiAgICAgICAgZWxzZSBcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIC8qKiBEcmF3IHRoZSBzeW1ib2wuXG4gICAgICogQHBhcmFtIHl0b3AgVGhlIHlsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIHZvaWQgRHJhdyhHcmFwaGljcyBnLCBQZW4gcGVuLCBpbnQgeXRvcCkge1xuICAgICAgICAvKiBBbGlnbiB0aGUgc3ltYm9sIHRvIHRoZSByaWdodCAqL1xuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybShXaWR0aCAtIE1pbldpZHRoLCAwKTtcblxuICAgICAgICAvKiBTdG9yZSB0aGUgeS1waXhlbCB2YWx1ZSBvZiB0aGUgdG9wIG9mIHRoZSB3aGl0ZW5vdGUgaW4geW5vdGUuICovXG4gICAgICAgIGludCB5bm90ZSA9IHl0b3AgKyBXaGl0ZU5vdGUuVG9wKGNsZWYpLkRpc3Qod2hpdGVub3RlKSAqIFxuICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLk5vdGVIZWlnaHQvMjtcblxuICAgICAgICBpZiAoYWNjaWQgPT0gQWNjaWQuU2hhcnApXG4gICAgICAgICAgICBEcmF3U2hhcnAoZywgcGVuLCB5bm90ZSk7XG4gICAgICAgIGVsc2UgaWYgKGFjY2lkID09IEFjY2lkLkZsYXQpXG4gICAgICAgICAgICBEcmF3RmxhdChnLCBwZW4sIHlub3RlKTtcbiAgICAgICAgZWxzZSBpZiAoYWNjaWQgPT0gQWNjaWQuTmF0dXJhbClcbiAgICAgICAgICAgIERyYXdOYXR1cmFsKGcsIHBlbiwgeW5vdGUpO1xuXG4gICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC0oV2lkdGggLSBNaW5XaWR0aCksIDApO1xuICAgIH1cblxuICAgIC8qKiBEcmF3IGEgc2hhcnAgc3ltYm9sLiBcbiAgICAgKiBAcGFyYW0geW5vdGUgVGhlIHBpeGVsIGxvY2F0aW9uIG9mIHRoZSB0b3Agb2YgdGhlIGFjY2lkZW50YWwncyBub3RlLiBcbiAgICAgKi9cbiAgICBwdWJsaWMgdm9pZCBEcmF3U2hhcnAoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHlub3RlKSB7XG5cbiAgICAgICAgLyogRHJhdyB0aGUgdHdvIHZlcnRpY2FsIGxpbmVzICovXG4gICAgICAgIGludCB5c3RhcnQgPSB5bm90ZSAtIFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcbiAgICAgICAgaW50IHllbmQgPSB5bm90ZSArIDIqU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0O1xuICAgICAgICBpbnQgeCA9IFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yO1xuICAgICAgICBwZW4uV2lkdGggPSAxO1xuICAgICAgICBnLkRyYXdMaW5lKHBlbiwgeCwgeXN0YXJ0ICsgMiwgeCwgeWVuZCk7XG4gICAgICAgIHggKz0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7XG4gICAgICAgIGcuRHJhd0xpbmUocGVuLCB4LCB5c3RhcnQsIHgsIHllbmQgLSAyKTtcblxuICAgICAgICAvKiBEcmF3IHRoZSBzbGlnaHRseSB1cHdhcmRzIGhvcml6b250YWwgbGluZXMgKi9cbiAgICAgICAgaW50IHhzdGFydCA9IFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yIC0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzQ7XG4gICAgICAgIGludCB4ZW5kID0gU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0ICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzQ7XG4gICAgICAgIHlzdGFydCA9IHlub3RlICsgU2hlZXRNdXNpYy5MaW5lV2lkdGg7XG4gICAgICAgIHllbmQgPSB5c3RhcnQgLSBTaGVldE11c2ljLkxpbmVXaWR0aCAtIFNoZWV0TXVzaWMuTGluZVNwYWNlLzQ7XG4gICAgICAgIHBlbi5XaWR0aCA9IFNoZWV0TXVzaWMuTGluZVNwYWNlLzI7XG4gICAgICAgIGcuRHJhd0xpbmUocGVuLCB4c3RhcnQsIHlzdGFydCwgeGVuZCwgeWVuZCk7XG4gICAgICAgIHlzdGFydCArPSBTaGVldE11c2ljLkxpbmVTcGFjZTtcbiAgICAgICAgeWVuZCArPSBTaGVldE11c2ljLkxpbmVTcGFjZTtcbiAgICAgICAgZy5EcmF3TGluZShwZW4sIHhzdGFydCwgeXN0YXJ0LCB4ZW5kLCB5ZW5kKTtcbiAgICAgICAgcGVuLldpZHRoID0gMTtcbiAgICB9XG5cbiAgICAvKiogRHJhdyBhIGZsYXQgc3ltYm9sLlxuICAgICAqIEBwYXJhbSB5bm90ZSBUaGUgcGl4ZWwgbG9jYXRpb24gb2YgdGhlIHRvcCBvZiB0aGUgYWNjaWRlbnRhbCdzIG5vdGUuXG4gICAgICovXG4gICAgcHVibGljIHZvaWQgRHJhd0ZsYXQoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHlub3RlKSB7XG4gICAgICAgIGludCB4ID0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNDtcblxuICAgICAgICAvKiBEcmF3IHRoZSB2ZXJ0aWNhbCBsaW5lICovXG4gICAgICAgIHBlbi5XaWR0aCA9IDE7XG4gICAgICAgIGcuRHJhd0xpbmUocGVuLCB4LCB5bm90ZSAtIFNoZWV0TXVzaWMuTm90ZUhlaWdodCAtIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yLFxuICAgICAgICAgICAgICAgICAgICAgICAgeCwgeW5vdGUgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQpO1xuXG4gICAgICAgIC8qIERyYXcgMyBiZXppZXIgY3VydmVzLlxuICAgICAgICAgKiBBbGwgMyBjdXJ2ZXMgc3RhcnQgYW5kIHN0b3AgYXQgdGhlIHNhbWUgcG9pbnRzLlxuICAgICAgICAgKiBFYWNoIHN1YnNlcXVlbnQgY3VydmUgYnVsZ2VzIG1vcmUgYW5kIG1vcmUgdG93YXJkcyBcbiAgICAgICAgICogdGhlIHRvcHJpZ2h0IGNvcm5lciwgbWFraW5nIHRoZSBjdXJ2ZSBsb29rIHRoaWNrZXJcbiAgICAgICAgICogdG93YXJkcyB0aGUgdG9wLXJpZ2h0LlxuICAgICAgICAgKi9cbiAgICAgICAgZy5EcmF3QmV6aWVyKHBlbiwgeCwgeW5vdGUgKyBTaGVldE11c2ljLkxpbmVTcGFjZS80LFxuICAgICAgICAgICAgeCArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzIsIHlub3RlIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvMixcbiAgICAgICAgICAgIHggKyBTaGVldE11c2ljLkxpbmVTcGFjZSwgeW5vdGUgKyBTaGVldE11c2ljLkxpbmVTcGFjZS8zLFxuICAgICAgICAgICAgeCwgeW5vdGUgKyBTaGVldE11c2ljLkxpbmVTcGFjZSArIFNoZWV0TXVzaWMuTGluZVdpZHRoICsgMSk7XG5cbiAgICAgICAgZy5EcmF3QmV6aWVyKHBlbiwgeCwgeW5vdGUgKyBTaGVldE11c2ljLkxpbmVTcGFjZS80LFxuICAgICAgICAgICAgeCArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzIsIHlub3RlIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvMixcbiAgICAgICAgICAgIHggKyBTaGVldE11c2ljLkxpbmVTcGFjZSArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzQsIFxuICAgICAgICAgICAgICB5bm90ZSArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzMgLSBTaGVldE11c2ljLkxpbmVTcGFjZS80LFxuICAgICAgICAgICAgeCwgeW5vdGUgKyBTaGVldE11c2ljLkxpbmVTcGFjZSArIFNoZWV0TXVzaWMuTGluZVdpZHRoICsgMSk7XG5cblxuICAgICAgICBnLkRyYXdCZXppZXIocGVuLCB4LCB5bm90ZSArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzQsXG4gICAgICAgICAgICB4ICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UvMiwgeW5vdGUgLSBTaGVldE11c2ljLkxpbmVTcGFjZS8yLFxuICAgICAgICAgICAgeCArIFNoZWV0TXVzaWMuTGluZVNwYWNlICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UvMiwgXG4gICAgICAgICAgICAgeW5vdGUgKyBTaGVldE11c2ljLkxpbmVTcGFjZS8zIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvMixcbiAgICAgICAgICAgIHgsIHlub3RlICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UgKyBTaGVldE11c2ljLkxpbmVXaWR0aCArIDEpO1xuXG5cbiAgICB9XG5cbiAgICAvKiogRHJhdyBhIG5hdHVyYWwgc3ltYm9sLlxuICAgICAqIEBwYXJhbSB5bm90ZSBUaGUgcGl4ZWwgbG9jYXRpb24gb2YgdGhlIHRvcCBvZiB0aGUgYWNjaWRlbnRhbCdzIG5vdGUuXG4gICAgICovXG4gICAgcHVibGljIHZvaWQgRHJhd05hdHVyYWwoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHlub3RlKSB7XG5cbiAgICAgICAgLyogRHJhdyB0aGUgdHdvIHZlcnRpY2FsIGxpbmVzICovXG4gICAgICAgIGludCB5c3RhcnQgPSB5bm90ZSAtIFNoZWV0TXVzaWMuTGluZVNwYWNlIC0gU2hlZXRNdXNpYy5MaW5lV2lkdGg7XG4gICAgICAgIGludCB5ZW5kID0geW5vdGUgKyBTaGVldE11c2ljLkxpbmVTcGFjZSArIFNoZWV0TXVzaWMuTGluZVdpZHRoO1xuICAgICAgICBpbnQgeCA9IFNoZWV0TXVzaWMuTGluZVNwYWNlLzI7XG4gICAgICAgIHBlbi5XaWR0aCA9IDE7XG4gICAgICAgIGcuRHJhd0xpbmUocGVuLCB4LCB5c3RhcnQsIHgsIHllbmQpO1xuICAgICAgICB4ICs9IFNoZWV0TXVzaWMuTGluZVNwYWNlIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNDtcbiAgICAgICAgeXN0YXJ0ID0geW5vdGUgLSBTaGVldE11c2ljLkxpbmVTcGFjZS80O1xuICAgICAgICB5ZW5kID0geW5vdGUgKyAyKlNoZWV0TXVzaWMuTGluZVNwYWNlICsgU2hlZXRNdXNpYy5MaW5lV2lkdGggLSBcbiAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5MaW5lU3BhY2UvNDtcbiAgICAgICAgZy5EcmF3TGluZShwZW4sIHgsIHlzdGFydCwgeCwgeWVuZCk7XG5cbiAgICAgICAgLyogRHJhdyB0aGUgc2xpZ2h0bHkgdXB3YXJkcyBob3Jpem9udGFsIGxpbmVzICovXG4gICAgICAgIGludCB4c3RhcnQgPSBTaGVldE11c2ljLkxpbmVTcGFjZS8yO1xuICAgICAgICBpbnQgeGVuZCA9IHhzdGFydCArIFNoZWV0TXVzaWMuTGluZVNwYWNlIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNDtcbiAgICAgICAgeXN0YXJ0ID0geW5vdGUgKyBTaGVldE11c2ljLkxpbmVXaWR0aDtcbiAgICAgICAgeWVuZCA9IHlzdGFydCAtIFNoZWV0TXVzaWMuTGluZVdpZHRoIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNDtcbiAgICAgICAgcGVuLldpZHRoID0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvMjtcbiAgICAgICAgZy5EcmF3TGluZShwZW4sIHhzdGFydCwgeXN0YXJ0LCB4ZW5kLCB5ZW5kKTtcbiAgICAgICAgeXN0YXJ0ICs9IFNoZWV0TXVzaWMuTGluZVNwYWNlO1xuICAgICAgICB5ZW5kICs9IFNoZWV0TXVzaWMuTGluZVNwYWNlO1xuICAgICAgICBnLkRyYXdMaW5lKHBlbiwgeHN0YXJ0LCB5c3RhcnQsIHhlbmQsIHllbmQpO1xuICAgICAgICBwZW4uV2lkdGggPSAxO1xuICAgIH1cblxuICAgIHB1YmxpYyBvdmVycmlkZSBzdHJpbmcgVG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcuRm9ybWF0KFxuICAgICAgICAgIFwiQWNjaWRTeW1ib2wgYWNjaWQ9ezB9IHdoaXRlbm90ZT17MX0gY2xlZj17Mn0gd2lkdGg9ezN9XCIsXG4gICAgICAgICAgYWNjaWQsIHdoaXRlbm90ZSwgY2xlZiwgd2lkdGgpO1xuICAgIH1cblxufVxuXG59XG5cblxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAwNy0yMDExIE1hZGhhdiBWYWlkeWFuYXRoYW5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuXG51c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uSU87XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xuXG5cbi8qKiBAY2xhc3MgQmFyU3ltYm9sXG4gKiBUaGUgQmFyU3ltYm9sIHJlcHJlc2VudHMgdGhlIHZlcnRpY2FsIGJhcnMgd2hpY2ggZGVsaW1pdCBtZWFzdXJlcy5cbiAqIFRoZSBzdGFydHRpbWUgb2YgdGhlIHN5bWJvbCBpcyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBuZXdcbiAqIG1lYXN1cmUuXG4gKi9cbnB1YmxpYyBjbGFzcyBCYXJTeW1ib2wgOiBNdXNpY1N5bWJvbCB7XG4gICAgcHJpdmF0ZSBpbnQgc3RhcnR0aW1lO1xuICAgIHByaXZhdGUgaW50IHdpZHRoO1xuXG4gICAgLyoqIENyZWF0ZSBhIEJhclN5bWJvbC4gVGhlIHN0YXJ0dGltZSBzaG91bGQgYmUgdGhlIGJlZ2lubmluZyBvZiBhIG1lYXN1cmUuICovXG4gICAgcHVibGljIEJhclN5bWJvbChpbnQgc3RhcnR0aW1lKSB7XG4gICAgICAgIHRoaXMuc3RhcnR0aW1lID0gc3RhcnR0aW1lO1xuICAgICAgICB3aWR0aCA9IE1pbldpZHRoO1xuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIHRpbWUgKGluIHB1bHNlcykgdGhpcyBzeW1ib2wgb2NjdXJzIGF0LlxuICAgICAqIFRoaXMgaXMgdXNlZCB0byBkZXRlcm1pbmUgdGhlIG1lYXN1cmUgdGhpcyBzeW1ib2wgYmVsb25ncyB0by5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IFN0YXJ0VGltZSB7XG4gICAgICAgIGdldCB7IHJldHVybiBzdGFydHRpbWU7IH1cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBtaW5pbXVtIHdpZHRoIChpbiBwaXhlbHMpIG5lZWRlZCB0byBkcmF3IHRoaXMgc3ltYm9sICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBNaW5XaWR0aCB7IFxuICAgICAgICBnZXQgeyByZXR1cm4gMiAqIFNoZWV0TXVzaWMuTGluZVNwYWNlOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldC9TZXQgdGhlIHdpZHRoIChpbiBwaXhlbHMpIG9mIHRoaXMgc3ltYm9sLiBUaGUgd2lkdGggaXMgc2V0XG4gICAgICogaW4gU2hlZXRNdXNpYy5BbGlnblN5bWJvbHMoKSB0byB2ZXJ0aWNhbGx5IGFsaWduIHN5bWJvbHMuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBXaWR0aCB7XG4gICAgICAgIGdldCB7IHJldHVybiB3aWR0aDsgfVxuICAgICAgICBzZXQgeyB3aWR0aCA9IHZhbHVlOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbnVtYmVyIG9mIHBpeGVscyB0aGlzIHN5bWJvbCBleHRlbmRzIGFib3ZlIHRoZSBzdGFmZi4gVXNlZFxuICAgICAqICB0byBkZXRlcm1pbmUgdGhlIG1pbmltdW0gaGVpZ2h0IG5lZWRlZCBmb3IgdGhlIHN0YWZmIChTdGFmZi5GaW5kQm91bmRzKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IEFib3ZlU3RhZmYgeyBcbiAgICAgICAgZ2V0IHsgcmV0dXJuIDA7IH0gXG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbnVtYmVyIG9mIHBpeGVscyB0aGlzIHN5bWJvbCBleHRlbmRzIGJlbG93IHRoZSBzdGFmZi4gVXNlZFxuICAgICAqICB0byBkZXRlcm1pbmUgdGhlIG1pbmltdW0gaGVpZ2h0IG5lZWRlZCBmb3IgdGhlIHN0YWZmIChTdGFmZi5GaW5kQm91bmRzKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IEJlbG93U3RhZmYgeyBcbiAgICAgICAgZ2V0IHsgcmV0dXJuIDA7IH1cbiAgICB9XG5cbiAgICAvKiogRHJhdyBhIHZlcnRpY2FsIGJhci5cbiAgICAgKiBAcGFyYW0geXRvcCBUaGUgeWxvY2F0aW9uIChpbiBwaXhlbHMpIHdoZXJlIHRoZSB0b3Agb2YgdGhlIHN0YWZmIHN0YXJ0cy5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgXG4gICAgdm9pZCBEcmF3KEdyYXBoaWNzIGcsIFBlbiBwZW4sIGludCB5dG9wKSB7XG4gICAgICAgIGludCB5ID0geXRvcDtcbiAgICAgICAgaW50IHllbmQgPSB5ICsgU2hlZXRNdXNpYy5MaW5lU3BhY2UqNCArIFNoZWV0TXVzaWMuTGluZVdpZHRoKjQ7XG4gICAgICAgIHBlbi5XaWR0aCA9IDE7XG4gICAgICAgIGcuRHJhd0xpbmUocGVuLCBTaGVldE11c2ljLk5vdGVXaWR0aC8yLCB5LCBcbiAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZVdpZHRoLzIsIHllbmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIG92ZXJyaWRlIHN0cmluZyBUb1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5Gb3JtYXQoXCJCYXJTeW1ib2wgc3RhcnR0aW1lPXswfSB3aWR0aD17MX1cIiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0dGltZSwgd2lkdGgpO1xuICAgIH1cbn1cblxuXG59XG5cbiIsInVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpY1xue1xuICAgIHB1YmxpYyBjbGFzcyBCaXRtYXA6SW1hZ2VcbiAgICB7XG4gICAgICAgIHB1YmxpYyBCaXRtYXAoVHlwZSB0eXBlLCBzdHJpbmcgZmlsZW5hbWUpXG4gICAgICAgIDpiYXNlKHR5cGUsZmlsZW5hbWUpe1xuICAgICAgICAgICAgXG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTEgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5JTztcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyB7XG5cblxuLyoqIEBjbGFzcyBCbGFua1N5bWJvbCBcbiAqIFRoZSBCbGFuayBzeW1ib2wgaXMgYSBtdXNpYyBzeW1ib2wgdGhhdCBkb2Vzbid0IGRyYXcgYW55dGhpbmcuICBUaGlzXG4gKiBzeW1ib2wgaXMgdXNlZCBmb3IgYWxpZ25tZW50IHB1cnBvc2VzLCB0byBhbGlnbiBub3RlcyBpbiBkaWZmZXJlbnQgXG4gKiBzdGFmZnMgd2hpY2ggb2NjdXIgYXQgdGhlIHNhbWUgdGltZS5cbiAqL1xucHVibGljIGNsYXNzIEJsYW5rU3ltYm9sIDogTXVzaWNTeW1ib2wge1xuICAgIHByaXZhdGUgaW50IHN0YXJ0dGltZTsgXG4gICAgcHJpdmF0ZSBpbnQgd2lkdGg7XG5cbiAgICAvKiogQ3JlYXRlIGEgbmV3IEJsYW5rU3ltYm9sIHdpdGggdGhlIGdpdmVuIHN0YXJ0dGltZSBhbmQgd2lkdGggKi9cbiAgICBwdWJsaWMgQmxhbmtTeW1ib2woaW50IHN0YXJ0dGltZSwgaW50IHdpZHRoKSB7XG4gICAgICAgIHRoaXMuc3RhcnR0aW1lID0gc3RhcnR0aW1lO1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgdGltZSAoaW4gcHVsc2VzKSB0aGlzIHN5bWJvbCBvY2N1cnMgYXQuXG4gICAgICogVGhpcyBpcyB1c2VkIHRvIGRldGVybWluZSB0aGUgbWVhc3VyZSB0aGlzIHN5bWJvbCBiZWxvbmdzIHRvLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgU3RhcnRUaW1lIHsgXG4gICAgICAgIGdldCB7IHJldHVybiBzdGFydHRpbWU7IH1cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBtaW5pbXVtIHdpZHRoIChpbiBwaXhlbHMpIG5lZWRlZCB0byBkcmF3IHRoaXMgc3ltYm9sICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBNaW5XaWR0aCB7XG4gICAgICAgIGdldCB7IHJldHVybiAwOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldC9TZXQgdGhlIHdpZHRoIChpbiBwaXhlbHMpIG9mIHRoaXMgc3ltYm9sLiBUaGUgd2lkdGggaXMgc2V0XG4gICAgICogaW4gU2hlZXRNdXNpYy5BbGlnblN5bWJvbHMoKSB0byB2ZXJ0aWNhbGx5IGFsaWduIHN5bWJvbHMuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBXaWR0aCB7IFxuICAgICAgICBnZXQgeyByZXR1cm4gd2lkdGg7IH1cbiAgICAgICAgc2V0IHsgd2lkdGggPSB2YWx1ZTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBwaXhlbHMgdGhpcyBzeW1ib2wgZXh0ZW5kcyBhYm92ZSB0aGUgc3RhZmYuIFVzZWRcbiAgICAgKiAgdG8gZGV0ZXJtaW5lIHRoZSBtaW5pbXVtIGhlaWdodCBuZWVkZWQgZm9yIHRoZSBzdGFmZiAoU3RhZmYuRmluZEJvdW5kcykuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBBYm92ZVN0YWZmIHsgXG4gICAgICAgIGdldCB7IHJldHVybiAwOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbnVtYmVyIG9mIHBpeGVscyB0aGlzIHN5bWJvbCBleHRlbmRzIGJlbG93IHRoZSBzdGFmZi4gVXNlZFxuICAgICAqICB0byBkZXRlcm1pbmUgdGhlIG1pbmltdW0gaGVpZ2h0IG5lZWRlZCBmb3IgdGhlIHN0YWZmIChTdGFmZi5GaW5kQm91bmRzKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IEJlbG93U3RhZmYgeyBcbiAgICAgICAgZ2V0IHsgcmV0dXJuIDA7IH1cbiAgICB9XG5cbiAgICAvKiogRHJhdyBub3RoaW5nLlxuICAgICAqIEBwYXJhbSB5dG9wIFRoZSB5bG9jYXRpb24gKGluIHBpeGVscykgd2hlcmUgdGhlIHRvcCBvZiB0aGUgc3RhZmYgc3RhcnRzLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSB2b2lkIERyYXcoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHl0b3ApIHt9XG5cbiAgICBwdWJsaWMgb3ZlcnJpZGUgc3RyaW5nIFRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gc3RyaW5nLkZvcm1hdChcIkJsYW5rU3ltYm9sIHN0YXJ0dGltZT17MH0gd2lkdGg9ezF9XCIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydHRpbWUsIHdpZHRoKTtcbiAgICB9XG59XG5cblxufVxuXG5cbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMSBNYWRoYXYgVmFpZHlhbmF0aGFuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cblxudXNpbmcgU3lzdGVtO1xudXNpbmcgU3lzdGVtLklPO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG51c2luZyBTeXN0ZW0uVGV4dDtcblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljIHtcblxucHVibGljIGVudW0gU3RlbURpciB7IFVwLCBEb3duIH07XG5cbi8qKiBAY2xhc3MgTm90ZURhdGFcbiAqICBDb250YWlucyBmaWVsZHMgZm9yIGRpc3BsYXlpbmcgYSBzaW5nbGUgbm90ZSBpbiBhIGNob3JkLlxuICovXG5wdWJsaWMgY2xhc3MgTm90ZURhdGEge1xuICAgIHB1YmxpYyBpbnQgbnVtYmVyOyAgICAgICAgICAgICAvKiogVGhlIE1pZGkgbm90ZSBudW1iZXIsIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSBjb2xvciAqL1xuICAgIHB1YmxpYyBXaGl0ZU5vdGUgd2hpdGVub3RlOyAgICAvKiogVGhlIHdoaXRlIG5vdGUgbG9jYXRpb24gdG8gZHJhdyAqL1xuICAgIHB1YmxpYyBOb3RlRHVyYXRpb24gZHVyYXRpb247ICAvKiogVGhlIGR1cmF0aW9uIG9mIHRoZSBub3RlICovXG4gICAgcHVibGljIGJvb2wgbGVmdHNpZGU7ICAgICAgICAgIC8qKiBXaGV0aGVyIHRvIGRyYXcgbm90ZSB0byB0aGUgbGVmdCBvciByaWdodCBvZiB0aGUgc3RlbSAqL1xuICAgIHB1YmxpYyBBY2NpZCBhY2NpZDsgICAgICAgICAgICAvKiogVXNlZCB0byBjcmVhdGUgdGhlIEFjY2lkU3ltYm9scyBmb3IgdGhlIGNob3JkICovXG59O1xuXG4vKiogQGNsYXNzIENob3JkU3ltYm9sXG4gKiBBIGNob3JkIHN5bWJvbCByZXByZXNlbnRzIGEgZ3JvdXAgb2Ygbm90ZXMgdGhhdCBhcmUgcGxheWVkIGF0IHRoZSBzYW1lXG4gKiB0aW1lLiAgQSBjaG9yZCBpbmNsdWRlcyB0aGUgbm90ZXMsIHRoZSBhY2NpZGVudGFsIHN5bWJvbHMgZm9yIGVhY2hcbiAqIG5vdGUsIGFuZCB0aGUgc3RlbSAob3Igc3RlbXMpIHRvIHVzZS4gIEEgc2luZ2xlIGNob3JkIG1heSBoYXZlIHR3byBcbiAqIHN0ZW1zIGlmIHRoZSBub3RlcyBoYXZlIGRpZmZlcmVudCBkdXJhdGlvbnMgKGUuZy4gaWYgb25lIG5vdGUgaXMgYVxuICogcXVhcnRlciBub3RlLCBhbmQgYW5vdGhlciBpcyBhbiBlaWdodGggbm90ZSkuXG4gKi9cbnB1YmxpYyBjbGFzcyBDaG9yZFN5bWJvbCA6IE11c2ljU3ltYm9sIHtcbiAgICBwcml2YXRlIENsZWYgY2xlZjsgICAgICAgICAgICAgLyoqIFdoaWNoIGNsZWYgdGhlIGNob3JkIGlzIGJlaW5nIGRyYXduIGluICovXG4gICAgcHJpdmF0ZSBpbnQgc3RhcnR0aW1lOyAgICAgICAgIC8qKiBUaGUgdGltZSAoaW4gcHVsc2VzKSB0aGUgbm90ZXMgb2NjdXJzIGF0ICovXG4gICAgcHJpdmF0ZSBpbnQgZW5kdGltZTsgICAgICAgICAgIC8qKiBUaGUgc3RhcnR0aW1lIHBsdXMgdGhlIGxvbmdlc3Qgbm90ZSBkdXJhdGlvbiAqL1xuICAgIHByaXZhdGUgTm90ZURhdGFbXSBub3RlZGF0YTsgICAvKiogVGhlIG5vdGVzIHRvIGRyYXcgKi9cbiAgICBwcml2YXRlIEFjY2lkU3ltYm9sW10gYWNjaWRzeW1ib2xzOyAgIC8qKiBUaGUgYWNjaWRlbnRhbCBzeW1ib2xzIHRvIGRyYXcgKi9cbiAgICBwcml2YXRlIGludCB3aWR0aDsgICAgICAgICAgICAgLyoqIFRoZSB3aWR0aCBvZiB0aGUgY2hvcmQgKi9cbiAgICBwcml2YXRlIFN0ZW0gc3RlbTE7ICAgICAgICAgICAgLyoqIFRoZSBzdGVtIG9mIHRoZSBjaG9yZC4gQ2FuIGJlIG51bGwuICovXG4gICAgcHJpdmF0ZSBTdGVtIHN0ZW0yOyAgICAgICAgICAgIC8qKiBUaGUgc2Vjb25kIHN0ZW0gb2YgdGhlIGNob3JkLiBDYW4gYmUgbnVsbCAqL1xuICAgIHByaXZhdGUgYm9vbCBoYXN0d29zdGVtczsgICAgICAvKiogVHJ1ZSBpZiB0aGlzIGNob3JkIGhhcyB0d28gc3RlbXMgKi9cbiAgICBwcml2YXRlIFNoZWV0TXVzaWMgc2hlZXRtdXNpYzsgLyoqIFVzZWQgdG8gZ2V0IGNvbG9ycyBhbmQgb3RoZXIgb3B0aW9ucyAqL1xuXG5cbiAgICAvKiogQ3JlYXRlIGEgbmV3IENob3JkIFN5bWJvbCBmcm9tIHRoZSBnaXZlbiBsaXN0IG9mIG1pZGkgbm90ZXMuXG4gICAgICogQWxsIHRoZSBtaWRpIG5vdGVzIHdpbGwgaGF2ZSB0aGUgc2FtZSBzdGFydCB0aW1lLiAgVXNlIHRoZVxuICAgICAqIGtleSBzaWduYXR1cmUgdG8gZ2V0IHRoZSB3aGl0ZSBrZXkgYW5kIGFjY2lkZW50YWwgc3ltYm9sIGZvclxuICAgICAqIGVhY2ggbm90ZS4gIFVzZSB0aGUgdGltZSBzaWduYXR1cmUgdG8gY2FsY3VsYXRlIHRoZSBkdXJhdGlvblxuICAgICAqIG9mIHRoZSBub3Rlcy4gVXNlIHRoZSBjbGVmIHdoZW4gZHJhd2luZyB0aGUgY2hvcmQuXG4gICAgICovXG4gICAgcHVibGljIENob3JkU3ltYm9sKExpc3Q8TWlkaU5vdGU+IG1pZGlub3RlcywgS2V5U2lnbmF0dXJlIGtleSwgXG4gICAgICAgICAgICAgICAgICAgICAgIFRpbWVTaWduYXR1cmUgdGltZSwgQ2xlZiBjLCBTaGVldE11c2ljIHNoZWV0KSB7XG5cbiAgICAgICAgaW50IGxlbiA9IG1pZGlub3Rlcy5Db3VudDtcbiAgICAgICAgaW50IGk7XG5cbiAgICAgICAgaGFzdHdvc3RlbXMgPSBmYWxzZTtcbiAgICAgICAgY2xlZiA9IGM7XG4gICAgICAgIHNoZWV0bXVzaWMgPSBzaGVldDtcblxuICAgICAgICBzdGFydHRpbWUgPSBtaWRpbm90ZXNbMF0uU3RhcnRUaW1lO1xuICAgICAgICBlbmR0aW1lID0gbWlkaW5vdGVzWzBdLkVuZFRpbWU7XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG1pZGlub3Rlcy5Db3VudDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaSA+IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAobWlkaW5vdGVzW2ldLk51bWJlciA8IG1pZGlub3Rlc1tpLTFdLk51bWJlcikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgU3lzdGVtLkFyZ3VtZW50RXhjZXB0aW9uKFwiQ2hvcmQgbm90ZXMgbm90IGluIGluY3JlYXNpbmcgb3JkZXIgYnkgbnVtYmVyXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVuZHRpbWUgPSBNYXRoLk1heChlbmR0aW1lLCBtaWRpbm90ZXNbaV0uRW5kVGltZSk7XG4gICAgICAgIH1cblxuICAgICAgICBub3RlZGF0YSA9IENyZWF0ZU5vdGVEYXRhKG1pZGlub3Rlcywga2V5LCB0aW1lKTtcbiAgICAgICAgYWNjaWRzeW1ib2xzID0gQ3JlYXRlQWNjaWRTeW1ib2xzKG5vdGVkYXRhLCBjbGVmKTtcblxuXG4gICAgICAgIC8qIEZpbmQgb3V0IGhvdyBtYW55IHN0ZW1zIHdlIG5lZWQgKDEgb3IgMikgKi9cbiAgICAgICAgTm90ZUR1cmF0aW9uIGR1cjEgPSBub3RlZGF0YVswXS5kdXJhdGlvbjtcbiAgICAgICAgTm90ZUR1cmF0aW9uIGR1cjIgPSBkdXIxO1xuICAgICAgICBpbnQgY2hhbmdlID0gLTE7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBub3RlZGF0YS5MZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZHVyMiA9IG5vdGVkYXRhW2ldLmR1cmF0aW9uO1xuICAgICAgICAgICAgaWYgKGR1cjEgIT0gZHVyMikge1xuICAgICAgICAgICAgICAgIGNoYW5nZSA9IGk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZHVyMSAhPSBkdXIyKSB7XG4gICAgICAgICAgICAvKiBXZSBoYXZlIG5vdGVzIHdpdGggZGlmZmVyZW50IGR1cmF0aW9ucy4gIFNvIHdlIHdpbGwgbmVlZFxuICAgICAgICAgICAgICogdHdvIHN0ZW1zLiAgVGhlIGZpcnN0IHN0ZW0gcG9pbnRzIGRvd24sIGFuZCBjb250YWlucyB0aGVcbiAgICAgICAgICAgICAqIGJvdHRvbSBub3RlIHVwIHRvIHRoZSBub3RlIHdpdGggdGhlIGRpZmZlcmVudCBkdXJhdGlvbi5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBUaGUgc2Vjb25kIHN0ZW0gcG9pbnRzIHVwLCBhbmQgY29udGFpbnMgdGhlIG5vdGUgd2l0aCB0aGVcbiAgICAgICAgICAgICAqIGRpZmZlcmVudCBkdXJhdGlvbiB1cCB0byB0aGUgdG9wIG5vdGUuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGhhc3R3b3N0ZW1zID0gdHJ1ZTtcbiAgICAgICAgICAgIHN0ZW0xID0gbmV3IFN0ZW0obm90ZWRhdGFbMF0ud2hpdGVub3RlLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90ZWRhdGFbY2hhbmdlLTFdLndoaXRlbm90ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVyMSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0ZW0uRG93bixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTm90ZXNPdmVybGFwKG5vdGVkYXRhLCAwLCBjaGFuZ2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgc3RlbTIgPSBuZXcgU3RlbShub3RlZGF0YVtjaGFuZ2VdLndoaXRlbm90ZSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGVkYXRhW25vdGVkYXRhLkxlbmd0aC0xXS53aGl0ZW5vdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cjIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdGVtLlVwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBOb3Rlc092ZXJsYXAobm90ZWRhdGEsIGNoYW5nZSwgbm90ZWRhdGEuTGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvKiBBbGwgbm90ZXMgaGF2ZSB0aGUgc2FtZSBkdXJhdGlvbiwgc28gd2Ugb25seSBuZWVkIG9uZSBzdGVtLiAqL1xuICAgICAgICAgICAgaW50IGRpcmVjdGlvbiA9IFN0ZW1EaXJlY3Rpb24obm90ZWRhdGFbMF0ud2hpdGVub3RlLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGVkYXRhW25vdGVkYXRhLkxlbmd0aC0xXS53aGl0ZW5vdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVmKTtcblxuICAgICAgICAgICAgc3RlbTEgPSBuZXcgU3RlbShub3RlZGF0YVswXS53aGl0ZW5vdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGVkYXRhW25vdGVkYXRhLkxlbmd0aC0xXS53aGl0ZW5vdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cjEsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIE5vdGVzT3ZlcmxhcChub3RlZGF0YSwgMCwgbm90ZWRhdGEuTGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICBzdGVtMiA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBGb3Igd2hvbGUgbm90ZXMsIG5vIHN0ZW0gaXMgZHJhd24uICovXG4gICAgICAgIGlmIChkdXIxID09IE5vdGVEdXJhdGlvbi5XaG9sZSlcbiAgICAgICAgICAgIHN0ZW0xID0gbnVsbDtcbiAgICAgICAgaWYgKGR1cjIgPT0gTm90ZUR1cmF0aW9uLldob2xlKVxuICAgICAgICAgICAgc3RlbTIgPSBudWxsO1xuXG4gICAgICAgIHdpZHRoID0gTWluV2lkdGg7XG4gICAgfVxuXG5cbiAgICAvKiogR2l2ZW4gdGhlIHJhdyBtaWRpIG5vdGVzICh0aGUgbm90ZSBudW1iZXIgYW5kIGR1cmF0aW9uIGluIHB1bHNlcyksXG4gICAgICogY2FsY3VsYXRlIHRoZSBmb2xsb3dpbmcgbm90ZSBkYXRhOlxuICAgICAqIC0gVGhlIHdoaXRlIGtleVxuICAgICAqIC0gVGhlIGFjY2lkZW50YWwgKGlmIGFueSlcbiAgICAgKiAtIFRoZSBub3RlIGR1cmF0aW9uIChoYWxmLCBxdWFydGVyLCBlaWdodGgsIGV0YylcbiAgICAgKiAtIFRoZSBzaWRlIGl0IHNob3VsZCBiZSBkcmF3biAobGVmdCBvciBzaWRlKVxuICAgICAqIEJ5IGRlZmF1bHQsIG5vdGVzIGFyZSBkcmF3biBvbiB0aGUgbGVmdCBzaWRlLiAgSG93ZXZlciwgaWYgdHdvIG5vdGVzXG4gICAgICogb3ZlcmxhcCAobGlrZSBBIGFuZCBCKSB5b3UgY2Fubm90IGRyYXcgdGhlIG5leHQgbm90ZSBkaXJlY3RseSBhYm92ZSBpdC5cbiAgICAgKiBJbnN0ZWFkIHlvdSBtdXN0IHNoaWZ0IG9uZSBvZiB0aGUgbm90ZXMgdG8gdGhlIHJpZ2h0LlxuICAgICAqXG4gICAgICogVGhlIEtleVNpZ25hdHVyZSBpcyB1c2VkIHRvIGRldGVybWluZSB0aGUgd2hpdGUga2V5IGFuZCBhY2NpZGVudGFsLlxuICAgICAqIFRoZSBUaW1lU2lnbmF0dXJlIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSBkdXJhdGlvbi5cbiAgICAgKi9cbiBcbiAgICBwcml2YXRlIHN0YXRpYyBOb3RlRGF0YVtdIFxuICAgIENyZWF0ZU5vdGVEYXRhKExpc3Q8TWlkaU5vdGU+IG1pZGlub3RlcywgS2V5U2lnbmF0dXJlIGtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRpbWVTaWduYXR1cmUgdGltZSkge1xuXG4gICAgICAgIGludCBsZW4gPSBtaWRpbm90ZXMuQ291bnQ7XG4gICAgICAgIE5vdGVEYXRhW10gbm90ZWRhdGEgPSBuZXcgTm90ZURhdGFbbGVuXTtcblxuICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBNaWRpTm90ZSBtaWRpID0gbWlkaW5vdGVzW2ldO1xuICAgICAgICAgICAgbm90ZWRhdGFbaV0gPSBuZXcgTm90ZURhdGEoKTtcbiAgICAgICAgICAgIG5vdGVkYXRhW2ldLm51bWJlciA9IG1pZGkuTnVtYmVyO1xuICAgICAgICAgICAgbm90ZWRhdGFbaV0ubGVmdHNpZGUgPSB0cnVlO1xuICAgICAgICAgICAgbm90ZWRhdGFbaV0ud2hpdGVub3RlID0ga2V5LkdldFdoaXRlTm90ZShtaWRpLk51bWJlcik7XG4gICAgICAgICAgICBub3RlZGF0YVtpXS5kdXJhdGlvbiA9IHRpbWUuR2V0Tm90ZUR1cmF0aW9uKG1pZGkuRW5kVGltZSAtIG1pZGkuU3RhcnRUaW1lKTtcbiAgICAgICAgICAgIG5vdGVkYXRhW2ldLmFjY2lkID0ga2V5LkdldEFjY2lkZW50YWwobWlkaS5OdW1iZXIsIG1pZGkuU3RhcnRUaW1lIC8gdGltZS5NZWFzdXJlKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGkgPiAwICYmIChub3RlZGF0YVtpXS53aGl0ZW5vdGUuRGlzdChub3RlZGF0YVtpLTFdLndoaXRlbm90ZSkgPT0gMSkpIHtcbiAgICAgICAgICAgICAgICAvKiBUaGlzIG5vdGUgKG5vdGVkYXRhW2ldKSBvdmVybGFwcyB3aXRoIHRoZSBwcmV2aW91cyBub3RlLlxuICAgICAgICAgICAgICAgICAqIENoYW5nZSB0aGUgc2lkZSBvZiB0aGlzIG5vdGUuXG4gICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgICBpZiAobm90ZWRhdGFbaS0xXS5sZWZ0c2lkZSkge1xuICAgICAgICAgICAgICAgICAgICBub3RlZGF0YVtpXS5sZWZ0c2lkZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vdGVkYXRhW2ldLmxlZnRzaWRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vdGVkYXRhW2ldLmxlZnRzaWRlID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbm90ZWRhdGE7XG4gICAgfVxuXG5cbiAgICAvKiogR2l2ZW4gdGhlIG5vdGUgZGF0YSAodGhlIHdoaXRlIGtleXMgYW5kIGFjY2lkZW50YWxzKSwgY3JlYXRlIFxuICAgICAqIHRoZSBBY2NpZGVudGFsIFN5bWJvbHMgYW5kIHJldHVybiB0aGVtLlxuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIEFjY2lkU3ltYm9sW10gXG4gICAgQ3JlYXRlQWNjaWRTeW1ib2xzKE5vdGVEYXRhW10gbm90ZWRhdGEsIENsZWYgY2xlZikge1xuICAgICAgICBpbnQgY291bnQgPSAwO1xuICAgICAgICBmb3JlYWNoIChOb3RlRGF0YSBuIGluIG5vdGVkYXRhKSB7XG4gICAgICAgICAgICBpZiAobi5hY2NpZCAhPSBBY2NpZC5Ob25lKSB7XG4gICAgICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBBY2NpZFN5bWJvbFtdIHN5bWJvbHMgPSBuZXcgQWNjaWRTeW1ib2xbY291bnRdO1xuICAgICAgICBpbnQgaSA9IDA7XG4gICAgICAgIGZvcmVhY2ggKE5vdGVEYXRhIG4gaW4gbm90ZWRhdGEpIHtcbiAgICAgICAgICAgIGlmIChuLmFjY2lkICE9IEFjY2lkLk5vbmUpIHtcbiAgICAgICAgICAgICAgICBzeW1ib2xzW2ldID0gbmV3IEFjY2lkU3ltYm9sKG4uYWNjaWQsIG4ud2hpdGVub3RlLCBjbGVmKTtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN5bWJvbHM7XG4gICAgfVxuXG4gICAgLyoqIENhbGN1bGF0ZSB0aGUgc3RlbSBkaXJlY3Rpb24gKFVwIG9yIGRvd24pIGJhc2VkIG9uIHRoZSB0b3AgYW5kXG4gICAgICogYm90dG9tIG5vdGUgaW4gdGhlIGNob3JkLiAgSWYgdGhlIGF2ZXJhZ2Ugb2YgdGhlIG5vdGVzIGlzIGFib3ZlXG4gICAgICogdGhlIG1pZGRsZSBvZiB0aGUgc3RhZmYsIHRoZSBkaXJlY3Rpb24gaXMgZG93bi4gIEVsc2UsIHRoZVxuICAgICAqIGRpcmVjdGlvbiBpcyB1cC5cbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBpbnQgXG4gICAgU3RlbURpcmVjdGlvbihXaGl0ZU5vdGUgYm90dG9tLCBXaGl0ZU5vdGUgdG9wLCBDbGVmIGNsZWYpIHtcbiAgICAgICAgV2hpdGVOb3RlIG1pZGRsZTtcbiAgICAgICAgaWYgKGNsZWYgPT0gQ2xlZi5UcmVibGUpXG4gICAgICAgICAgICBtaWRkbGUgPSBuZXcgV2hpdGVOb3RlKFdoaXRlTm90ZS5CLCA1KTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbWlkZGxlID0gbmV3IFdoaXRlTm90ZShXaGl0ZU5vdGUuRCwgMyk7XG5cbiAgICAgICAgaW50IGRpc3QgPSBtaWRkbGUuRGlzdChib3R0b20pICsgbWlkZGxlLkRpc3QodG9wKTtcbiAgICAgICAgaWYgKGRpc3QgPj0gMClcbiAgICAgICAgICAgIHJldHVybiBTdGVtLlVwO1xuICAgICAgICBlbHNlIFxuICAgICAgICAgICAgcmV0dXJuIFN0ZW0uRG93bjtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHdoZXRoZXIgYW55IG9mIHRoZSBub3RlcyBpbiBub3RlZGF0YSAoYmV0d2VlbiBzdGFydCBhbmRcbiAgICAgKiBlbmQgaW5kZXhlcykgb3ZlcmxhcC4gIFRoaXMgaXMgbmVlZGVkIGJ5IHRoZSBTdGVtIGNsYXNzIHRvXG4gICAgICogZGV0ZXJtaW5lIHRoZSBwb3NpdGlvbiBvZiB0aGUgc3RlbSAobGVmdCBvciByaWdodCBvZiBub3RlcykuXG4gICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgYm9vbCBOb3Rlc092ZXJsYXAoTm90ZURhdGFbXSBub3RlZGF0YSwgaW50IHN0YXJ0LCBpbnQgZW5kKSB7XG4gICAgICAgIGZvciAoaW50IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIW5vdGVkYXRhW2ldLmxlZnRzaWRlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIHRpbWUgKGluIHB1bHNlcykgdGhpcyBzeW1ib2wgb2NjdXJzIGF0LlxuICAgICAqIFRoaXMgaXMgdXNlZCB0byBkZXRlcm1pbmUgdGhlIG1lYXN1cmUgdGhpcyBzeW1ib2wgYmVsb25ncyB0by5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IFN0YXJ0VGltZSB7IFxuICAgICAgICBnZXQgeyByZXR1cm4gc3RhcnR0aW1lOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgZW5kIHRpbWUgKGluIHB1bHNlcykgb2YgdGhlIGxvbmdlc3Qgbm90ZSBpbiB0aGUgY2hvcmQuXG4gICAgICogVXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciB0d28gYWRqYWNlbnQgY2hvcmRzIGNhbiBiZSBqb2luZWRcbiAgICAgKiBieSBhIHN0ZW0uXG4gICAgICovXG4gICAgcHVibGljIGludCBFbmRUaW1lIHsgXG4gICAgICAgIGdldCB7IHJldHVybiBlbmR0aW1lOyB9XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB0aGUgY2xlZiB0aGlzIGNob3JkIGlzIGRyYXduIGluLiAqL1xuICAgIHB1YmxpYyBDbGVmIENsZWYgeyBcbiAgICAgICAgZ2V0IHsgcmV0dXJuIGNsZWY7IH1cbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHRydWUgaWYgdGhpcyBjaG9yZCBoYXMgdHdvIHN0ZW1zICovXG4gICAgcHVibGljIGJvb2wgSGFzVHdvU3RlbXMge1xuICAgICAgICBnZXQgeyByZXR1cm4gaGFzdHdvc3RlbXM7IH1cbiAgICB9XG5cbiAgICAvKiBSZXR1cm4gdGhlIHN0ZW0gd2lsbCB0aGUgc21hbGxlc3QgZHVyYXRpb24uICBUaGlzIHByb3BlcnR5XG4gICAgICogaXMgdXNlZCB3aGVuIG1ha2luZyBjaG9yZCBwYWlycyAoY2hvcmRzIGpvaW5lZCBieSBhIGhvcml6b250YWxcbiAgICAgKiBiZWFtIHN0ZW0pLiBUaGUgc3RlbSBkdXJhdGlvbnMgbXVzdCBtYXRjaCBpbiBvcmRlciB0byBtYWtlXG4gICAgICogYSBjaG9yZCBwYWlyLiAgSWYgYSBjaG9yZCBoYXMgdHdvIHN0ZW1zLCB3ZSBhbHdheXMgcmV0dXJuXG4gICAgICogdGhlIG9uZSB3aXRoIGEgc21hbGxlciBkdXJhdGlvbiwgYmVjYXVzZSBpdCBoYXMgYSBiZXR0ZXIgXG4gICAgICogY2hhbmNlIG9mIG1ha2luZyBhIHBhaXIuXG4gICAgICovXG4gICAgcHVibGljIFN0ZW0gU3RlbSB7XG4gICAgICAgIGdldCB7IFxuICAgICAgICAgICAgaWYgKHN0ZW0xID09IG51bGwpIHsgcmV0dXJuIHN0ZW0yOyB9XG4gICAgICAgICAgICBlbHNlIGlmIChzdGVtMiA9PSBudWxsKSB7IHJldHVybiBzdGVtMTsgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc3RlbTEuRHVyYXRpb24gPCBzdGVtMi5EdXJhdGlvbikgeyByZXR1cm4gc3RlbTE7IH1cbiAgICAgICAgICAgIGVsc2UgeyByZXR1cm4gc3RlbTI7IH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBHZXQvU2V0IHRoZSB3aWR0aCAoaW4gcGl4ZWxzKSBvZiB0aGlzIHN5bWJvbC4gVGhlIHdpZHRoIGlzIHNldFxuICAgICAqIGluIFNoZWV0TXVzaWMuQWxpZ25TeW1ib2xzKCkgdG8gdmVydGljYWxseSBhbGlnbiBzeW1ib2xzLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgV2lkdGgge1xuICAgICAgICBnZXQgeyByZXR1cm4gd2lkdGg7IH1cbiAgICAgICAgc2V0IHsgd2lkdGggPSB2YWx1ZTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG1pbmltdW0gd2lkdGggKGluIHBpeGVscykgbmVlZGVkIHRvIGRyYXcgdGhpcyBzeW1ib2wgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IE1pbldpZHRoIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIEdldE1pbldpZHRoKCk7IH1cbiAgICB9XG5cbiAgICAvKiBSZXR1cm4gdGhlIG1pbmltdW0gd2lkdGggbmVlZGVkIHRvIGRpc3BsYXkgdGhpcyBjaG9yZC5cbiAgICAgKlxuICAgICAqIFRoZSBhY2NpZGVudGFsIHN5bWJvbHMgY2FuIGJlIGRyYXduIGFib3ZlIG9uZSBhbm90aGVyIGFzIGxvbmdcbiAgICAgKiBhcyB0aGV5IGRvbid0IG92ZXJsYXAgKHRoZXkgbXVzdCBiZSBhdCBsZWFzdCA2IG5vdGVzIGFwYXJ0KS5cbiAgICAgKiBJZiB0d28gYWNjaWRlbnRhbCBzeW1ib2xzIGRvIG92ZXJsYXAsIHRoZSBhY2NpZGVudGFsIHN5bWJvbFxuICAgICAqIG9uIHRvcCBtdXN0IGJlIHNoaWZ0ZWQgdG8gdGhlIHJpZ2h0LiAgU28gdGhlIHdpZHRoIG5lZWRlZCBmb3JcbiAgICAgKiBhY2NpZGVudGFsIHN5bWJvbHMgZGVwZW5kcyBvbiB3aGV0aGVyIHRoZXkgb3ZlcmxhcCBvciBub3QuXG4gICAgICpcbiAgICAgKiBJZiB3ZSBhcmUgYWxzbyBkaXNwbGF5aW5nIHRoZSBsZXR0ZXJzLCBpbmNsdWRlIGV4dHJhIHdpZHRoLlxuICAgICAqL1xuICAgIGludCBHZXRNaW5XaWR0aCgpIHtcbiAgICAgICAgLyogVGhlIHdpZHRoIG5lZWRlZCBmb3IgdGhlIG5vdGUgY2lyY2xlcyAqL1xuICAgICAgICBpbnQgcmVzdWx0ID0gMipTaGVldE11c2ljLk5vdGVIZWlnaHQgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQqMy80O1xuXG4gICAgICAgIGlmIChhY2NpZHN5bWJvbHMuTGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmVzdWx0ICs9IGFjY2lkc3ltYm9sc1swXS5NaW5XaWR0aDtcbiAgICAgICAgICAgIGZvciAoaW50IGkgPSAxOyBpIDwgYWNjaWRzeW1ib2xzLkxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgQWNjaWRTeW1ib2wgYWNjaWQgPSBhY2NpZHN5bWJvbHNbaV07XG4gICAgICAgICAgICAgICAgQWNjaWRTeW1ib2wgcHJldiA9IGFjY2lkc3ltYm9sc1tpLTFdO1xuICAgICAgICAgICAgICAgIGlmIChhY2NpZC5Ob3RlLkRpc3QocHJldi5Ob3RlKSA8IDYpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IGFjY2lkLk1pbldpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hlZXRtdXNpYyAhPSBudWxsICYmIHNoZWV0bXVzaWMuU2hvd05vdGVMZXR0ZXJzICE9IE1pZGlPcHRpb25zLk5vdGVOYW1lTm9uZSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9IDg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBwaXhlbHMgdGhpcyBzeW1ib2wgZXh0ZW5kcyBhYm92ZSB0aGUgc3RhZmYuIFVzZWRcbiAgICAgKiAgdG8gZGV0ZXJtaW5lIHRoZSBtaW5pbXVtIGhlaWdodCBuZWVkZWQgZm9yIHRoZSBzdGFmZiAoU3RhZmYuRmluZEJvdW5kcykuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBBYm92ZVN0YWZmIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIEdldEFib3ZlU3RhZmYoKTsgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaW50IEdldEFib3ZlU3RhZmYoKSB7XG4gICAgICAgIC8qIEZpbmQgdGhlIHRvcG1vc3Qgbm90ZSBpbiB0aGUgY2hvcmQgKi9cbiAgICAgICAgV2hpdGVOb3RlIHRvcG5vdGUgPSBub3RlZGF0YVsgbm90ZWRhdGEuTGVuZ3RoLTEgXS53aGl0ZW5vdGU7XG5cbiAgICAgICAgLyogVGhlIHN0ZW0uRW5kIGlzIHRoZSBub3RlIHBvc2l0aW9uIHdoZXJlIHRoZSBzdGVtIGVuZHMuXG4gICAgICAgICAqIENoZWNrIGlmIHRoZSBzdGVtIGVuZCBpcyBoaWdoZXIgdGhhbiB0aGUgdG9wIG5vdGUuXG4gICAgICAgICAqL1xuICAgICAgICBpZiAoc3RlbTEgIT0gbnVsbClcbiAgICAgICAgICAgIHRvcG5vdGUgPSBXaGl0ZU5vdGUuTWF4KHRvcG5vdGUsIHN0ZW0xLkVuZCk7XG4gICAgICAgIGlmIChzdGVtMiAhPSBudWxsKVxuICAgICAgICAgICAgdG9wbm90ZSA9IFdoaXRlTm90ZS5NYXgodG9wbm90ZSwgc3RlbTIuRW5kKTtcblxuICAgICAgICBpbnQgZGlzdCA9IHRvcG5vdGUuRGlzdChXaGl0ZU5vdGUuVG9wKGNsZWYpKSAqIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yO1xuICAgICAgICBpbnQgcmVzdWx0ID0gMDtcbiAgICAgICAgaWYgKGRpc3QgPiAwKVxuICAgICAgICAgICAgcmVzdWx0ID0gZGlzdDtcblxuICAgICAgICAvKiBDaGVjayBpZiBhbnkgYWNjaWRlbnRhbCBzeW1ib2xzIGV4dGVuZCBhYm92ZSB0aGUgc3RhZmYgKi9cbiAgICAgICAgZm9yZWFjaCAoQWNjaWRTeW1ib2wgc3ltYm9sIGluIGFjY2lkc3ltYm9scykge1xuICAgICAgICAgICAgaWYgKHN5bWJvbC5BYm92ZVN0YWZmID4gcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gc3ltYm9sLkFib3ZlU3RhZmY7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBudW1iZXIgb2YgcGl4ZWxzIHRoaXMgc3ltYm9sIGV4dGVuZHMgYmVsb3cgdGhlIHN0YWZmLiBVc2VkXG4gICAgICogIHRvIGRldGVybWluZSB0aGUgbWluaW11bSBoZWlnaHQgbmVlZGVkIGZvciB0aGUgc3RhZmYgKFN0YWZmLkZpbmRCb3VuZHMpLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgQmVsb3dTdGFmZiB7XG4gICAgICAgIGdldCB7IHJldHVybiBHZXRCZWxvd1N0YWZmKCk7IH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGludCBHZXRCZWxvd1N0YWZmKCkge1xuICAgICAgICAvKiBGaW5kIHRoZSBib3R0b20gbm90ZSBpbiB0aGUgY2hvcmQgKi9cbiAgICAgICAgV2hpdGVOb3RlIGJvdHRvbW5vdGUgPSBub3RlZGF0YVswXS53aGl0ZW5vdGU7XG5cbiAgICAgICAgLyogVGhlIHN0ZW0uRW5kIGlzIHRoZSBub3RlIHBvc2l0aW9uIHdoZXJlIHRoZSBzdGVtIGVuZHMuXG4gICAgICAgICAqIENoZWNrIGlmIHRoZSBzdGVtIGVuZCBpcyBsb3dlciB0aGFuIHRoZSBib3R0b20gbm90ZS5cbiAgICAgICAgICovXG4gICAgICAgIGlmIChzdGVtMSAhPSBudWxsKVxuICAgICAgICAgICAgYm90dG9tbm90ZSA9IFdoaXRlTm90ZS5NaW4oYm90dG9tbm90ZSwgc3RlbTEuRW5kKTtcbiAgICAgICAgaWYgKHN0ZW0yICE9IG51bGwpXG4gICAgICAgICAgICBib3R0b21ub3RlID0gV2hpdGVOb3RlLk1pbihib3R0b21ub3RlLCBzdGVtMi5FbmQpO1xuXG4gICAgICAgIGludCBkaXN0ID0gV2hpdGVOb3RlLkJvdHRvbShjbGVmKS5EaXN0KGJvdHRvbW5vdGUpICpcbiAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLk5vdGVIZWlnaHQvMjtcblxuICAgICAgICBpbnQgcmVzdWx0ID0gMDtcbiAgICAgICAgaWYgKGRpc3QgPiAwKVxuICAgICAgICAgICAgcmVzdWx0ID0gZGlzdDtcblxuICAgICAgICAvKiBDaGVjayBpZiBhbnkgYWNjaWRlbnRhbCBzeW1ib2xzIGV4dGVuZCBiZWxvdyB0aGUgc3RhZmYgKi8gXG4gICAgICAgIGZvcmVhY2ggKEFjY2lkU3ltYm9sIHN5bWJvbCBpbiBhY2NpZHN5bWJvbHMpIHtcbiAgICAgICAgICAgIGlmIChzeW1ib2wuQmVsb3dTdGFmZiA+IHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHN5bWJvbC5CZWxvd1N0YWZmO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbmFtZSBmb3IgdGhpcyBub3RlICovXG4gICAgcHJpdmF0ZSBzdHJpbmcgTm90ZU5hbWUoaW50IG5vdGVudW1iZXIsIFdoaXRlTm90ZSB3aGl0ZW5vdGUpIHtcbiAgICAgICAgaWYgKHNoZWV0bXVzaWMuU2hvd05vdGVMZXR0ZXJzID09IE1pZGlPcHRpb25zLk5vdGVOYW1lTGV0dGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gTGV0dGVyKG5vdGVudW1iZXIsIHdoaXRlbm90ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2hlZXRtdXNpYy5TaG93Tm90ZUxldHRlcnMgPT0gTWlkaU9wdGlvbnMuTm90ZU5hbWVGaXhlZERvUmVNaSkge1xuICAgICAgICAgICAgc3RyaW5nW10gZml4ZWREb1JlTWkgPSB7XG4gICAgICAgICAgICAgICAgXCJMYVwiLCBcIkxpXCIsIFwiVGlcIiwgXCJEb1wiLCBcIkRpXCIsIFwiUmVcIiwgXCJSaVwiLCBcIk1pXCIsIFwiRmFcIiwgXCJGaVwiLCBcIlNvXCIsIFwiU2lcIiBcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbnQgbm90ZXNjYWxlID0gTm90ZVNjYWxlLkZyb21OdW1iZXIobm90ZW51bWJlcik7XG4gICAgICAgICAgICByZXR1cm4gZml4ZWREb1JlTWlbbm90ZXNjYWxlXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzaGVldG11c2ljLlNob3dOb3RlTGV0dGVycyA9PSBNaWRpT3B0aW9ucy5Ob3RlTmFtZU1vdmFibGVEb1JlTWkpIHtcbiAgICAgICAgICAgIHN0cmluZ1tdIGZpeGVkRG9SZU1pID0ge1xuICAgICAgICAgICAgICAgIFwiTGFcIiwgXCJMaVwiLCBcIlRpXCIsIFwiRG9cIiwgXCJEaVwiLCBcIlJlXCIsIFwiUmlcIiwgXCJNaVwiLCBcIkZhXCIsIFwiRmlcIiwgXCJTb1wiLCBcIlNpXCIgXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW50IG1haW5zY2FsZSA9IHNoZWV0bXVzaWMuTWFpbktleS5Ob3Rlc2NhbGUoKTtcbiAgICAgICAgICAgIGludCBkaWZmID0gTm90ZVNjYWxlLkMgLSBtYWluc2NhbGU7XG4gICAgICAgICAgICBub3RlbnVtYmVyICs9IGRpZmY7XG4gICAgICAgICAgICBpZiAobm90ZW51bWJlciA8IDApIHtcbiAgICAgICAgICAgICAgICBub3RlbnVtYmVyICs9IDEyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW50IG5vdGVzY2FsZSA9IE5vdGVTY2FsZS5Gcm9tTnVtYmVyKG5vdGVudW1iZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGZpeGVkRG9SZU1pW25vdGVzY2FsZV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2hlZXRtdXNpYy5TaG93Tm90ZUxldHRlcnMgPT0gTWlkaU9wdGlvbnMuTm90ZU5hbWVGaXhlZE51bWJlcikge1xuICAgICAgICAgICAgc3RyaW5nW10gbnVtID0ge1xuICAgICAgICAgICAgICAgIFwiMTBcIiwgXCIxMVwiLCBcIjEyXCIsIFwiMVwiLCBcIjJcIiwgXCIzXCIsIFwiNFwiLCBcIjVcIiwgXCI2XCIsIFwiN1wiLCBcIjhcIiwgXCI5XCIgXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW50IG5vdGVzY2FsZSA9IE5vdGVTY2FsZS5Gcm9tTnVtYmVyKG5vdGVudW1iZXIpO1xuICAgICAgICAgICAgcmV0dXJuIG51bVtub3Rlc2NhbGVdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNoZWV0bXVzaWMuU2hvd05vdGVMZXR0ZXJzID09IE1pZGlPcHRpb25zLk5vdGVOYW1lTW92YWJsZU51bWJlcikge1xuICAgICAgICAgICAgc3RyaW5nW10gbnVtID0ge1xuICAgICAgICAgICAgICAgIFwiMTBcIiwgXCIxMVwiLCBcIjEyXCIsIFwiMVwiLCBcIjJcIiwgXCIzXCIsIFwiNFwiLCBcIjVcIiwgXCI2XCIsIFwiN1wiLCBcIjhcIiwgXCI5XCIgXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW50IG1haW5zY2FsZSA9IHNoZWV0bXVzaWMuTWFpbktleS5Ob3Rlc2NhbGUoKTtcbiAgICAgICAgICAgIGludCBkaWZmID0gTm90ZVNjYWxlLkMgLSBtYWluc2NhbGU7XG4gICAgICAgICAgICBub3RlbnVtYmVyICs9IGRpZmY7XG4gICAgICAgICAgICBpZiAobm90ZW51bWJlciA8IDApIHtcbiAgICAgICAgICAgICAgICBub3RlbnVtYmVyICs9IDEyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW50IG5vdGVzY2FsZSA9IE5vdGVTY2FsZS5Gcm9tTnVtYmVyKG5vdGVudW1iZXIpO1xuICAgICAgICAgICAgcmV0dXJuIG51bVtub3Rlc2NhbGVdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBsZXR0ZXIgKEEsIEEjLCBCYikgcmVwcmVzZW50aW5nIHRoaXMgbm90ZSAqL1xuICAgIHByaXZhdGUgc3RyaW5nIExldHRlcihpbnQgbm90ZW51bWJlciwgV2hpdGVOb3RlIHdoaXRlbm90ZSkge1xuICAgICAgICBpbnQgbm90ZXNjYWxlID0gTm90ZVNjYWxlLkZyb21OdW1iZXIobm90ZW51bWJlcik7XG4gICAgICAgIHN3aXRjaChub3Rlc2NhbGUpIHtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkE6IHJldHVybiBcIkFcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkI6IHJldHVybiBcIkJcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkM6IHJldHVybiBcIkNcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkQ6IHJldHVybiBcIkRcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkU6IHJldHVybiBcIkVcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkY6IHJldHVybiBcIkZcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkc6IHJldHVybiBcIkdcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkFzaGFycDpcbiAgICAgICAgICAgICAgICBpZiAod2hpdGVub3RlLkxldHRlciA9PSBXaGl0ZU5vdGUuQSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiQSNcIjtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIkJiXCI7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5Dc2hhcnA6XG4gICAgICAgICAgICAgICAgaWYgKHdoaXRlbm90ZS5MZXR0ZXIgPT0gV2hpdGVOb3RlLkMpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIkMjXCI7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJEYlwiO1xuICAgICAgICAgICAgY2FzZSBOb3RlU2NhbGUuRHNoYXJwOlxuICAgICAgICAgICAgICAgIGlmICh3aGl0ZW5vdGUuTGV0dGVyID09IFdoaXRlTm90ZS5EKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJEI1wiO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiRWJcIjtcbiAgICAgICAgICAgIGNhc2UgTm90ZVNjYWxlLkZzaGFycDpcbiAgICAgICAgICAgICAgICBpZiAod2hpdGVub3RlLkxldHRlciA9PSBXaGl0ZU5vdGUuRilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiRiNcIjtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIkdiXCI7XG4gICAgICAgICAgICBjYXNlIE5vdGVTY2FsZS5Hc2hhcnA6XG4gICAgICAgICAgICAgICAgaWYgKHdoaXRlbm90ZS5MZXR0ZXIgPT0gV2hpdGVOb3RlLkcpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIkcjXCI7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJBYlwiO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBEcmF3IHRoZSBDaG9yZCBTeW1ib2w6XG4gICAgICogLSBEcmF3IHRoZSBhY2NpZGVudGFsIHN5bWJvbHMuXG4gICAgICogLSBEcmF3IHRoZSBibGFjayBjaXJjbGUgbm90ZXMuXG4gICAgICogLSBEcmF3IHRoZSBzdGVtcy5cbiAgICAgIEBwYXJhbSB5dG9wIFRoZSB5bG9jYXRpb24gKGluIHBpeGVscykgd2hlcmUgdGhlIHRvcCBvZiB0aGUgc3RhZmYgc3RhcnRzLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSB2b2lkIERyYXcoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHl0b3ApIHtcbiAgICAgICAgLyogQWxpZ24gdGhlIGNob3JkIHRvIHRoZSByaWdodCAqL1xuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybShXaWR0aCAtIE1pbldpZHRoLCAwKTtcblxuICAgICAgICAvKiBEcmF3IHRoZSBhY2NpZGVudGFscy4gKi9cbiAgICAgICAgV2hpdGVOb3RlIHRvcHN0YWZmID0gV2hpdGVOb3RlLlRvcChjbGVmKTtcbiAgICAgICAgaW50IHhwb3MgPSBEcmF3QWNjaWQoZywgcGVuLCB5dG9wKTtcblxuICAgICAgICAvKiBEcmF3IHRoZSBub3RlcyAqL1xuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSh4cG9zLCAwKTtcbiAgICAgICAgRHJhd05vdGVzKGcsIHBlbiwgeXRvcCwgdG9wc3RhZmYpO1xuICAgICAgICBpZiAoc2hlZXRtdXNpYyAhPSBudWxsICYmIHNoZWV0bXVzaWMuU2hvd05vdGVMZXR0ZXJzICE9IDApIHtcbiAgICAgICAgICAgIERyYXdOb3RlTGV0dGVycyhnLCBwZW4sIHl0b3AsIHRvcHN0YWZmKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIERyYXcgdGhlIHN0ZW1zICovXG4gICAgICAgIGlmIChzdGVtMSAhPSBudWxsKVxuICAgICAgICAgICAgc3RlbTEuRHJhdyhnLCBwZW4sIHl0b3AsIHRvcHN0YWZmKTtcbiAgICAgICAgaWYgKHN0ZW0yICE9IG51bGwpXG4gICAgICAgICAgICBzdGVtMi5EcmF3KGcsIHBlbiwgeXRvcCwgdG9wc3RhZmYpO1xuXG4gICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC14cG9zLCAwKTtcbiAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oLShXaWR0aCAtIE1pbldpZHRoKSwgMCk7XG4gICAgfVxuXG4gICAgLyogRHJhdyB0aGUgYWNjaWRlbnRhbCBzeW1ib2xzLiAgSWYgdHdvIHN5bWJvbHMgb3ZlcmxhcCAoaWYgdGhleVxuICAgICAqIGFyZSBsZXNzIHRoYW4gNiBub3RlcyBhcGFydCksIHdlIGNhbm5vdCBkcmF3IHRoZSBzeW1ib2wgZGlyZWN0bHlcbiAgICAgKiBhYm92ZSB0aGUgcHJldmlvdXMgb25lLiAgSW5zdGVhZCwgd2UgbXVzdCBzaGlmdCBpdCB0byB0aGUgcmlnaHQuXG4gICAgICogQHBhcmFtIHl0b3AgVGhlIHlsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICogQHJldHVybiBUaGUgeCBwaXhlbCB3aWR0aCB1c2VkIGJ5IGFsbCB0aGUgYWNjaWRlbnRhbHMuXG4gICAgICovXG4gICAgcHVibGljIGludCBEcmF3QWNjaWQoR3JhcGhpY3MgZywgUGVuIHBlbiwgaW50IHl0b3ApIHtcbiAgICAgICAgaW50IHhwb3MgPSAwO1xuXG4gICAgICAgIEFjY2lkU3ltYm9sIHByZXYgPSBudWxsO1xuICAgICAgICBmb3JlYWNoIChBY2NpZFN5bWJvbCBzeW1ib2wgaW4gYWNjaWRzeW1ib2xzKSB7XG4gICAgICAgICAgICBpZiAocHJldiAhPSBudWxsICYmIHN5bWJvbC5Ob3RlLkRpc3QocHJldi5Ob3RlKSA8IDYpIHtcbiAgICAgICAgICAgICAgICB4cG9zICs9IHN5bWJvbC5XaWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKHhwb3MsIDApO1xuICAgICAgICAgICAgc3ltYm9sLkRyYXcoZywgcGVuLCB5dG9wKTtcbiAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC14cG9zLCAwKTtcbiAgICAgICAgICAgIHByZXYgPSBzeW1ib2w7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByZXYgIT0gbnVsbCkge1xuICAgICAgICAgICAgeHBvcyArPSBwcmV2LldpZHRoO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4cG9zO1xuICAgIH1cblxuICAgIC8qKiBEcmF3IHRoZSBibGFjayBjaXJjbGUgbm90ZXMuXG4gICAgICogQHBhcmFtIHl0b3AgVGhlIHlsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICogQHBhcmFtIHRvcHN0YWZmIFRoZSB3aGl0ZSBub3RlIG9mIHRoZSB0b3Agb2YgdGhlIHN0YWZmLlxuICAgICAqL1xuICAgIHB1YmxpYyB2b2lkIERyYXdOb3RlcyhHcmFwaGljcyBnLCBQZW4gcGVuLCBpbnQgeXRvcCwgV2hpdGVOb3RlIHRvcHN0YWZmKSB7XG4gICAgICAgIHBlbi5XaWR0aCA9IDE7XG4gICAgICAgIGZvcmVhY2ggKE5vdGVEYXRhIG5vdGUgaW4gbm90ZWRhdGEpIHtcbiAgICAgICAgICAgIC8qIEdldCB0aGUgeCx5IHBvc2l0aW9uIHRvIGRyYXcgdGhlIG5vdGUgKi9cbiAgICAgICAgICAgIGludCB5bm90ZSA9IHl0b3AgKyB0b3BzdGFmZi5EaXN0KG5vdGUud2hpdGVub3RlKSAqIFxuICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7XG5cbiAgICAgICAgICAgIGludCB4bm90ZSA9IFNoZWV0TXVzaWMuTGluZVNwYWNlLzQ7XG4gICAgICAgICAgICBpZiAoIW5vdGUubGVmdHNpZGUpXG4gICAgICAgICAgICAgICAgeG5vdGUgKz0gU2hlZXRNdXNpYy5Ob3RlV2lkdGg7XG5cbiAgICAgICAgICAgIC8qIERyYXcgcm90YXRlZCBlbGxpcHNlLiAgWW91IG11c3QgZmlyc3QgdHJhbnNsYXRlICgwLDApXG4gICAgICAgICAgICAgKiB0byB0aGUgY2VudGVyIG9mIHRoZSBlbGxpcHNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSh4bm90ZSArIFNoZWV0TXVzaWMuTm90ZVdpZHRoLzIgKyAxLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlub3RlIC0gU2hlZXRNdXNpYy5MaW5lV2lkdGggKyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yKTtcbiAgICAgICAgICAgIGcuUm90YXRlVHJhbnNmb3JtKC00NSk7XG5cbiAgICAgICAgICAgIGlmIChzaGVldG11c2ljICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwZW4uQ29sb3IgPSBzaGVldG11c2ljLk5vdGVDb2xvcihub3RlLm51bWJlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZW4uQ29sb3IgPSBDb2xvci5CbGFjaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5vdGUuZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLldob2xlIHx8IFxuICAgICAgICAgICAgICAgIG5vdGUuZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLkhhbGYgfHxcbiAgICAgICAgICAgICAgICBub3RlLmR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRIYWxmKSB7XG5cbiAgICAgICAgICAgICAgICBnLkRyYXdFbGxpcHNlKHBlbiwgLVNoZWV0TXVzaWMuTm90ZVdpZHRoLzIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLVNoZWV0TXVzaWMuTm90ZUhlaWdodC8yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLk5vdGVIZWlnaHQtMSk7XG5cbiAgICAgICAgICAgICAgICBnLkRyYXdFbGxpcHNlKHBlbiwgLVNoZWV0TXVzaWMuTm90ZVdpZHRoLzIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLVNoZWV0TXVzaWMuTm90ZUhlaWdodC8yICsgMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZVdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LTIpO1xuXG4gICAgICAgICAgICAgICAgZy5EcmF3RWxsaXBzZShwZW4sIC1TaGVldE11c2ljLk5vdGVXaWR0aC8yLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC1TaGVldE11c2ljLk5vdGVIZWlnaHQvMiArIDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLk5vdGVXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZUhlaWdodC0zKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgQnJ1c2ggYnJ1c2ggPSBCcnVzaGVzLkJsYWNrO1xuICAgICAgICAgICAgICAgIGlmIChwZW4uQ29sb3IgIT0gQ29sb3IuQmxhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgYnJ1c2ggPSBuZXcgU29saWRCcnVzaChwZW4uQ29sb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBnLkZpbGxFbGxpcHNlKGJydXNoLCAtU2hlZXRNdXNpYy5Ob3RlV2lkdGgvMiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLk5vdGVXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZUhlaWdodC0xKTtcbiAgICAgICAgICAgICAgICBpZiAocGVuLkNvbG9yICE9IENvbG9yLkJsYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGJydXNoLkRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBlbi5Db2xvciA9IENvbG9yLkJsYWNrO1xuICAgICAgICAgICAgZy5EcmF3RWxsaXBzZShwZW4sIC1TaGVldE11c2ljLk5vdGVXaWR0aC8yLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLVNoZWV0TXVzaWMuTm90ZUhlaWdodC8yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLk5vdGVIZWlnaHQtMSk7XG5cbiAgICAgICAgICAgIGcuUm90YXRlVHJhbnNmb3JtKDQ1KTtcbiAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKCAtICh4bm90ZSArIFNoZWV0TXVzaWMuTm90ZVdpZHRoLzIgKyAxKSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSAoeW5vdGUgLSBTaGVldE11c2ljLkxpbmVXaWR0aCArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yKSk7XG5cbiAgICAgICAgICAgIC8qIERyYXcgYSBkb3QgaWYgdGhpcyBpcyBhIGRvdHRlZCBkdXJhdGlvbi4gKi9cbiAgICAgICAgICAgIGlmIChub3RlLmR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRIYWxmIHx8XG4gICAgICAgICAgICAgICAgbm90ZS5kdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uRG90dGVkUXVhcnRlciB8fFxuICAgICAgICAgICAgICAgIG5vdGUuZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLkRvdHRlZEVpZ2h0aCkge1xuXG4gICAgICAgICAgICAgICAgZy5GaWxsRWxsaXBzZShCcnVzaGVzLkJsYWNrLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhub3RlICsgU2hlZXRNdXNpYy5Ob3RlV2lkdGggKyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTGluZVNwYWNlLzMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5bm90ZSArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzMsIDQsIDQpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIERyYXcgaG9yaXpvbnRhbCBsaW5lcyBpZiBub3RlIGlzIGFib3ZlL2JlbG93IHRoZSBzdGFmZiAqL1xuICAgICAgICAgICAgV2hpdGVOb3RlIHRvcCA9IHRvcHN0YWZmLkFkZCgxKTtcbiAgICAgICAgICAgIGludCBkaXN0ID0gbm90ZS53aGl0ZW5vdGUuRGlzdCh0b3ApO1xuICAgICAgICAgICAgaW50IHkgPSB5dG9wIC0gU2hlZXRNdXNpYy5MaW5lV2lkdGg7XG5cbiAgICAgICAgICAgIGlmIChkaXN0ID49IDIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGludCBpID0gMjsgaSA8PSBkaXN0OyBpICs9IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgeSAtPSBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuLCB4bm90ZSAtIFNoZWV0TXVzaWMuTGluZVNwYWNlLzQsIHksIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeG5vdGUgKyBTaGVldE11c2ljLk5vdGVXaWR0aCArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5MaW5lU3BhY2UvNCwgeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBXaGl0ZU5vdGUgYm90dG9tID0gdG9wLkFkZCgtOCk7XG4gICAgICAgICAgICB5ID0geXRvcCArIChTaGVldE11c2ljLkxpbmVTcGFjZSArIFNoZWV0TXVzaWMuTGluZVdpZHRoKSAqIDQgLSAxO1xuICAgICAgICAgICAgZGlzdCA9IGJvdHRvbS5EaXN0KG5vdGUud2hpdGVub3RlKTtcbiAgICAgICAgICAgIGlmIChkaXN0ID49IDIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGludCBpID0gMjsgaSA8PSBkaXN0OyBpKz0gMikge1xuICAgICAgICAgICAgICAgICAgICB5ICs9IFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgZy5EcmF3TGluZShwZW4sIHhub3RlIC0gU2hlZXRNdXNpYy5MaW5lU3BhY2UvNCwgeSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4bm90ZSArIFNoZWV0TXVzaWMuTm90ZVdpZHRoICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLkxpbmVTcGFjZS80LCB5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKiBFbmQgZHJhd2luZyBob3Jpem9udGFsIGxpbmVzICovXG5cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBEcmF3IHRoZSBub3RlIGxldHRlcnMgKEEsIEEjLCBCYiwgZXRjKSBuZXh0IHRvIHRoZSBub3RlIGNpcmNsZXMuXG4gICAgICogQHBhcmFtIHl0b3AgVGhlIHlsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICogQHBhcmFtIHRvcHN0YWZmIFRoZSB3aGl0ZSBub3RlIG9mIHRoZSB0b3Agb2YgdGhlIHN0YWZmLlxuICAgICAqL1xuICAgIHB1YmxpYyB2b2lkIERyYXdOb3RlTGV0dGVycyhHcmFwaGljcyBnLCBQZW4gcGVuLCBpbnQgeXRvcCwgV2hpdGVOb3RlIHRvcHN0YWZmKSB7XG4gICAgICAgIGJvb2wgb3ZlcmxhcCA9IE5vdGVzT3ZlcmxhcChub3RlZGF0YSwgMCwgbm90ZWRhdGEuTGVuZ3RoKTtcbiAgICAgICAgcGVuLldpZHRoID0gMTtcblxuICAgICAgICBmb3JlYWNoIChOb3RlRGF0YSBub3RlIGluIG5vdGVkYXRhKSB7XG4gICAgICAgICAgICBpZiAoIW5vdGUubGVmdHNpZGUpIHtcbiAgICAgICAgICAgICAgICAvKiBUaGVyZSdzIG5vdCBlbm91Z2h0IHBpeGVsIHJvb20gdG8gc2hvdyB0aGUgbGV0dGVyICovXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIEdldCB0aGUgeCx5IHBvc2l0aW9uIHRvIGRyYXcgdGhlIG5vdGUgKi9cbiAgICAgICAgICAgIGludCB5bm90ZSA9IHl0b3AgKyB0b3BzdGFmZi5EaXN0KG5vdGUud2hpdGVub3RlKSAqIFxuICAgICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7XG5cbiAgICAgICAgICAgIC8qIERyYXcgdGhlIGxldHRlciB0byB0aGUgcmlnaHQgc2lkZSBvZiB0aGUgbm90ZSAqL1xuICAgICAgICAgICAgaW50IHhub3RlID0gU2hlZXRNdXNpYy5Ob3RlV2lkdGggKyBTaGVldE11c2ljLkxpbmVTcGFjZS80O1xuXG4gICAgICAgICAgICBpZiAobm90ZS5kdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uRG90dGVkSGFsZiB8fFxuICAgICAgICAgICAgICAgIG5vdGUuZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLkRvdHRlZFF1YXJ0ZXIgfHxcbiAgICAgICAgICAgICAgICBub3RlLmR1cmF0aW9uID09IE5vdGVEdXJhdGlvbi5Eb3R0ZWRFaWdodGggfHwgb3ZlcmxhcCkge1xuXG4gICAgICAgICAgICAgICAgeG5vdGUgKz0gU2hlZXRNdXNpYy5Ob3RlV2lkdGgvMjtcbiAgICAgICAgICAgIH0gXG4gICAgICAgICAgICBnLkRyYXdTdHJpbmcoTm90ZU5hbWUobm90ZS5udW1iZXIsIG5vdGUud2hpdGVub3RlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLkxldHRlckZvbnQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgIEJydXNoZXMuQmxhY2ssXG4gICAgICAgICAgICAgICAgICAgICAgICAgeG5vdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgeW5vdGUgLSBTaGVldE11c2ljLk5vdGVIZWlnaHQvMik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgY2hvcmRzIGNhbiBiZSBjb25uZWN0ZWQsIHdoZXJlIHRoZWlyIHN0ZW1zIGFyZVxuICAgICAqIGpvaW5lZCBieSBhIGhvcml6b250YWwgYmVhbS4gSW4gb3JkZXIgdG8gY3JlYXRlIHRoZSBiZWFtOlxuICAgICAqXG4gICAgICogLSBUaGUgY2hvcmRzIG11c3QgYmUgaW4gdGhlIHNhbWUgbWVhc3VyZS5cbiAgICAgKiAtIFRoZSBjaG9yZCBzdGVtcyBzaG91bGQgbm90IGJlIGEgZG90dGVkIGR1cmF0aW9uLlxuICAgICAqIC0gVGhlIGNob3JkIHN0ZW1zIG11c3QgYmUgdGhlIHNhbWUgZHVyYXRpb24sIHdpdGggb25lIGV4Y2VwdGlvblxuICAgICAqICAgKERvdHRlZCBFaWdodGggdG8gU2l4dGVlbnRoKS5cbiAgICAgKiAtIFRoZSBzdGVtcyBtdXN0IGFsbCBwb2ludCBpbiB0aGUgc2FtZSBkaXJlY3Rpb24gKHVwIG9yIGRvd24pLlxuICAgICAqIC0gVGhlIGNob3JkIGNhbm5vdCBhbHJlYWR5IGJlIHBhcnQgb2YgYSBiZWFtLlxuICAgICAqXG4gICAgICogLSA2LWNob3JkIGJlYW1zIG11c3QgYmUgOHRoIG5vdGVzIGluIDMvNCwgNi84LCBvciA2LzQgdGltZVxuICAgICAqIC0gMy1jaG9yZCBiZWFtcyBtdXN0IGJlIGVpdGhlciB0cmlwbGV0cywgb3IgOHRoIG5vdGVzICgxMi84IHRpbWUgc2lnbmF0dXJlKVxuICAgICAqIC0gNC1jaG9yZCBiZWFtcyBhcmUgb2sgZm9yIDIvMiwgMi80IG9yIDQvNCB0aW1lLCBhbnkgZHVyYXRpb25cbiAgICAgKiAtIDQtY2hvcmQgYmVhbXMgYXJlIG9rIGZvciBvdGhlciB0aW1lcyBpZiB0aGUgZHVyYXRpb24gaXMgMTZ0aFxuICAgICAqIC0gMi1jaG9yZCBiZWFtcyBhcmUgb2sgZm9yIGFueSBkdXJhdGlvblxuICAgICAqXG4gICAgICogSWYgc3RhcnRRdWFydGVyIGlzIHRydWUsIHRoZSBmaXJzdCBub3RlIHNob3VsZCBzdGFydCBvbiBhIHF1YXJ0ZXIgbm90ZVxuICAgICAqIChvbmx5IGFwcGxpZXMgdG8gMi1jaG9yZCBiZWFtcykuXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBcbiAgICBib29sIENhbkNyZWF0ZUJlYW0oQ2hvcmRTeW1ib2xbXSBjaG9yZHMsIFRpbWVTaWduYXR1cmUgdGltZSwgYm9vbCBzdGFydFF1YXJ0ZXIpIHtcbiAgICAgICAgaW50IG51bUNob3JkcyA9IGNob3Jkcy5MZW5ndGg7XG4gICAgICAgIFN0ZW0gZmlyc3RTdGVtID0gY2hvcmRzWzBdLlN0ZW07XG4gICAgICAgIFN0ZW0gbGFzdFN0ZW0gPSBjaG9yZHNbY2hvcmRzLkxlbmd0aC0xXS5TdGVtO1xuICAgICAgICBpZiAoZmlyc3RTdGVtID09IG51bGwgfHwgbGFzdFN0ZW0gPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGludCBtZWFzdXJlID0gY2hvcmRzWzBdLlN0YXJ0VGltZSAvIHRpbWUuTWVhc3VyZTtcbiAgICAgICAgTm90ZUR1cmF0aW9uIGR1ciA9IGZpcnN0U3RlbS5EdXJhdGlvbjtcbiAgICAgICAgTm90ZUR1cmF0aW9uIGR1cjIgPSBsYXN0U3RlbS5EdXJhdGlvbjtcblxuICAgICAgICBib29sIGRvdHRlZDhfdG9fMTYgPSBmYWxzZTtcbiAgICAgICAgaWYgKGNob3Jkcy5MZW5ndGggPT0gMiAmJiBkdXIgPT0gTm90ZUR1cmF0aW9uLkRvdHRlZEVpZ2h0aCAmJlxuICAgICAgICAgICAgZHVyMiA9PSBOb3RlRHVyYXRpb24uU2l4dGVlbnRoKSB7XG4gICAgICAgICAgICBkb3R0ZWQ4X3RvXzE2ID0gdHJ1ZTtcbiAgICAgICAgfSBcblxuICAgICAgICBpZiAoZHVyID09IE5vdGVEdXJhdGlvbi5XaG9sZSB8fCBkdXIgPT0gTm90ZUR1cmF0aW9uLkhhbGYgfHxcbiAgICAgICAgICAgIGR1ciA9PSBOb3RlRHVyYXRpb24uRG90dGVkSGFsZiB8fCBkdXIgPT0gTm90ZUR1cmF0aW9uLlF1YXJ0ZXIgfHxcbiAgICAgICAgICAgIGR1ciA9PSBOb3RlRHVyYXRpb24uRG90dGVkUXVhcnRlciB8fFxuICAgICAgICAgICAgKGR1ciA9PSBOb3RlRHVyYXRpb24uRG90dGVkRWlnaHRoICYmICFkb3R0ZWQ4X3RvXzE2KSkge1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobnVtQ2hvcmRzID09IDYpIHtcbiAgICAgICAgICAgIGlmIChkdXIgIT0gTm90ZUR1cmF0aW9uLkVpZ2h0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJvb2wgY29ycmVjdFRpbWUgPSBcbiAgICAgICAgICAgICAgICgodGltZS5OdW1lcmF0b3IgPT0gMyAmJiB0aW1lLkRlbm9taW5hdG9yID09IDQpIHx8XG4gICAgICAgICAgICAgICAgKHRpbWUuTnVtZXJhdG9yID09IDYgJiYgdGltZS5EZW5vbWluYXRvciA9PSA4KSB8fFxuICAgICAgICAgICAgICAgICh0aW1lLk51bWVyYXRvciA9PSA2ICYmIHRpbWUuRGVub21pbmF0b3IgPT0gNCkgKTtcblxuICAgICAgICAgICAgaWYgKCFjb3JyZWN0VGltZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRpbWUuTnVtZXJhdG9yID09IDYgJiYgdGltZS5EZW5vbWluYXRvciA9PSA0KSB7XG4gICAgICAgICAgICAgICAgLyogZmlyc3QgY2hvcmQgbXVzdCBzdGFydCBhdCAxc3Qgb3IgNHRoIHF1YXJ0ZXIgbm90ZSAqL1xuICAgICAgICAgICAgICAgIGludCBiZWF0ID0gdGltZS5RdWFydGVyICogMztcbiAgICAgICAgICAgICAgICBpZiAoKGNob3Jkc1swXS5TdGFydFRpbWUgJSBiZWF0KSA+IHRpbWUuUXVhcnRlci82KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG51bUNob3JkcyA9PSA0KSB7XG4gICAgICAgICAgICBpZiAodGltZS5OdW1lcmF0b3IgPT0gMyAmJiB0aW1lLkRlbm9taW5hdG9yID09IDgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBib29sIGNvcnJlY3RUaW1lID0gXG4gICAgICAgICAgICAgICh0aW1lLk51bWVyYXRvciA9PSAyIHx8IHRpbWUuTnVtZXJhdG9yID09IDQgfHwgdGltZS5OdW1lcmF0b3IgPT0gOCk7XG4gICAgICAgICAgICBpZiAoIWNvcnJlY3RUaW1lICYmIGR1ciAhPSBOb3RlRHVyYXRpb24uU2l4dGVlbnRoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBjaG9yZCBtdXN0IHN0YXJ0IG9uIHF1YXJ0ZXIgbm90ZSAqL1xuICAgICAgICAgICAgaW50IGJlYXQgPSB0aW1lLlF1YXJ0ZXI7XG4gICAgICAgICAgICBpZiAoZHVyID09IE5vdGVEdXJhdGlvbi5FaWdodGgpIHtcbiAgICAgICAgICAgICAgICAvKiA4dGggbm90ZSBjaG9yZCBtdXN0IHN0YXJ0IG9uIDFzdCBvciAzcmQgcXVhcnRlciBub3RlICovXG4gICAgICAgICAgICAgICAgYmVhdCA9IHRpbWUuUXVhcnRlciAqIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChkdXIgPT0gTm90ZUR1cmF0aW9uLlRoaXJ0eVNlY29uZCkge1xuICAgICAgICAgICAgICAgIC8qIDMybmQgbm90ZSBtdXN0IHN0YXJ0IG9uIGFuIDh0aCBiZWF0ICovXG4gICAgICAgICAgICAgICAgYmVhdCA9IHRpbWUuUXVhcnRlciAvIDI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgoY2hvcmRzWzBdLlN0YXJ0VGltZSAlIGJlYXQpID4gdGltZS5RdWFydGVyLzYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobnVtQ2hvcmRzID09IDMpIHtcbiAgICAgICAgICAgIGJvb2wgdmFsaWQgPSAoZHVyID09IE5vdGVEdXJhdGlvbi5UcmlwbGV0KSB8fCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKGR1ciA9PSBOb3RlRHVyYXRpb24uRWlnaHRoICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lLk51bWVyYXRvciA9PSAxMiAmJiB0aW1lLkRlbm9taW5hdG9yID09IDgpO1xuICAgICAgICAgICAgaWYgKCF2YWxpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogY2hvcmQgbXVzdCBzdGFydCBvbiBxdWFydGVyIG5vdGUgKi9cbiAgICAgICAgICAgIGludCBiZWF0ID0gdGltZS5RdWFydGVyO1xuICAgICAgICAgICAgaWYgKHRpbWUuTnVtZXJhdG9yID09IDEyICYmIHRpbWUuRGVub21pbmF0b3IgPT0gOCkge1xuICAgICAgICAgICAgICAgIC8qIEluIDEyLzggdGltZSwgY2hvcmQgbXVzdCBzdGFydCBvbiAzKjh0aCBiZWF0ICovXG4gICAgICAgICAgICAgICAgYmVhdCA9IHRpbWUuUXVhcnRlci8yICogMztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoY2hvcmRzWzBdLlN0YXJ0VGltZSAlIGJlYXQpID4gdGltZS5RdWFydGVyLzYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmIChudW1DaG9yZHMgPT0gMikge1xuICAgICAgICAgICAgaWYgKHN0YXJ0UXVhcnRlcikge1xuICAgICAgICAgICAgICAgIGludCBiZWF0ID0gdGltZS5RdWFydGVyO1xuICAgICAgICAgICAgICAgIGlmICgoY2hvcmRzWzBdLlN0YXJ0VGltZSAlIGJlYXQpID4gdGltZS5RdWFydGVyLzYpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvcmVhY2ggKENob3JkU3ltYm9sIGNob3JkIGluIGNob3Jkcykge1xuICAgICAgICAgICAgaWYgKChjaG9yZC5TdGFydFRpbWUgLyB0aW1lLk1lYXN1cmUpICE9IG1lYXN1cmUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKGNob3JkLlN0ZW0gPT0gbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAoY2hvcmQuU3RlbS5EdXJhdGlvbiAhPSBkdXIgJiYgIWRvdHRlZDhfdG9fMTYpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKGNob3JkLlN0ZW0uaXNCZWFtKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIENoZWNrIHRoYXQgYWxsIHN0ZW1zIGNhbiBwb2ludCBpbiBzYW1lIGRpcmVjdGlvbiAqL1xuICAgICAgICBib29sIGhhc1R3b1N0ZW1zID0gZmFsc2U7XG4gICAgICAgIGludCBkaXJlY3Rpb24gPSBTdGVtLlVwOyBcbiAgICAgICAgZm9yZWFjaCAoQ2hvcmRTeW1ib2wgY2hvcmQgaW4gY2hvcmRzKSB7XG4gICAgICAgICAgICBpZiAoY2hvcmQuSGFzVHdvU3RlbXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoaGFzVHdvU3RlbXMgJiYgY2hvcmQuU3RlbS5EaXJlY3Rpb24gIT0gZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaGFzVHdvU3RlbXMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGNob3JkLlN0ZW0uRGlyZWN0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyogR2V0IHRoZSBmaW5hbCBzdGVtIGRpcmVjdGlvbiAqL1xuICAgICAgICBpZiAoIWhhc1R3b1N0ZW1zKSB7XG4gICAgICAgICAgICBXaGl0ZU5vdGUgbm90ZTE7XG4gICAgICAgICAgICBXaGl0ZU5vdGUgbm90ZTI7XG4gICAgICAgICAgICBub3RlMSA9IChmaXJzdFN0ZW0uRGlyZWN0aW9uID09IFN0ZW0uVXAgPyBmaXJzdFN0ZW0uVG9wIDogZmlyc3RTdGVtLkJvdHRvbSk7XG4gICAgICAgICAgICBub3RlMiA9IChsYXN0U3RlbS5EaXJlY3Rpb24gPT0gU3RlbS5VcCA/IGxhc3RTdGVtLlRvcCA6IGxhc3RTdGVtLkJvdHRvbSk7XG4gICAgICAgICAgICBkaXJlY3Rpb24gPSBTdGVtRGlyZWN0aW9uKG5vdGUxLCBub3RlMiwgY2hvcmRzWzBdLkNsZWYpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogSWYgdGhlIG5vdGVzIGFyZSB0b28gZmFyIGFwYXJ0LCBkb24ndCB1c2UgYSBiZWFtICovXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT0gU3RlbS5VcCkge1xuICAgICAgICAgICAgaWYgKE1hdGguQWJzKGZpcnN0U3RlbS5Ub3AuRGlzdChsYXN0U3RlbS5Ub3ApKSA+PSAxMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChNYXRoLkFicyhmaXJzdFN0ZW0uQm90dG9tLkRpc3QobGFzdFN0ZW0uQm90dG9tKSkgPj0gMTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG5cbiAgICAvKiogQ29ubmVjdCB0aGUgY2hvcmRzIHVzaW5nIGEgaG9yaXpvbnRhbCBiZWFtLiBcbiAgICAgKlxuICAgICAqIHNwYWNpbmcgaXMgdGhlIGhvcml6b250YWwgZGlzdGFuY2UgKGluIHBpeGVscykgYmV0d2VlbiB0aGUgcmlnaHQgc2lkZSBcbiAgICAgKiBvZiB0aGUgZmlyc3QgY2hvcmQsIGFuZCB0aGUgcmlnaHQgc2lkZSBvZiB0aGUgbGFzdCBjaG9yZC5cbiAgICAgKlxuICAgICAqIFRvIG1ha2UgdGhlIGJlYW06XG4gICAgICogLSBDaGFuZ2UgdGhlIHN0ZW0gZGlyZWN0aW9ucyBmb3IgZWFjaCBjaG9yZCwgc28gdGhleSBtYXRjaC5cbiAgICAgKiAtIEluIHRoZSBmaXJzdCBjaG9yZCwgcGFzcyB0aGUgc3RlbSBsb2NhdGlvbiBvZiB0aGUgbGFzdCBjaG9yZCwgYW5kXG4gICAgICogICB0aGUgaG9yaXpvbnRhbCBzcGFjaW5nIHRvIHRoYXQgbGFzdCBzdGVtLlxuICAgICAqIC0gTWFyayBhbGwgY2hvcmRzIChleGNlcHQgdGhlIGZpcnN0KSBhcyBcInJlY2VpdmVyXCIgcGFpcnMsIHNvIHRoYXQgXG4gICAgICogICB0aGV5IGRvbid0IGRyYXcgYSBjdXJ2eSBzdGVtLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgXG4gICAgdm9pZCBDcmVhdGVCZWFtKENob3JkU3ltYm9sW10gY2hvcmRzLCBpbnQgc3BhY2luZykge1xuICAgICAgICBTdGVtIGZpcnN0U3RlbSA9IGNob3Jkc1swXS5TdGVtO1xuICAgICAgICBTdGVtIGxhc3RTdGVtID0gY2hvcmRzW2Nob3Jkcy5MZW5ndGgtMV0uU3RlbTtcblxuICAgICAgICAvKiBDYWxjdWxhdGUgdGhlIG5ldyBzdGVtIGRpcmVjdGlvbiAqL1xuICAgICAgICBpbnQgbmV3ZGlyZWN0aW9uID0gLTE7XG4gICAgICAgIGZvcmVhY2ggKENob3JkU3ltYm9sIGNob3JkIGluIGNob3Jkcykge1xuICAgICAgICAgICAgaWYgKGNob3JkLkhhc1R3b1N0ZW1zKSB7XG4gICAgICAgICAgICAgICAgbmV3ZGlyZWN0aW9uID0gY2hvcmQuU3RlbS5EaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmV3ZGlyZWN0aW9uID09IC0xKSB7XG4gICAgICAgICAgICBXaGl0ZU5vdGUgbm90ZTE7XG4gICAgICAgICAgICBXaGl0ZU5vdGUgbm90ZTI7XG4gICAgICAgICAgICBub3RlMSA9IChmaXJzdFN0ZW0uRGlyZWN0aW9uID09IFN0ZW0uVXAgPyBmaXJzdFN0ZW0uVG9wIDogZmlyc3RTdGVtLkJvdHRvbSk7XG4gICAgICAgICAgICBub3RlMiA9IChsYXN0U3RlbS5EaXJlY3Rpb24gPT0gU3RlbS5VcCA/IGxhc3RTdGVtLlRvcCA6IGxhc3RTdGVtLkJvdHRvbSk7XG4gICAgICAgICAgICBuZXdkaXJlY3Rpb24gPSBTdGVtRGlyZWN0aW9uKG5vdGUxLCBub3RlMiwgY2hvcmRzWzBdLkNsZWYpO1xuICAgICAgICB9XG4gICAgICAgIGZvcmVhY2ggKENob3JkU3ltYm9sIGNob3JkIGluIGNob3Jkcykge1xuICAgICAgICAgICAgY2hvcmQuU3RlbS5EaXJlY3Rpb24gPSBuZXdkaXJlY3Rpb247XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hvcmRzLkxlbmd0aCA9PSAyKSB7XG4gICAgICAgICAgICBCcmluZ1N0ZW1zQ2xvc2VyKGNob3Jkcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBMaW5lVXBTdGVtRW5kcyhjaG9yZHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZmlyc3RTdGVtLlNldFBhaXIobGFzdFN0ZW0sIHNwYWNpbmcpO1xuICAgICAgICBmb3IgKGludCBpID0gMTsgaSA8IGNob3Jkcy5MZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY2hvcmRzW2ldLlN0ZW0uUmVjZWl2ZXIgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIFdlJ3JlIGNvbm5lY3RpbmcgdGhlIHN0ZW1zIG9mIHR3byBjaG9yZHMgdXNpbmcgYSBob3Jpem9udGFsIGJlYW0uXG4gICAgICogIEFkanVzdCB0aGUgdmVydGljYWwgZW5kcG9pbnQgb2YgdGhlIHN0ZW1zLCBzbyB0aGF0IHRoZXkncmUgY2xvc2VyXG4gICAgICogIHRvZ2V0aGVyLiAgRm9yIGEgZG90dGVkIDh0aCB0byAxNnRoIGJlYW0sIGluY3JlYXNlIHRoZSBzdGVtIG9mIHRoZVxuICAgICAqICBkb3R0ZWQgZWlnaHRoLCBzbyB0aGF0IGl0J3MgYXMgbG9uZyBhcyBhIDE2dGggc3RlbS5cbiAgICAgKi9cbiAgICBzdGF0aWMgdm9pZFxuICAgIEJyaW5nU3RlbXNDbG9zZXIoQ2hvcmRTeW1ib2xbXSBjaG9yZHMpIHtcbiAgICAgICAgU3RlbSBmaXJzdFN0ZW0gPSBjaG9yZHNbMF0uU3RlbTtcbiAgICAgICAgU3RlbSBsYXN0U3RlbSA9IGNob3Jkc1sxXS5TdGVtO1xuXG4gICAgICAgIC8qIElmIHdlJ3JlIGNvbm5lY3RpbmcgYSBkb3R0ZWQgOHRoIHRvIGEgMTZ0aCwgaW5jcmVhc2VcbiAgICAgICAgICogdGhlIHN0ZW0gZW5kIG9mIHRoZSBkb3R0ZWQgZWlnaHRoLlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKGZpcnN0U3RlbS5EdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uRG90dGVkRWlnaHRoICYmXG4gICAgICAgICAgICBsYXN0U3RlbS5EdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uU2l4dGVlbnRoKSB7XG4gICAgICAgICAgICBpZiAoZmlyc3RTdGVtLkRpcmVjdGlvbiA9PSBTdGVtLlVwKSB7XG4gICAgICAgICAgICAgICAgZmlyc3RTdGVtLkVuZCA9IGZpcnN0U3RlbS5FbmQuQWRkKDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZmlyc3RTdGVtLkVuZCA9IGZpcnN0U3RlbS5FbmQuQWRkKC0yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qIEJyaW5nIHRoZSBzdGVtIGVuZHMgY2xvc2VyIHRvZ2V0aGVyICovXG4gICAgICAgIGludCBkaXN0YW5jZSA9IE1hdGguQWJzKGZpcnN0U3RlbS5FbmQuRGlzdChsYXN0U3RlbS5FbmQpKTtcbiAgICAgICAgaWYgKGZpcnN0U3RlbS5EaXJlY3Rpb24gPT0gU3RlbS5VcCkge1xuICAgICAgICAgICAgaWYgKFdoaXRlTm90ZS5NYXgoZmlyc3RTdGVtLkVuZCwgbGFzdFN0ZW0uRW5kKSA9PSBmaXJzdFN0ZW0uRW5kKVxuICAgICAgICAgICAgICAgIGxhc3RTdGVtLkVuZCA9IGxhc3RTdGVtLkVuZC5BZGQoZGlzdGFuY2UvMik7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZmlyc3RTdGVtLkVuZCA9IGZpcnN0U3RlbS5FbmQuQWRkKGRpc3RhbmNlLzIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKFdoaXRlTm90ZS5NaW4oZmlyc3RTdGVtLkVuZCwgbGFzdFN0ZW0uRW5kKSA9PSBmaXJzdFN0ZW0uRW5kKVxuICAgICAgICAgICAgICAgIGxhc3RTdGVtLkVuZCA9IGxhc3RTdGVtLkVuZC5BZGQoLWRpc3RhbmNlLzIpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGZpcnN0U3RlbS5FbmQgPSBmaXJzdFN0ZW0uRW5kLkFkZCgtZGlzdGFuY2UvMik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogV2UncmUgY29ubmVjdGluZyB0aGUgc3RlbXMgb2YgdGhyZWUgb3IgbW9yZSBjaG9yZHMgdXNpbmcgYSBob3Jpem9udGFsIGJlYW0uXG4gICAgICogIEFkanVzdCB0aGUgdmVydGljYWwgZW5kcG9pbnQgb2YgdGhlIHN0ZW1zLCBzbyB0aGF0IHRoZSBtaWRkbGUgY2hvcmQgc3RlbXNcbiAgICAgKiAgYXJlIHZlcnRpY2FsbHkgaW4gYmV0d2VlbiB0aGUgZmlyc3QgYW5kIGxhc3Qgc3RlbS5cbiAgICAgKi9cbiAgICBzdGF0aWMgdm9pZFxuICAgIExpbmVVcFN0ZW1FbmRzKENob3JkU3ltYm9sW10gY2hvcmRzKSB7XG4gICAgICAgIFN0ZW0gZmlyc3RTdGVtID0gY2hvcmRzWzBdLlN0ZW07XG4gICAgICAgIFN0ZW0gbGFzdFN0ZW0gPSBjaG9yZHNbY2hvcmRzLkxlbmd0aC0xXS5TdGVtO1xuICAgICAgICBTdGVtIG1pZGRsZVN0ZW0gPSBjaG9yZHNbMV0uU3RlbTtcblxuICAgICAgICBpZiAoZmlyc3RTdGVtLkRpcmVjdGlvbiA9PSBTdGVtLlVwKSB7XG4gICAgICAgICAgICAvKiBGaW5kIHRoZSBoaWdoZXN0IHN0ZW0uIFRoZSBiZWFtIHdpbGwgZWl0aGVyOlxuICAgICAgICAgICAgICogLSBTbGFudCBkb3dud2FyZHMgKGZpcnN0IHN0ZW0gaXMgaGlnaGVzdClcbiAgICAgICAgICAgICAqIC0gU2xhbnQgdXB3YXJkcyAobGFzdCBzdGVtIGlzIGhpZ2hlc3QpXG4gICAgICAgICAgICAgKiAtIEJlIHN0cmFpZ2h0IChtaWRkbGUgc3RlbSBpcyBoaWdoZXN0KVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBXaGl0ZU5vdGUgdG9wID0gZmlyc3RTdGVtLkVuZDtcbiAgICAgICAgICAgIGZvcmVhY2ggKENob3JkU3ltYm9sIGNob3JkIGluIGNob3Jkcykge1xuICAgICAgICAgICAgICAgIHRvcCA9IFdoaXRlTm90ZS5NYXgodG9wLCBjaG9yZC5TdGVtLkVuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodG9wID09IGZpcnN0U3RlbS5FbmQgJiYgdG9wLkRpc3QobGFzdFN0ZW0uRW5kKSA+PSAyKSB7XG4gICAgICAgICAgICAgICAgZmlyc3RTdGVtLkVuZCA9IHRvcDtcbiAgICAgICAgICAgICAgICBtaWRkbGVTdGVtLkVuZCA9IHRvcC5BZGQoLTEpO1xuICAgICAgICAgICAgICAgIGxhc3RTdGVtLkVuZCA9IHRvcC5BZGQoLTIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodG9wID09IGxhc3RTdGVtLkVuZCAmJiB0b3AuRGlzdChmaXJzdFN0ZW0uRW5kKSA+PSAyKSB7XG4gICAgICAgICAgICAgICAgZmlyc3RTdGVtLkVuZCA9IHRvcC5BZGQoLTIpO1xuICAgICAgICAgICAgICAgIG1pZGRsZVN0ZW0uRW5kID0gdG9wLkFkZCgtMSk7XG4gICAgICAgICAgICAgICAgbGFzdFN0ZW0uRW5kID0gdG9wO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZmlyc3RTdGVtLkVuZCA9IHRvcDtcbiAgICAgICAgICAgICAgICBtaWRkbGVTdGVtLkVuZCA9IHRvcDtcbiAgICAgICAgICAgICAgICBsYXN0U3RlbS5FbmQgPSB0b3A7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvKiBGaW5kIHRoZSBib3R0b21tb3N0IHN0ZW0uIFRoZSBiZWFtIHdpbGwgZWl0aGVyOlxuICAgICAgICAgICAgICogLSBTbGFudCB1cHdhcmRzIChmaXJzdCBzdGVtIGlzIGxvd2VzdClcbiAgICAgICAgICAgICAqIC0gU2xhbnQgZG93bndhcmRzIChsYXN0IHN0ZW0gaXMgbG93ZXN0KVxuICAgICAgICAgICAgICogLSBCZSBzdHJhaWdodCAobWlkZGxlIHN0ZW0gaXMgaGlnaGVzdClcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgV2hpdGVOb3RlIGJvdHRvbSA9IGZpcnN0U3RlbS5FbmQ7XG4gICAgICAgICAgICBmb3JlYWNoIChDaG9yZFN5bWJvbCBjaG9yZCBpbiBjaG9yZHMpIHtcbiAgICAgICAgICAgICAgICBib3R0b20gPSBXaGl0ZU5vdGUuTWluKGJvdHRvbSwgY2hvcmQuU3RlbS5FbmQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYm90dG9tID09IGZpcnN0U3RlbS5FbmQgJiYgbGFzdFN0ZW0uRW5kLkRpc3QoYm90dG9tKSA+PSAyKSB7XG4gICAgICAgICAgICAgICAgbWlkZGxlU3RlbS5FbmQgPSBib3R0b20uQWRkKDEpO1xuICAgICAgICAgICAgICAgIGxhc3RTdGVtLkVuZCA9IGJvdHRvbS5BZGQoMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChib3R0b20gPT0gbGFzdFN0ZW0uRW5kICYmIGZpcnN0U3RlbS5FbmQuRGlzdChib3R0b20pID49IDIpIHtcbiAgICAgICAgICAgICAgICBtaWRkbGVTdGVtLkVuZCA9IGJvdHRvbS5BZGQoMSk7XG4gICAgICAgICAgICAgICAgZmlyc3RTdGVtLkVuZCA9IGJvdHRvbS5BZGQoMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmaXJzdFN0ZW0uRW5kID0gYm90dG9tO1xuICAgICAgICAgICAgICAgIG1pZGRsZVN0ZW0uRW5kID0gYm90dG9tO1xuICAgICAgICAgICAgICAgIGxhc3RTdGVtLkVuZCA9IGJvdHRvbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qIEFsbCBtaWRkbGUgc3RlbXMgaGF2ZSB0aGUgc2FtZSBlbmQgKi9cbiAgICAgICAgZm9yIChpbnQgaSA9IDE7IGkgPCBjaG9yZHMuTGVuZ3RoLTE7IGkrKykge1xuICAgICAgICAgICAgU3RlbSBzdGVtID0gY2hvcmRzW2ldLlN0ZW07XG4gICAgICAgICAgICBzdGVtLkVuZCA9IG1pZGRsZVN0ZW0uRW5kO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG92ZXJyaWRlIHN0cmluZyBUb1N0cmluZygpIHtcbiAgICAgICAgc3RyaW5nIHJlc3VsdCA9IHN0cmluZy5Gb3JtYXQoXCJDaG9yZFN5bWJvbCBjbGVmPXswfSBzdGFydD17MX0gZW5kPXsyfSB3aWR0aD17M30gaGFzdHdvc3RlbXM9ezR9IFwiLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlZiwgU3RhcnRUaW1lLCBFbmRUaW1lLCBXaWR0aCwgaGFzdHdvc3RlbXMpO1xuICAgICAgICBmb3JlYWNoIChBY2NpZFN5bWJvbCBzeW1ib2wgaW4gYWNjaWRzeW1ib2xzKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gc3ltYm9sLlRvU3RyaW5nKCkgKyBcIiBcIjtcbiAgICAgICAgfVxuICAgICAgICBmb3JlYWNoIChOb3RlRGF0YSBub3RlIGluIG5vdGVkYXRhKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gc3RyaW5nLkZvcm1hdChcIk5vdGUgd2hpdGVub3RlPXswfSBkdXJhdGlvbj17MX0gbGVmdHNpZGU9ezJ9IFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90ZS53aGl0ZW5vdGUsIG5vdGUuZHVyYXRpb24sIG5vdGUubGVmdHNpZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGVtMSAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gc3RlbTEuVG9TdHJpbmcoKSArIFwiIFwiO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGVtMiAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gc3RlbTIuVG9TdHJpbmcoKSArIFwiIFwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7IFxuICAgIH1cblxufVxuXG5cbn1cblxuXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTEgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5JTztcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyB7XG5cbi8qKiBUaGUgcG9zc2libGUgY2xlZnMsIFRyZWJsZSBvciBCYXNzICovXG5wdWJsaWMgZW51bSBDbGVmIHsgVHJlYmxlLCBCYXNzIH07XG5cbi8qKiBAY2xhc3MgQ2xlZlN5bWJvbCBcbiAqIEEgQ2xlZlN5bWJvbCByZXByZXNlbnRzIGVpdGhlciBhIFRyZWJsZSBvciBCYXNzIENsZWYgaW1hZ2UuXG4gKiBUaGUgY2xlZiBjYW4gYmUgZWl0aGVyIG5vcm1hbCBvciBzbWFsbCBzaXplLiAgTm9ybWFsIHNpemUgaXNcbiAqIHVzZWQgYXQgdGhlIGJlZ2lubmluZyBvZiBhIG5ldyBzdGFmZiwgb24gdGhlIGxlZnQgc2lkZS4gIFRoZVxuICogc21hbGwgc3ltYm9scyBhcmUgdXNlZCB0byBzaG93IGNsZWYgY2hhbmdlcyB3aXRoaW4gYSBzdGFmZi5cbiAqL1xuXG5wdWJsaWMgY2xhc3MgQ2xlZlN5bWJvbCA6IE11c2ljU3ltYm9sIHtcbiAgICBwcml2YXRlIHN0YXRpYyBJbWFnZSB0cmVibGU7ICAvKiogVGhlIHRyZWJsZSBjbGVmIGltYWdlICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgSW1hZ2UgYmFzczsgICAgLyoqIFRoZSBiYXNzIGNsZWYgaW1hZ2UgKi9cblxuICAgIHByaXZhdGUgaW50IHN0YXJ0dGltZTsgICAgICAgIC8qKiBTdGFydCB0aW1lIG9mIHRoZSBzeW1ib2wgKi9cbiAgICBwcml2YXRlIGJvb2wgc21hbGxzaXplOyAgICAgICAvKiogVHJ1ZSBpZiB0aGlzIGlzIGEgc21hbGwgY2xlZiwgZmFsc2Ugb3RoZXJ3aXNlICovXG4gICAgcHJpdmF0ZSBDbGVmIGNsZWY7ICAgICAgICAgICAgLyoqIFRoZSBjbGVmLCBUcmVibGUgb3IgQmFzcyAqL1xuICAgIHByaXZhdGUgaW50IHdpZHRoO1xuXG4gICAgLyoqIENyZWF0ZSBhIG5ldyBDbGVmU3ltYm9sLCB3aXRoIHRoZSBnaXZlbiBjbGVmLCBzdGFydHRpbWUsIGFuZCBzaXplICovXG4gICAgcHVibGljIENsZWZTeW1ib2woQ2xlZiBjbGVmLCBpbnQgc3RhcnR0aW1lLCBib29sIHNtYWxsKSB7XG4gICAgICAgIHRoaXMuY2xlZiA9IGNsZWY7XG4gICAgICAgIHRoaXMuc3RhcnR0aW1lID0gc3RhcnR0aW1lO1xuICAgICAgICBzbWFsbHNpemUgPSBzbWFsbDtcbiAgICAgICAgTG9hZEltYWdlcygpO1xuICAgICAgICB3aWR0aCA9IE1pbldpZHRoO1xuICAgIH1cblxuICAgIC8qKiBMb2FkIHRoZSBUcmVibGUvQmFzcyBjbGVmIGltYWdlcyBpbnRvIG1lbW9yeS4gKi9cbiAgICBwcml2YXRlIHN0YXRpYyB2b2lkIExvYWRJbWFnZXMoKSB7XG4gICAgICAgIGlmICh0cmVibGUgPT0gbnVsbClcbiAgICAgICAgICAgIHRyZWJsZSA9IG5ldyBCaXRtYXAodHlwZW9mKENsZWZTeW1ib2wpLCBcIlJlc291cmNlcy5JbWFnZXMudHJlYmxlLnBuZ1wiKTtcblxuICAgICAgICBpZiAoYmFzcyA9PSBudWxsKVxuICAgICAgICAgICAgYmFzcyA9IG5ldyBCaXRtYXAodHlwZW9mKENsZWZTeW1ib2wpLCBcIlJlc291cmNlcy5JbWFnZXMuYmFzcy5wbmdcIik7XG5cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSB0aW1lIChpbiBwdWxzZXMpIHRoaXMgc3ltYm9sIG9jY3VycyBhdC5cbiAgICAgKiBUaGlzIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSBtZWFzdXJlIHRoaXMgc3ltYm9sIGJlbG9uZ3MgdG8uXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBTdGFydFRpbWUgeyBcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHN0YXJ0dGltZTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG1pbmltdW0gd2lkdGggKGluIHBpeGVscykgbmVlZGVkIHRvIGRyYXcgdGhpcyBzeW1ib2wgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IE1pbldpZHRoIHtcbiAgICAgICAgZ2V0IHsgXG4gICAgICAgICAgICBpZiAoc21hbGxzaXplKVxuICAgICAgICAgICAgICAgIHJldHVybiBTaGVldE11c2ljLk5vdGVXaWR0aCAqIDI7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIFNoZWV0TXVzaWMuTm90ZVdpZHRoICogMztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBHZXQvU2V0IHRoZSB3aWR0aCAoaW4gcGl4ZWxzKSBvZiB0aGlzIHN5bWJvbC4gVGhlIHdpZHRoIGlzIHNldFxuICAgICAqIGluIFNoZWV0TXVzaWMuQWxpZ25TeW1ib2xzKCkgdG8gdmVydGljYWxseSBhbGlnbiBzeW1ib2xzLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgV2lkdGgge1xuICAgICAgIGdldCB7IHJldHVybiB3aWR0aDsgfVxuICAgICAgIHNldCB7IHdpZHRoID0gdmFsdWU7IH1cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBudW1iZXIgb2YgcGl4ZWxzIHRoaXMgc3ltYm9sIGV4dGVuZHMgYWJvdmUgdGhlIHN0YWZmLiBVc2VkXG4gICAgICogIHRvIGRldGVybWluZSB0aGUgbWluaW11bSBoZWlnaHQgbmVlZGVkIGZvciB0aGUgc3RhZmYgKFN0YWZmLkZpbmRCb3VuZHMpLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgQWJvdmVTdGFmZiB7IFxuICAgICAgICBnZXQgeyBcbiAgICAgICAgICAgIGlmIChjbGVmID09IENsZWYuVHJlYmxlICYmICFzbWFsbHNpemUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFNoZWV0TXVzaWMuTm90ZUhlaWdodCAqIDI7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBudW1iZXIgb2YgcGl4ZWxzIHRoaXMgc3ltYm9sIGV4dGVuZHMgYmVsb3cgdGhlIHN0YWZmLiBVc2VkXG4gICAgICogIHRvIGRldGVybWluZSB0aGUgbWluaW11bSBoZWlnaHQgbmVlZGVkIGZvciB0aGUgc3RhZmYgKFN0YWZmLkZpbmRCb3VuZHMpLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgQmVsb3dTdGFmZiB7XG4gICAgICAgIGdldCB7XG4gICAgICAgICAgICBpZiAoY2xlZiA9PSBDbGVmLlRyZWJsZSAmJiAhc21hbGxzaXplKVxuICAgICAgICAgICAgICAgIHJldHVybiBTaGVldE11c2ljLk5vdGVIZWlnaHQgKiAyO1xuICAgICAgICAgICAgZWxzZSBpZiAoY2xlZiA9PSBDbGVmLlRyZWJsZSAmJiBzbWFsbHNpemUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBEcmF3IHRoZSBzeW1ib2wuXG4gICAgICogQHBhcmFtIHl0b3AgVGhlIHlsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIFxuICAgIHZvaWQgRHJhdyhHcmFwaGljcyBnLCBQZW4gcGVuLCBpbnQgeXRvcCkge1xuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybShXaWR0aCAtIE1pbldpZHRoLCAwKTtcbiAgICAgICAgaW50IHkgPSB5dG9wO1xuICAgICAgICBJbWFnZSBpbWFnZTtcbiAgICAgICAgaW50IGhlaWdodDtcblxuICAgICAgICAvKiBHZXQgdGhlIGltYWdlLCBoZWlnaHQsIGFuZCB0b3AgeSBwaXhlbCwgZGVwZW5kaW5nIG9uIHRoZSBjbGVmXG4gICAgICAgICAqIGFuZCB0aGUgaW1hZ2Ugc2l6ZS5cbiAgICAgICAgICovXG4gICAgICAgIGlmIChjbGVmID09IENsZWYuVHJlYmxlKSB7XG4gICAgICAgICAgICBpbWFnZSA9IHRyZWJsZTtcbiAgICAgICAgICAgIGlmIChzbWFsbHNpemUpIHtcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSBTaGVldE11c2ljLlN0YWZmSGVpZ2h0ICsgU2hlZXRNdXNpYy5TdGFmZkhlaWdodC80O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSAzICogU2hlZXRNdXNpYy5TdGFmZkhlaWdodC8yICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7XG4gICAgICAgICAgICAgICAgeSA9IHl0b3AgLSBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpbWFnZSA9IGJhc3M7XG4gICAgICAgICAgICBpZiAoc21hbGxzaXplKSB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gU2hlZXRNdXNpYy5TdGFmZkhlaWdodCAtIDMqU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhlaWdodCA9IFNoZWV0TXVzaWMuU3RhZmZIZWlnaHQgLSBTaGVldE11c2ljLk5vdGVIZWlnaHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTY2FsZSB0aGUgaW1hZ2Ugd2lkdGggdG8gbWF0Y2ggdGhlIGhlaWdodCAqL1xuICAgICAgICBpbnQgaW1nd2lkdGggPSBpbWFnZS5XaWR0aCAqIGhlaWdodCAvIGltYWdlLkhlaWdodDtcbiAgICAgICAgZy5EcmF3SW1hZ2UoaW1hZ2UsIDAsIHksIGltZ3dpZHRoLCBoZWlnaHQpO1xuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgtKFdpZHRoIC0gTWluV2lkdGgpLCAwKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb3ZlcnJpZGUgc3RyaW5nIFRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gc3RyaW5nLkZvcm1hdChcIkNsZWZTeW1ib2wgY2xlZj17MH0gc21hbGw9ezF9IHdpZHRoPXsyfVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVmLCBzbWFsbHNpemUsIHdpZHRoKTtcbiAgICB9XG59XG5cblxufVxuXG4iLCJ1c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcbntcbiAgICBwdWJsaWMgY2xhc3MgRmlsZVN0cmVhbTpTdHJlYW1cbiAgICB7XG4gICAgICAgIHB1YmxpYyBGaWxlU3RyZWFtKHN0cmluZyBmaWxlbmFtZSwgRmlsZU1vZGUgbW9kZSlcbiAgICAgICAge1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAwOS0yMDEyIE1hZGhhdiBWYWlkeWFuYXRoYW5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuXG51c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uSU87XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWMge1xuXG5cbi8qKiBAY2xhc3MgUGlhbm9cbiAqXG4gKiBUaGUgUGlhbm8gQ29udHJvbCBpcyB0aGUgcGFuZWwgYXQgdGhlIHRvcCB0aGF0IGRpc3BsYXlzIHRoZVxuICogcGlhbm8sIGFuZCBoaWdobGlnaHRzIHRoZSBwaWFubyBub3RlcyBkdXJpbmcgcGxheWJhY2suXG4gKiBUaGUgbWFpbiBtZXRob2RzIGFyZTpcbiAqXG4gKiBTZXRNaWRpRmlsZSgpIC0gU2V0IHRoZSBNaWRpIGZpbGUgdG8gdXNlIGZvciBzaGFkaW5nLiAgVGhlIE1pZGkgZmlsZVxuICogICAgICAgICAgICAgICAgIGlzIG5lZWRlZCB0byBkZXRlcm1pbmUgd2hpY2ggbm90ZXMgdG8gc2hhZGUuXG4gKlxuICogU2hhZGVOb3RlcygpIC0gU2hhZGUgbm90ZXMgb24gdGhlIHBpYW5vIHRoYXQgb2NjdXIgYXQgYSBnaXZlbiBwdWxzZSB0aW1lLlxuICpcbiAqL1xucHVibGljIGNsYXNzIFBpYW5vIDogQ29udHJvbCB7XG4gICAgcHVibGljIGNvbnN0IGludCBLZXlzUGVyT2N0YXZlID0gNztcbiAgICBwdWJsaWMgY29uc3QgaW50IE1heE9jdGF2ZSA9IDc7XG5cbiAgICBwcml2YXRlIHN0YXRpYyBpbnQgV2hpdGVLZXlXaWR0aDsgIC8qKiBXaWR0aCBvZiBhIHNpbmdsZSB3aGl0ZSBrZXkgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBpbnQgV2hpdGVLZXlIZWlnaHQ7IC8qKiBIZWlnaHQgb2YgYSBzaW5nbGUgd2hpdGUga2V5ICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgaW50IEJsYWNrS2V5V2lkdGg7ICAvKiogV2lkdGggb2YgYSBzaW5nbGUgYmxhY2sga2V5ICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgaW50IEJsYWNrS2V5SGVpZ2h0OyAvKiogSGVpZ2h0IG9mIGEgc2luZ2xlIGJsYWNrIGtleSAqL1xuICAgIHByaXZhdGUgc3RhdGljIGludCBtYXJnaW47ICAgICAgICAgLyoqIFRoZSB0b3AvbGVmdCBtYXJnaW4gdG8gdGhlIHBpYW5vICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgaW50IEJsYWNrQm9yZGVyOyAgICAvKiogVGhlIHdpZHRoIG9mIHRoZSBibGFjayBib3JkZXIgYXJvdW5kIHRoZSBrZXlzICovXG5cbiAgICBwcml2YXRlIHN0YXRpYyBpbnRbXSBibGFja0tleU9mZnNldHM7ICAgLyoqIFRoZSB4IHBpeGxlcyBvZiB0aGUgYmxhY2sga2V5cyAqL1xuXG4gICAgLyogVGhlIGdyYXkxUGVucyBmb3IgZHJhd2luZyBibGFjay9ncmF5IGxpbmVzICovXG4gICAgcHJpdmF0ZSBQZW4gZ3JheTFQZW4sIGdyYXkyUGVuLCBncmF5M1BlbjtcblxuICAgIC8qIFRoZSBicnVzaGVzIGZvciBmaWxsaW5nIHRoZSBrZXlzICovXG4gICAgcHJpdmF0ZSBCcnVzaCBncmF5MUJydXNoLCBncmF5MkJydXNoLCBzaGFkZUJydXNoLCBzaGFkZTJCcnVzaDtcblxuICAgIHByaXZhdGUgYm9vbCB1c2VUd29Db2xvcnM7ICAgICAgICAgICAgICAvKiogSWYgdHJ1ZSwgdXNlIHR3byBjb2xvcnMgZm9yIGhpZ2hsaWdodGluZyAqL1xuICAgIHByaXZhdGUgTGlzdDxNaWRpTm90ZT4gbm90ZXM7ICAgICAgICAgICAvKiogVGhlIE1pZGkgbm90ZXMgZm9yIHNoYWRpbmcgKi9cbiAgICBwcml2YXRlIGludCBtYXhTaGFkZUR1cmF0aW9uOyAgICAgICAgICAgLyoqIFRoZSBtYXhpbXVtIGR1cmF0aW9uIHdlJ2xsIHNoYWRlIGEgbm90ZSBmb3IgKi9cbiAgICBwcml2YXRlIGludCBzaG93Tm90ZUxldHRlcnM7ICAgICAgICAgICAgLyoqIERpc3BsYXkgdGhlIGxldHRlciBmb3IgZWFjaCBwaWFubyBub3RlICovXG4gICAgcHJpdmF0ZSBHcmFwaGljcyBncmFwaGljczsgICAgICAgICAgICAgIC8qKiBUaGUgZ3JhcGhpY3MgZm9yIHNoYWRpbmcgdGhlIG5vdGVzICovXG5cbiAgICAvKiogQ3JlYXRlIGEgbmV3IFBpYW5vLiAqL1xuICAgIHB1YmxpYyBQaWFubygpIHtcbiAgICAgICAgaW50IHNjcmVlbndpZHRoID0gMTAyNDsgLy9TeXN0ZW0uV2luZG93cy5Gb3Jtcy5TY3JlZW4uUHJpbWFyeVNjcmVlbi5Cb3VuZHMuV2lkdGg7XG4gICAgICAgIGlmIChzY3JlZW53aWR0aCA+PSAzMjAwKSB7XG4gICAgICAgICAgICAvKiBMaW51eC9Nb25vIGlzIHJlcG9ydGluZyB3aWR0aCBvZiA0IHNjcmVlbnMgKi9cbiAgICAgICAgICAgIHNjcmVlbndpZHRoID0gc2NyZWVud2lkdGggLyA0O1xuICAgICAgICB9XG4gICAgICAgIHNjcmVlbndpZHRoID0gc2NyZWVud2lkdGggKiA5NS8xMDA7XG4gICAgICAgIFdoaXRlS2V5V2lkdGggPSAoaW50KShzY3JlZW53aWR0aCAvICgyLjAgKyBLZXlzUGVyT2N0YXZlICogTWF4T2N0YXZlKSk7XG4gICAgICAgIGlmIChXaGl0ZUtleVdpZHRoICUgMiAhPSAwKSB7XG4gICAgICAgICAgICBXaGl0ZUtleVdpZHRoLS07XG4gICAgICAgIH1cbiAgICAgICAgbWFyZ2luID0gMDtcbiAgICAgICAgQmxhY2tCb3JkZXIgPSBXaGl0ZUtleVdpZHRoLzI7XG4gICAgICAgIFdoaXRlS2V5SGVpZ2h0ID0gV2hpdGVLZXlXaWR0aCAqIDU7XG4gICAgICAgIEJsYWNrS2V5V2lkdGggPSBXaGl0ZUtleVdpZHRoIC8gMjtcbiAgICAgICAgQmxhY2tLZXlIZWlnaHQgPSBXaGl0ZUtleUhlaWdodCAqIDUgLyA5OyBcblxuICAgICAgICBXaWR0aCA9IG1hcmdpbioyICsgQmxhY2tCb3JkZXIqMiArIFdoaXRlS2V5V2lkdGggKiBLZXlzUGVyT2N0YXZlICogTWF4T2N0YXZlO1xuICAgICAgICBIZWlnaHQgPSBtYXJnaW4qMiArIEJsYWNrQm9yZGVyKjMgKyBXaGl0ZUtleUhlaWdodDtcbiAgICAgICAgaWYgKGJsYWNrS2V5T2Zmc2V0cyA9PSBudWxsKSB7XG4gICAgICAgICAgICBibGFja0tleU9mZnNldHMgPSBuZXcgaW50W10geyBcbiAgICAgICAgICAgICAgICBXaGl0ZUtleVdpZHRoIC0gQmxhY2tLZXlXaWR0aC8yIC0gMSxcbiAgICAgICAgICAgICAgICBXaGl0ZUtleVdpZHRoICsgQmxhY2tLZXlXaWR0aC8yIC0gMSxcbiAgICAgICAgICAgICAgICAyKldoaXRlS2V5V2lkdGggLSBCbGFja0tleVdpZHRoLzIsXG4gICAgICAgICAgICAgICAgMipXaGl0ZUtleVdpZHRoICsgQmxhY2tLZXlXaWR0aC8yLFxuICAgICAgICAgICAgICAgIDQqV2hpdGVLZXlXaWR0aCAtIEJsYWNrS2V5V2lkdGgvMiAtIDEsXG4gICAgICAgICAgICAgICAgNCpXaGl0ZUtleVdpZHRoICsgQmxhY2tLZXlXaWR0aC8yIC0gMSxcbiAgICAgICAgICAgICAgICA1KldoaXRlS2V5V2lkdGggLSBCbGFja0tleVdpZHRoLzIsXG4gICAgICAgICAgICAgICAgNSpXaGl0ZUtleVdpZHRoICsgQmxhY2tLZXlXaWR0aC8yLFxuICAgICAgICAgICAgICAgIDYqV2hpdGVLZXlXaWR0aCAtIEJsYWNrS2V5V2lkdGgvMixcbiAgICAgICAgICAgICAgICA2KldoaXRlS2V5V2lkdGggKyBCbGFja0tleVdpZHRoLzJcbiAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBDb2xvciBncmF5MSA9IENvbG9yLkZyb21SZ2IoMTYsIDE2LCAxNik7XG4gICAgICAgIENvbG9yIGdyYXkyID0gQ29sb3IuRnJvbVJnYig5MCwgOTAsIDkwKTtcbiAgICAgICAgQ29sb3IgZ3JheTMgPSBDb2xvci5Gcm9tUmdiKDIwMCwgMjAwLCAyMDApO1xuICAgICAgICBDb2xvciBzaGFkZTEgPSBDb2xvci5Gcm9tUmdiKDIxMCwgMjA1LCAyMjApO1xuICAgICAgICBDb2xvciBzaGFkZTIgPSBDb2xvci5Gcm9tUmdiKDE1MCwgMjAwLCAyMjApO1xuXG4gICAgICAgIGdyYXkxUGVuID0gbmV3IFBlbihncmF5MSwgMSk7XG4gICAgICAgIGdyYXkyUGVuID0gbmV3IFBlbihncmF5MiwgMSk7XG4gICAgICAgIGdyYXkzUGVuID0gbmV3IFBlbihncmF5MywgMSk7XG5cbiAgICAgICAgZ3JheTFCcnVzaCA9IG5ldyBTb2xpZEJydXNoKGdyYXkxKTtcbiAgICAgICAgZ3JheTJCcnVzaCA9IG5ldyBTb2xpZEJydXNoKGdyYXkyKTtcbiAgICAgICAgc2hhZGVCcnVzaCA9IG5ldyBTb2xpZEJydXNoKHNoYWRlMSk7XG4gICAgICAgIHNoYWRlMkJydXNoID0gbmV3IFNvbGlkQnJ1c2goc2hhZGUyKTtcbiAgICAgICAgc2hvd05vdGVMZXR0ZXJzID0gTWlkaU9wdGlvbnMuTm90ZU5hbWVOb25lO1xuICAgICAgICBCYWNrQ29sb3IgPSBDb2xvci5MaWdodEdyYXk7XG4gICAgfVxuXG4gICAgLyoqIFNldCB0aGUgTWlkaUZpbGUgdG8gdXNlLlxuICAgICAqICBTYXZlIHRoZSBsaXN0IG9mIG1pZGkgbm90ZXMuIEVhY2ggbWlkaSBub3RlIGluY2x1ZGVzIHRoZSBub3RlIE51bWJlciBcbiAgICAgKiAgYW5kIFN0YXJ0VGltZSAoaW4gcHVsc2VzKSwgc28gd2Uga25vdyB3aGljaCBub3RlcyB0byBzaGFkZSBnaXZlbiB0aGVcbiAgICAgKiAgY3VycmVudCBwdWxzZSB0aW1lLlxuICAgICAqLyBcbiAgICBwdWJsaWMgdm9pZCBTZXRNaWRpRmlsZShNaWRpRmlsZSBtaWRpZmlsZSwgTWlkaU9wdGlvbnMgb3B0aW9ucykge1xuICAgICAgICBpZiAobWlkaWZpbGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgbm90ZXMgPSBudWxsO1xuICAgICAgICAgICAgdXNlVHdvQ29sb3JzID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBMaXN0PE1pZGlUcmFjaz4gdHJhY2tzID0gbWlkaWZpbGUuQ2hhbmdlTWlkaU5vdGVzKG9wdGlvbnMpO1xuICAgICAgICBNaWRpVHJhY2sgdHJhY2sgPSBNaWRpRmlsZS5Db21iaW5lVG9TaW5nbGVUcmFjayh0cmFja3MpO1xuICAgICAgICBub3RlcyA9IHRyYWNrLk5vdGVzO1xuXG4gICAgICAgIG1heFNoYWRlRHVyYXRpb24gPSBtaWRpZmlsZS5UaW1lLlF1YXJ0ZXIgKiAyO1xuXG4gICAgICAgIC8qIFdlIHdhbnQgdG8ga25vdyB3aGljaCB0cmFjayB0aGUgbm90ZSBjYW1lIGZyb20uXG4gICAgICAgICAqIFVzZSB0aGUgJ2NoYW5uZWwnIGZpZWxkIHRvIHN0b3JlIHRoZSB0cmFjay5cbiAgICAgICAgICovXG4gICAgICAgIGZvciAoaW50IHRyYWNrbnVtID0gMDsgdHJhY2tudW0gPCB0cmFja3MuQ291bnQ7IHRyYWNrbnVtKyspIHtcbiAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlOb3RlIG5vdGUgaW4gdHJhY2tzW3RyYWNrbnVtXS5Ob3Rlcykge1xuICAgICAgICAgICAgICAgIG5vdGUuQ2hhbm5lbCA9IHRyYWNrbnVtO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyogV2hlbiB3ZSBoYXZlIGV4YWN0bHkgdHdvIHRyYWNrcywgd2UgYXNzdW1lIHRoaXMgaXMgYSBwaWFubyBzb25nLFxuICAgICAgICAgKiBhbmQgd2UgdXNlIGRpZmZlcmVudCBjb2xvcnMgZm9yIGhpZ2hsaWdodGluZyB0aGUgbGVmdCBoYW5kIGFuZFxuICAgICAgICAgKiByaWdodCBoYW5kIG5vdGVzLlxuICAgICAgICAgKi9cbiAgICAgICAgdXNlVHdvQ29sb3JzID0gZmFsc2U7XG4gICAgICAgIGlmICh0cmFja3MuQ291bnQgPT0gMikge1xuICAgICAgICAgICAgdXNlVHdvQ29sb3JzID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNob3dOb3RlTGV0dGVycyA9IG9wdGlvbnMuc2hvd05vdGVMZXR0ZXJzO1xuICAgICAgICB0aGlzLkludmFsaWRhdGUoKTtcbiAgICB9XG5cbiAgICAvKiogU2V0IHRoZSBjb2xvcnMgdG8gdXNlIGZvciBzaGFkaW5nICovXG4gICAgcHVibGljIHZvaWQgU2V0U2hhZGVDb2xvcnMoQ29sb3IgYzEsIENvbG9yIGMyKSB7XG4gICAgICAgIHNoYWRlQnJ1c2guRGlzcG9zZSgpO1xuICAgICAgICBzaGFkZTJCcnVzaC5EaXNwb3NlKCk7XG4gICAgICAgIHNoYWRlQnJ1c2ggPSBuZXcgU29saWRCcnVzaChjMSk7XG4gICAgICAgIHNoYWRlMkJydXNoID0gbmV3IFNvbGlkQnJ1c2goYzIpO1xuICAgIH1cblxuICAgIC8qKiBEcmF3IHRoZSBvdXRsaW5lIG9mIGEgMTItbm90ZSAoNyB3aGl0ZSBub3RlKSBwaWFubyBvY3RhdmUgKi9cbiAgICBwcml2YXRlIHZvaWQgRHJhd09jdGF2ZU91dGxpbmUoR3JhcGhpY3MgZykge1xuICAgICAgICBpbnQgcmlnaHQgPSBXaGl0ZUtleVdpZHRoICogS2V5c1Blck9jdGF2ZTtcblxuICAgICAgICAvLyBEcmF3IHRoZSBib3VuZGluZyByZWN0YW5nbGUsIGZyb20gQyB0byBCXG4gICAgICAgIGcuRHJhd0xpbmUoZ3JheTFQZW4sIDAsIDAsIDAsIFdoaXRlS2V5SGVpZ2h0KTtcbiAgICAgICAgZy5EcmF3TGluZShncmF5MVBlbiwgcmlnaHQsIDAsIHJpZ2h0LCBXaGl0ZUtleUhlaWdodCk7XG4gICAgICAgIC8vIGcuRHJhd0xpbmUoZ3JheTFQZW4sIDAsIDAsIHJpZ2h0LCAwKTtcbiAgICAgICAgZy5EcmF3TGluZShncmF5MVBlbiwgMCwgV2hpdGVLZXlIZWlnaHQsIHJpZ2h0LCBXaGl0ZUtleUhlaWdodCk7XG4gICAgICAgIGcuRHJhd0xpbmUoZ3JheTNQZW4sIHJpZ2h0LTEsIDAsIHJpZ2h0LTEsIFdoaXRlS2V5SGVpZ2h0KTtcbiAgICAgICAgZy5EcmF3TGluZShncmF5M1BlbiwgMSwgMCwgMSwgV2hpdGVLZXlIZWlnaHQpO1xuXG4gICAgICAgIC8vIERyYXcgdGhlIGxpbmUgYmV0d2VlbiBFIGFuZCBGXG4gICAgICAgIGcuRHJhd0xpbmUoZ3JheTFQZW4sIDMqV2hpdGVLZXlXaWR0aCwgMCwgMypXaGl0ZUtleVdpZHRoLCBXaGl0ZUtleUhlaWdodCk7XG4gICAgICAgIGcuRHJhd0xpbmUoZ3JheTNQZW4sIDMqV2hpdGVLZXlXaWR0aCAtIDEsIDAsIDMqV2hpdGVLZXlXaWR0aCAtIDEsIFdoaXRlS2V5SGVpZ2h0KTtcbiAgICAgICAgZy5EcmF3TGluZShncmF5M1BlbiwgMypXaGl0ZUtleVdpZHRoICsgMSwgMCwgMypXaGl0ZUtleVdpZHRoICsgMSwgV2hpdGVLZXlIZWlnaHQpO1xuXG4gICAgICAgIC8vIERyYXcgdGhlIHNpZGVzL2JvdHRvbSBvZiB0aGUgYmxhY2sga2V5c1xuICAgICAgICBmb3IgKGludCBpID0wOyBpIDwgMTA7IGkgKz0gMikge1xuICAgICAgICAgICAgaW50IHgxID0gYmxhY2tLZXlPZmZzZXRzW2ldO1xuICAgICAgICAgICAgaW50IHgyID0gYmxhY2tLZXlPZmZzZXRzW2krMV07XG5cbiAgICAgICAgICAgIGcuRHJhd0xpbmUoZ3JheTFQZW4sIHgxLCAwLCB4MSwgQmxhY2tLZXlIZWlnaHQpOyBcbiAgICAgICAgICAgIGcuRHJhd0xpbmUoZ3JheTFQZW4sIHgyLCAwLCB4MiwgQmxhY2tLZXlIZWlnaHQpOyBcbiAgICAgICAgICAgIGcuRHJhd0xpbmUoZ3JheTFQZW4sIHgxLCBCbGFja0tleUhlaWdodCwgeDIsIEJsYWNrS2V5SGVpZ2h0KTtcbiAgICAgICAgICAgIGcuRHJhd0xpbmUoZ3JheTJQZW4sIHgxLTEsIDAsIHgxLTEsIEJsYWNrS2V5SGVpZ2h0KzEpOyBcbiAgICAgICAgICAgIGcuRHJhd0xpbmUoZ3JheTJQZW4sIHgyKzEsIDAsIHgyKzEsIEJsYWNrS2V5SGVpZ2h0KzEpOyBcbiAgICAgICAgICAgIGcuRHJhd0xpbmUoZ3JheTJQZW4sIHgxLTEsIEJsYWNrS2V5SGVpZ2h0KzEsIHgyKzEsIEJsYWNrS2V5SGVpZ2h0KzEpO1xuICAgICAgICAgICAgZy5EcmF3TGluZShncmF5M1BlbiwgeDEtMiwgMCwgeDEtMiwgQmxhY2tLZXlIZWlnaHQrMik7IFxuICAgICAgICAgICAgZy5EcmF3TGluZShncmF5M1BlbiwgeDIrMiwgMCwgeDIrMiwgQmxhY2tLZXlIZWlnaHQrMik7IFxuICAgICAgICAgICAgZy5EcmF3TGluZShncmF5M1BlbiwgeDEtMiwgQmxhY2tLZXlIZWlnaHQrMiwgeDIrMiwgQmxhY2tLZXlIZWlnaHQrMik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEcmF3IHRoZSBib3R0b20taGFsZiBvZiB0aGUgd2hpdGUga2V5c1xuICAgICAgICBmb3IgKGludCBpID0gMTsgaSA8IEtleXNQZXJPY3RhdmU7IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgPT0gMykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlOyAgLy8gd2UgZHJhdyB0aGUgbGluZSBiZXR3ZWVuIEUgYW5kIEYgYWJvdmVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGcuRHJhd0xpbmUoZ3JheTFQZW4sIGkqV2hpdGVLZXlXaWR0aCwgQmxhY2tLZXlIZWlnaHQsIGkqV2hpdGVLZXlXaWR0aCwgV2hpdGVLZXlIZWlnaHQpO1xuICAgICAgICAgICAgUGVuIHBlbjEgPSBncmF5MlBlbjtcbiAgICAgICAgICAgIFBlbiBwZW4yID0gZ3JheTNQZW47XG4gICAgICAgICAgICBnLkRyYXdMaW5lKHBlbjEsIGkqV2hpdGVLZXlXaWR0aCAtIDEsIEJsYWNrS2V5SGVpZ2h0KzEsIGkqV2hpdGVLZXlXaWR0aCAtIDEsIFdoaXRlS2V5SGVpZ2h0KTtcbiAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuMiwgaSpXaGl0ZUtleVdpZHRoICsgMSwgQmxhY2tLZXlIZWlnaHQrMSwgaSpXaGl0ZUtleVdpZHRoICsgMSwgV2hpdGVLZXlIZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvKiogRHJhdyBhbiBvdXRsaW5lIG9mIHRoZSBwaWFubyBmb3IgNyBvY3RhdmVzICovXG4gICAgcHJpdmF0ZSB2b2lkIERyYXdPdXRsaW5lKEdyYXBoaWNzIGcpIHtcbiAgICAgICAgZm9yIChpbnQgb2N0YXZlID0gMDsgb2N0YXZlIDwgTWF4T2N0YXZlOyBvY3RhdmUrKykge1xuICAgICAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0ob2N0YXZlICogV2hpdGVLZXlXaWR0aCAqIEtleXNQZXJPY3RhdmUsIDApO1xuICAgICAgICAgICAgRHJhd09jdGF2ZU91dGxpbmUoZyk7XG4gICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgtKG9jdGF2ZSAqIFdoaXRlS2V5V2lkdGggKiBLZXlzUGVyT2N0YXZlKSwgMCk7XG4gICAgICAgIH1cbiAgICB9XG4gXG4gICAgLyogRHJhdyB0aGUgQmxhY2sga2V5cyAqL1xuICAgIHByaXZhdGUgdm9pZCBEcmF3QmxhY2tLZXlzKEdyYXBoaWNzIGcpIHtcbiAgICAgICAgZm9yIChpbnQgb2N0YXZlID0gMDsgb2N0YXZlIDwgTWF4T2N0YXZlOyBvY3RhdmUrKykge1xuICAgICAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0ob2N0YXZlICogV2hpdGVLZXlXaWR0aCAqIEtleXNQZXJPY3RhdmUsIDApO1xuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCAxMDsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgaW50IHgxID0gYmxhY2tLZXlPZmZzZXRzW2ldO1xuICAgICAgICAgICAgICAgIGludCB4MiA9IGJsYWNrS2V5T2Zmc2V0c1tpKzFdO1xuICAgICAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShncmF5MUJydXNoLCB4MSwgMCwgQmxhY2tLZXlXaWR0aCwgQmxhY2tLZXlIZWlnaHQpO1xuICAgICAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShncmF5MkJydXNoLCB4MSsxLCBCbGFja0tleUhlaWdodCAtIEJsYWNrS2V5SGVpZ2h0LzgsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCbGFja0tleVdpZHRoLTIsIEJsYWNrS2V5SGVpZ2h0LzgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oLShvY3RhdmUgKiBXaGl0ZUtleVdpZHRoICogS2V5c1Blck9jdGF2ZSksIDApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyogRHJhdyB0aGUgYmxhY2sgYm9yZGVyIGFyZWEgc3Vycm91bmRpbmcgdGhlIHBpYW5vIGtleXMuXG4gICAgICogQWxzbywgZHJhdyBncmF5IG91dGxpbmVzIGF0IHRoZSBib3R0b20gb2YgdGhlIHdoaXRlIGtleXMuXG4gICAgICovXG4gICAgcHJpdmF0ZSB2b2lkIERyYXdCbGFja0JvcmRlcihHcmFwaGljcyBnKSB7XG4gICAgICAgIGludCBQaWFub1dpZHRoID0gV2hpdGVLZXlXaWR0aCAqIEtleXNQZXJPY3RhdmUgKiBNYXhPY3RhdmU7XG4gICAgICAgIGcuRmlsbFJlY3RhbmdsZShncmF5MUJydXNoLCBtYXJnaW4sIG1hcmdpbiwgUGlhbm9XaWR0aCArIEJsYWNrQm9yZGVyKjIsIEJsYWNrQm9yZGVyLTIpO1xuICAgICAgICBnLkZpbGxSZWN0YW5nbGUoZ3JheTFCcnVzaCwgbWFyZ2luLCBtYXJnaW4sIEJsYWNrQm9yZGVyLCBXaGl0ZUtleUhlaWdodCArIEJsYWNrQm9yZGVyICogMyk7XG4gICAgICAgIGcuRmlsbFJlY3RhbmdsZShncmF5MUJydXNoLCBtYXJnaW4sIG1hcmdpbiArIEJsYWNrQm9yZGVyICsgV2hpdGVLZXlIZWlnaHQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQmxhY2tCb3JkZXIqMiArIFBpYW5vV2lkdGgsIEJsYWNrQm9yZGVyKjIpO1xuICAgICAgICBnLkZpbGxSZWN0YW5nbGUoZ3JheTFCcnVzaCwgbWFyZ2luICsgQmxhY2tCb3JkZXIgKyBQaWFub1dpZHRoLCBtYXJnaW4sIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQmxhY2tCb3JkZXIsIFdoaXRlS2V5SGVpZ2h0ICsgQmxhY2tCb3JkZXIqMyk7XG5cbiAgICAgICAgZy5EcmF3TGluZShncmF5MlBlbiwgbWFyZ2luICsgQmxhY2tCb3JkZXIsIG1hcmdpbiArIEJsYWNrQm9yZGVyIC0xLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luICsgQmxhY2tCb3JkZXIgKyBQaWFub1dpZHRoLCBtYXJnaW4gKyBCbGFja0JvcmRlciAtMSk7XG4gICAgICAgIFxuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybShtYXJnaW4gKyBCbGFja0JvcmRlciwgbWFyZ2luICsgQmxhY2tCb3JkZXIpOyBcblxuICAgICAgICAvLyBEcmF3IHRoZSBncmF5IGJvdHRvbXMgb2YgdGhlIHdoaXRlIGtleXMgIFxuICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IEtleXNQZXJPY3RhdmUgKiBNYXhPY3RhdmU7IGkrKykge1xuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGdyYXkyQnJ1c2gsIGkqV2hpdGVLZXlXaWR0aCsxLCBXaGl0ZUtleUhlaWdodCsyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBXaGl0ZUtleVdpZHRoLTIsIEJsYWNrQm9yZGVyLzIpO1xuICAgICAgICB9XG4gICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC0obWFyZ2luICsgQmxhY2tCb3JkZXIpLCAtKG1hcmdpbiArIEJsYWNrQm9yZGVyKSk7IFxuICAgIH1cblxuICAgIC8qKiBEcmF3IHRoZSBub3RlIGxldHRlcnMgdW5kZXJuZWF0aCBlYWNoIHdoaXRlIG5vdGUgKi9cbiAgICBwcml2YXRlIHZvaWQgRHJhd05vdGVMZXR0ZXJzKEdyYXBoaWNzIGcpIHtcbiAgICAgICAgc3RyaW5nW10gbGV0dGVycyA9IHsgXCJDXCIsIFwiRFwiLCBcIkVcIiwgXCJGXCIsIFwiR1wiLCBcIkFcIiwgXCJCXCIgfTtcbiAgICAgICAgc3RyaW5nW10gbnVtYmVycyA9IHsgXCIxXCIsIFwiM1wiLCBcIjVcIiwgXCI2XCIsIFwiOFwiLCBcIjEwXCIsIFwiMTJcIiB9O1xuICAgICAgICBzdHJpbmdbXSBuYW1lcztcbiAgICAgICAgaWYgKHNob3dOb3RlTGV0dGVycyA9PSBNaWRpT3B0aW9ucy5Ob3RlTmFtZUxldHRlcikge1xuICAgICAgICAgICAgbmFtZXMgPSBsZXR0ZXJzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNob3dOb3RlTGV0dGVycyA9PSBNaWRpT3B0aW9ucy5Ob3RlTmFtZUZpeGVkTnVtYmVyKSB7XG4gICAgICAgICAgICBuYW1lcyA9IG51bWJlcnM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0obWFyZ2luICsgQmxhY2tCb3JkZXIsIG1hcmdpbiArIEJsYWNrQm9yZGVyKTsgXG4gICAgICAgIGZvciAoaW50IG9jdGF2ZSA9IDA7IG9jdGF2ZSA8IE1heE9jdGF2ZTsgb2N0YXZlKyspIHtcbiAgICAgICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgS2V5c1Blck9jdGF2ZTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZy5EcmF3U3RyaW5nKG5hbWVzW2ldLCBTaGVldE11c2ljLkxldHRlckZvbnQsIEJydXNoZXMuV2hpdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIChvY3RhdmUqS2V5c1Blck9jdGF2ZSArIGkpICogV2hpdGVLZXlXaWR0aCArIFdoaXRlS2V5V2lkdGgvMyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgV2hpdGVLZXlIZWlnaHQgKyBCbGFja0JvcmRlciAqIDMvNCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oLShtYXJnaW4gKyBCbGFja0JvcmRlciksIC0obWFyZ2luICsgQmxhY2tCb3JkZXIpKTsgXG4gICAgfVxuXG4gICAgLyoqIERyYXcgdGhlIFBpYW5vLiAqL1xuICAgIHByb3RlY3RlZCAvKm92ZXJyaWRlKi8gdm9pZCBPblBhaW50KFBhaW50RXZlbnRBcmdzIGUpIHtcbiAgICAgICAgR3JhcGhpY3MgZyA9IGUuR3JhcGhpY3MoKTtcbiAgICAgICAgZy5TbW9vdGhpbmdNb2RlID0gU21vb3RoaW5nTW9kZS5Ob25lO1xuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybShtYXJnaW4gKyBCbGFja0JvcmRlciwgbWFyZ2luICsgQmxhY2tCb3JkZXIpOyBcbiAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKEJydXNoZXMuV2hpdGUsIDAsIDAsIFxuICAgICAgICAgICAgICAgICAgICAgICAgV2hpdGVLZXlXaWR0aCAqIEtleXNQZXJPY3RhdmUgKiBNYXhPY3RhdmUsIFdoaXRlS2V5SGVpZ2h0KTtcbiAgICAgICAgRHJhd0JsYWNrS2V5cyhnKTtcbiAgICAgICAgRHJhd091dGxpbmUoZyk7XG4gICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC0obWFyZ2luICsgQmxhY2tCb3JkZXIpLCAtKG1hcmdpbiArIEJsYWNrQm9yZGVyKSk7XG4gICAgICAgIERyYXdCbGFja0JvcmRlcihnKTtcbiAgICAgICAgaWYgKHNob3dOb3RlTGV0dGVycyAhPSBNaWRpT3B0aW9ucy5Ob3RlTmFtZU5vbmUpIHtcbiAgICAgICAgICAgIERyYXdOb3RlTGV0dGVycyhnKTtcbiAgICAgICAgfVxuICAgICAgICBnLlNtb290aGluZ01vZGUgPSBTbW9vdGhpbmdNb2RlLkFudGlBbGlhcztcbiAgICB9XG5cbiAgICAvKiBTaGFkZSB0aGUgZ2l2ZW4gbm90ZSB3aXRoIHRoZSBnaXZlbiBicnVzaC5cbiAgICAgKiBXZSBvbmx5IGRyYXcgbm90ZXMgZnJvbSBub3RlbnVtYmVyIDI0IHRvIDk2LlxuICAgICAqIChNaWRkbGUtQyBpcyA2MCkuXG4gICAgICovXG4gICAgcHJpdmF0ZSB2b2lkIFNoYWRlT25lTm90ZShHcmFwaGljcyBnLCBpbnQgbm90ZW51bWJlciwgQnJ1c2ggYnJ1c2gpIHtcbiAgICAgICAgaW50IG9jdGF2ZSA9IG5vdGVudW1iZXIgLyAxMjtcbiAgICAgICAgaW50IG5vdGVzY2FsZSA9IG5vdGVudW1iZXIgJSAxMjtcblxuICAgICAgICBvY3RhdmUgLT0gMjtcbiAgICAgICAgaWYgKG9jdGF2ZSA8IDAgfHwgb2N0YXZlID49IE1heE9jdGF2ZSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybShvY3RhdmUgKiBXaGl0ZUtleVdpZHRoICogS2V5c1Blck9jdGF2ZSwgMCk7XG4gICAgICAgIGludCB4MSwgeDIsIHgzO1xuXG4gICAgICAgIGludCBib3R0b21IYWxmSGVpZ2h0ID0gV2hpdGVLZXlIZWlnaHQgLSAoQmxhY2tLZXlIZWlnaHQrMyk7XG5cbiAgICAgICAgLyogbm90ZXNjYWxlIGdvZXMgZnJvbSAwIHRvIDExLCBmcm9tIEMgdG8gQi4gKi9cbiAgICAgICAgc3dpdGNoIChub3Rlc2NhbGUpIHtcbiAgICAgICAgY2FzZSAwOiAvKiBDICovXG4gICAgICAgICAgICB4MSA9IDI7XG4gICAgICAgICAgICB4MiA9IGJsYWNrS2V5T2Zmc2V0c1swXSAtIDI7XG4gICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoYnJ1c2gsIHgxLCAwLCB4MiAtIHgxLCBCbGFja0tleUhlaWdodCszKTtcbiAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShicnVzaCwgeDEsIEJsYWNrS2V5SGVpZ2h0KzMsIFdoaXRlS2V5V2lkdGgtMywgYm90dG9tSGFsZkhlaWdodCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxOiAvKiBDIyAqL1xuICAgICAgICAgICAgeDEgPSBibGFja0tleU9mZnNldHNbMF07IFxuICAgICAgICAgICAgeDIgPSBibGFja0tleU9mZnNldHNbMV07XG4gICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoYnJ1c2gsIHgxLCAwLCB4MiAtIHgxLCBCbGFja0tleUhlaWdodCk7XG4gICAgICAgICAgICBpZiAoYnJ1c2ggPT0gZ3JheTFCcnVzaCkge1xuICAgICAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShncmF5MkJydXNoLCB4MSsxLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQmxhY2tLZXlIZWlnaHQgLSBCbGFja0tleUhlaWdodC84LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQmxhY2tLZXlXaWR0aC0yLCBCbGFja0tleUhlaWdodC84KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6IC8qIEQgKi9cbiAgICAgICAgICAgIHgxID0gV2hpdGVLZXlXaWR0aCArIDI7XG4gICAgICAgICAgICB4MiA9IGJsYWNrS2V5T2Zmc2V0c1sxXSArIDM7XG4gICAgICAgICAgICB4MyA9IGJsYWNrS2V5T2Zmc2V0c1syXSAtIDI7IFxuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MiwgMCwgeDMgLSB4MiwgQmxhY2tLZXlIZWlnaHQrMyk7XG4gICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoYnJ1c2gsIHgxLCBCbGFja0tleUhlaWdodCszLCBXaGl0ZUtleVdpZHRoLTMsIGJvdHRvbUhhbGZIZWlnaHQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogLyogRCMgKi9cbiAgICAgICAgICAgIHgxID0gYmxhY2tLZXlPZmZzZXRzWzJdOyBcbiAgICAgICAgICAgIHgyID0gYmxhY2tLZXlPZmZzZXRzWzNdO1xuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MSwgMCwgQmxhY2tLZXlXaWR0aCwgQmxhY2tLZXlIZWlnaHQpO1xuICAgICAgICAgICAgaWYgKGJydXNoID09IGdyYXkxQnJ1c2gpIHtcbiAgICAgICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoZ3JheTJCcnVzaCwgeDErMSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJsYWNrS2V5SGVpZ2h0IC0gQmxhY2tLZXlIZWlnaHQvOCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJsYWNrS2V5V2lkdGgtMiwgQmxhY2tLZXlIZWlnaHQvOCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA0OiAvKiBFICovXG4gICAgICAgICAgICB4MSA9IFdoaXRlS2V5V2lkdGggKiAyICsgMjtcbiAgICAgICAgICAgIHgyID0gYmxhY2tLZXlPZmZzZXRzWzNdICsgMzsgXG4gICAgICAgICAgICB4MyA9IFdoaXRlS2V5V2lkdGggKiAzIC0gMTtcbiAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShicnVzaCwgeDIsIDAsIHgzIC0geDIsIEJsYWNrS2V5SGVpZ2h0KzMpO1xuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MSwgQmxhY2tLZXlIZWlnaHQrMywgV2hpdGVLZXlXaWR0aC0zLCBib3R0b21IYWxmSGVpZ2h0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDU6IC8qIEYgKi9cbiAgICAgICAgICAgIHgxID0gV2hpdGVLZXlXaWR0aCAqIDMgKyAyO1xuICAgICAgICAgICAgeDIgPSBibGFja0tleU9mZnNldHNbNF0gLSAyOyBcbiAgICAgICAgICAgIHgzID0gV2hpdGVLZXlXaWR0aCAqIDQgLSAyO1xuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MSwgMCwgeDIgLSB4MSwgQmxhY2tLZXlIZWlnaHQrMyk7XG4gICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoYnJ1c2gsIHgxLCBCbGFja0tleUhlaWdodCszLCBXaGl0ZUtleVdpZHRoLTMsIGJvdHRvbUhhbGZIZWlnaHQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNjogLyogRiMgKi9cbiAgICAgICAgICAgIHgxID0gYmxhY2tLZXlPZmZzZXRzWzRdOyBcbiAgICAgICAgICAgIHgyID0gYmxhY2tLZXlPZmZzZXRzWzVdO1xuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MSwgMCwgQmxhY2tLZXlXaWR0aCwgQmxhY2tLZXlIZWlnaHQpO1xuICAgICAgICAgICAgaWYgKGJydXNoID09IGdyYXkxQnJ1c2gpIHtcbiAgICAgICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoZ3JheTJCcnVzaCwgeDErMSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJsYWNrS2V5SGVpZ2h0IC0gQmxhY2tLZXlIZWlnaHQvOCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJsYWNrS2V5V2lkdGgtMiwgQmxhY2tLZXlIZWlnaHQvOCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA3OiAvKiBHICovXG4gICAgICAgICAgICB4MSA9IFdoaXRlS2V5V2lkdGggKiA0ICsgMjtcbiAgICAgICAgICAgIHgyID0gYmxhY2tLZXlPZmZzZXRzWzVdICsgMzsgXG4gICAgICAgICAgICB4MyA9IGJsYWNrS2V5T2Zmc2V0c1s2XSAtIDI7IFxuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MiwgMCwgeDMgLSB4MiwgQmxhY2tLZXlIZWlnaHQrMyk7XG4gICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoYnJ1c2gsIHgxLCBCbGFja0tleUhlaWdodCszLCBXaGl0ZUtleVdpZHRoLTMsIGJvdHRvbUhhbGZIZWlnaHQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgODogLyogRyMgKi9cbiAgICAgICAgICAgIHgxID0gYmxhY2tLZXlPZmZzZXRzWzZdOyBcbiAgICAgICAgICAgIHgyID0gYmxhY2tLZXlPZmZzZXRzWzddO1xuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MSwgMCwgQmxhY2tLZXlXaWR0aCwgQmxhY2tLZXlIZWlnaHQpO1xuICAgICAgICAgICAgaWYgKGJydXNoID09IGdyYXkxQnJ1c2gpIHtcbiAgICAgICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoZ3JheTJCcnVzaCwgeDErMSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJsYWNrS2V5SGVpZ2h0IC0gQmxhY2tLZXlIZWlnaHQvOCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJsYWNrS2V5V2lkdGgtMiwgQmxhY2tLZXlIZWlnaHQvOCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA5OiAvKiBBICovXG4gICAgICAgICAgICB4MSA9IFdoaXRlS2V5V2lkdGggKiA1ICsgMjtcbiAgICAgICAgICAgIHgyID0gYmxhY2tLZXlPZmZzZXRzWzddICsgMzsgXG4gICAgICAgICAgICB4MyA9IGJsYWNrS2V5T2Zmc2V0c1s4XSAtIDI7IFxuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MiwgMCwgeDMgLSB4MiwgQmxhY2tLZXlIZWlnaHQrMyk7XG4gICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoYnJ1c2gsIHgxLCBCbGFja0tleUhlaWdodCszLCBXaGl0ZUtleVdpZHRoLTMsIGJvdHRvbUhhbGZIZWlnaHQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTA6IC8qIEEjICovXG4gICAgICAgICAgICB4MSA9IGJsYWNrS2V5T2Zmc2V0c1s4XTsgXG4gICAgICAgICAgICB4MiA9IGJsYWNrS2V5T2Zmc2V0c1s5XTtcbiAgICAgICAgICAgIGcuRmlsbFJlY3RhbmdsZShicnVzaCwgeDEsIDAsIEJsYWNrS2V5V2lkdGgsIEJsYWNrS2V5SGVpZ2h0KTtcbiAgICAgICAgICAgIGlmIChicnVzaCA9PSBncmF5MUJydXNoKSB7XG4gICAgICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGdyYXkyQnJ1c2gsIHgxKzEsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCbGFja0tleUhlaWdodCAtIEJsYWNrS2V5SGVpZ2h0LzgsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCbGFja0tleVdpZHRoLTIsIEJsYWNrS2V5SGVpZ2h0LzgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTE6IC8qIEIgKi9cbiAgICAgICAgICAgIHgxID0gV2hpdGVLZXlXaWR0aCAqIDYgKyAyO1xuICAgICAgICAgICAgeDIgPSBibGFja0tleU9mZnNldHNbOV0gKyAzOyBcbiAgICAgICAgICAgIHgzID0gV2hpdGVLZXlXaWR0aCAqIEtleXNQZXJPY3RhdmUgLSAxO1xuICAgICAgICAgICAgZy5GaWxsUmVjdGFuZ2xlKGJydXNoLCB4MiwgMCwgeDMgLSB4MiwgQmxhY2tLZXlIZWlnaHQrMyk7XG4gICAgICAgICAgICBnLkZpbGxSZWN0YW5nbGUoYnJ1c2gsIHgxLCBCbGFja0tleUhlaWdodCszLCBXaGl0ZUtleVdpZHRoLTMsIGJvdHRvbUhhbGZIZWlnaHQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgtKG9jdGF2ZSAqIFdoaXRlS2V5V2lkdGggKiBLZXlzUGVyT2N0YXZlKSwgMCk7XG4gICAgfVxuXG4gICAgLyoqIEZpbmQgdGhlIE1pZGlOb3RlIHdpdGggdGhlIHN0YXJ0VGltZSBjbG9zZXN0IHRvIHRoZSBnaXZlbiB0aW1lLlxuICAgICAqICBSZXR1cm4gdGhlIGluZGV4IG9mIHRoZSBub3RlLiAgVXNlIGEgYmluYXJ5IHNlYXJjaCBtZXRob2QuXG4gICAgICovXG4gICAgcHJpdmF0ZSBpbnQgRmluZENsb3Nlc3RTdGFydFRpbWUoaW50IHB1bHNlVGltZSkge1xuICAgICAgICBpbnQgbGVmdCA9IDA7XG4gICAgICAgIGludCByaWdodCA9IG5vdGVzLkNvdW50LTE7XG5cbiAgICAgICAgd2hpbGUgKHJpZ2h0IC0gbGVmdCA+IDEpIHtcbiAgICAgICAgICAgIGludCBpID0gKHJpZ2h0ICsgbGVmdCkvMjtcbiAgICAgICAgICAgIGlmIChub3Rlc1tsZWZ0XS5TdGFydFRpbWUgPT0gcHVsc2VUaW1lKVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZWxzZSBpZiAobm90ZXNbaV0uU3RhcnRUaW1lIDw9IHB1bHNlVGltZSlcbiAgICAgICAgICAgICAgICBsZWZ0ID0gaTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByaWdodCA9IGk7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKGxlZnQgPj0gMSAmJiAobm90ZXNbbGVmdC0xXS5TdGFydFRpbWUgPT0gbm90ZXNbbGVmdF0uU3RhcnRUaW1lKSkge1xuICAgICAgICAgICAgbGVmdC0tO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsZWZ0O1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdGhlIG5leHQgU3RhcnRUaW1lIHRoYXQgb2NjdXJzIGFmdGVyIHRoZSBNaWRpTm90ZVxuICAgICAqICBhdCBvZmZzZXQgaSwgdGhhdCBpcyBhbHNvIGluIHRoZSBzYW1lIHRyYWNrL2NoYW5uZWwuXG4gICAgICovXG4gICAgcHJpdmF0ZSBpbnQgTmV4dFN0YXJ0VGltZVNhbWVUcmFjayhpbnQgaSkge1xuICAgICAgICBpbnQgc3RhcnQgPSBub3Rlc1tpXS5TdGFydFRpbWU7XG4gICAgICAgIGludCBlbmQgPSBub3Rlc1tpXS5FbmRUaW1lO1xuICAgICAgICBpbnQgdHJhY2sgPSBub3Rlc1tpXS5DaGFubmVsO1xuXG4gICAgICAgIHdoaWxlIChpIDwgbm90ZXMuQ291bnQpIHtcbiAgICAgICAgICAgIGlmIChub3Rlc1tpXS5DaGFubmVsICE9IHRyYWNrKSB7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vdGVzW2ldLlN0YXJ0VGltZSA+IHN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vdGVzW2ldLlN0YXJ0VGltZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVuZCA9IE1hdGguTWF4KGVuZCwgbm90ZXNbaV0uRW5kVGltZSk7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVuZDtcbiAgICB9XG5cblxuICAgIC8qKiBSZXR1cm4gdGhlIG5leHQgU3RhcnRUaW1lIHRoYXQgb2NjdXJzIGFmdGVyIHRoZSBNaWRpTm90ZVxuICAgICAqICBhdCBvZmZzZXQgaS4gIElmIGFsbCB0aGUgc3Vic2VxdWVudCBub3RlcyBoYXZlIHRoZSBzYW1lXG4gICAgICogIFN0YXJ0VGltZSwgdGhlbiByZXR1cm4gdGhlIGxhcmdlc3QgRW5kVGltZS5cbiAgICAgKi9cbiAgICBwcml2YXRlIGludCBOZXh0U3RhcnRUaW1lKGludCBpKSB7XG4gICAgICAgIGludCBzdGFydCA9IG5vdGVzW2ldLlN0YXJ0VGltZTtcbiAgICAgICAgaW50IGVuZCA9IG5vdGVzW2ldLkVuZFRpbWU7XG5cbiAgICAgICAgd2hpbGUgKGkgPCBub3Rlcy5Db3VudCkge1xuICAgICAgICAgICAgaWYgKG5vdGVzW2ldLlN0YXJ0VGltZSA+IHN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vdGVzW2ldLlN0YXJ0VGltZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVuZCA9IE1hdGguTWF4KGVuZCwgbm90ZXNbaV0uRW5kVGltZSk7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVuZDtcbiAgICB9XG5cbiAgICAvKiogRmluZCB0aGUgTWlkaSBub3RlcyB0aGF0IG9jY3VyIGluIHRoZSBjdXJyZW50IHRpbWUuXG4gICAgICogIFNoYWRlIHRob3NlIG5vdGVzIG9uIHRoZSBwaWFubyBkaXNwbGF5ZWQuXG4gICAgICogIFVuLXNoYWRlIHRoZSB0aG9zZSBub3RlcyBwbGF5ZWQgaW4gdGhlIHByZXZpb3VzIHRpbWUuXG4gICAgICovXG4gICAgcHVibGljIHZvaWQgU2hhZGVOb3RlcyhpbnQgY3VycmVudFB1bHNlVGltZSwgaW50IHByZXZQdWxzZVRpbWUpIHtcbiAgICAgICAgaWYgKG5vdGVzID09IG51bGwgfHwgbm90ZXMuQ291bnQgPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChncmFwaGljcyA9PSBudWxsKSB7XG4gICAgICAgICAgICBncmFwaGljcyA9IENyZWF0ZUdyYXBoaWNzKFwic2hhZGVOb3Rlc19waWFub1wiKTtcbiAgICAgICAgfVxuICAgICAgICBncmFwaGljcy5TbW9vdGhpbmdNb2RlID0gU21vb3RoaW5nTW9kZS5Ob25lO1xuICAgICAgICBncmFwaGljcy5UcmFuc2xhdGVUcmFuc2Zvcm0obWFyZ2luICsgQmxhY2tCb3JkZXIsIG1hcmdpbiArIEJsYWNrQm9yZGVyKTtcblxuICAgICAgICAvKiBMb29wIHRocm91Z2ggdGhlIE1pZGkgbm90ZXMuXG4gICAgICAgICAqIFVuc2hhZGUgbm90ZXMgd2hlcmUgU3RhcnRUaW1lIDw9IHByZXZQdWxzZVRpbWUgPCBuZXh0IFN0YXJ0VGltZVxuICAgICAgICAgKiBTaGFkZSBub3RlcyB3aGVyZSBTdGFydFRpbWUgPD0gY3VycmVudFB1bHNlVGltZSA8IG5leHQgU3RhcnRUaW1lXG4gICAgICAgICAqL1xuICAgICAgICBpbnQgbGFzdFNoYWRlZEluZGV4ID0gRmluZENsb3Nlc3RTdGFydFRpbWUocHJldlB1bHNlVGltZSAtIG1heFNoYWRlRHVyYXRpb24gKiAyKTtcbiAgICAgICAgZm9yIChpbnQgaSA9IGxhc3RTaGFkZWRJbmRleDsgaSA8IG5vdGVzLkNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGludCBzdGFydCA9IG5vdGVzW2ldLlN0YXJ0VGltZTtcbiAgICAgICAgICAgIGludCBlbmQgPSBub3Rlc1tpXS5FbmRUaW1lO1xuICAgICAgICAgICAgaW50IG5vdGVudW1iZXIgPSBub3Rlc1tpXS5OdW1iZXI7XG4gICAgICAgICAgICBpbnQgbmV4dFN0YXJ0ID0gTmV4dFN0YXJ0VGltZShpKTtcbiAgICAgICAgICAgIGludCBuZXh0U3RhcnRUcmFjayA9IE5leHRTdGFydFRpbWVTYW1lVHJhY2soaSk7XG4gICAgICAgICAgICBlbmQgPSBNYXRoLk1heChlbmQsIG5leHRTdGFydFRyYWNrKTtcbiAgICAgICAgICAgIGVuZCA9IE1hdGguTWluKGVuZCwgc3RhcnQgKyBtYXhTaGFkZUR1cmF0aW9uLTEpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgLyogSWYgd2UndmUgcGFzdCB0aGUgcHJldmlvdXMgYW5kIGN1cnJlbnQgdGltZXMsIHdlJ3JlIGRvbmUuICovXG4gICAgICAgICAgICBpZiAoKHN0YXJ0ID4gcHJldlB1bHNlVGltZSkgJiYgKHN0YXJ0ID4gY3VycmVudFB1bHNlVGltZSkpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogSWYgc2hhZGVkIG5vdGVzIGFyZSB0aGUgc2FtZSwgd2UncmUgZG9uZSAqL1xuICAgICAgICAgICAgaWYgKChzdGFydCA8PSBjdXJyZW50UHVsc2VUaW1lKSAmJiAoY3VycmVudFB1bHNlVGltZSA8IG5leHRTdGFydCkgJiZcbiAgICAgICAgICAgICAgICAoY3VycmVudFB1bHNlVGltZSA8IGVuZCkgJiYgXG4gICAgICAgICAgICAgICAgKHN0YXJ0IDw9IHByZXZQdWxzZVRpbWUpICYmIChwcmV2UHVsc2VUaW1lIDwgbmV4dFN0YXJ0KSAmJlxuICAgICAgICAgICAgICAgIChwcmV2UHVsc2VUaW1lIDwgZW5kKSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBJZiB0aGUgbm90ZSBpcyBpbiB0aGUgY3VycmVudCB0aW1lLCBzaGFkZSBpdCAqL1xuICAgICAgICAgICAgaWYgKChzdGFydCA8PSBjdXJyZW50UHVsc2VUaW1lKSAmJiAoY3VycmVudFB1bHNlVGltZSA8IGVuZCkpIHtcbiAgICAgICAgICAgICAgICBpZiAodXNlVHdvQ29sb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3Rlc1tpXS5DaGFubmVsID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFNoYWRlT25lTm90ZShncmFwaGljcywgbm90ZW51bWJlciwgc2hhZGUyQnJ1c2gpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgU2hhZGVPbmVOb3RlKGdyYXBoaWNzLCBub3RlbnVtYmVyLCBzaGFkZUJydXNoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgU2hhZGVPbmVOb3RlKGdyYXBoaWNzLCBub3RlbnVtYmVyLCBzaGFkZUJydXNoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIElmIHRoZSBub3RlIGlzIGluIHRoZSBwcmV2aW91cyB0aW1lLCB1bi1zaGFkZSBpdCwgZHJhdyBpdCB3aGl0ZS4gKi9cbiAgICAgICAgICAgIGVsc2UgaWYgKChzdGFydCA8PSBwcmV2UHVsc2VUaW1lKSAmJiAocHJldlB1bHNlVGltZSA8IGVuZCkpIHtcbiAgICAgICAgICAgICAgICBpbnQgbnVtID0gbm90ZW51bWJlciAlIDEyO1xuICAgICAgICAgICAgICAgIGlmIChudW0gPT0gMSB8fCBudW0gPT0gMyB8fCBudW0gPT0gNiB8fCBudW0gPT0gOCB8fCBudW0gPT0gMTApIHtcbiAgICAgICAgICAgICAgICAgICAgU2hhZGVPbmVOb3RlKGdyYXBoaWNzLCBub3RlbnVtYmVyLCBncmF5MUJydXNoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIFNoYWRlT25lTm90ZShncmFwaGljcywgbm90ZW51bWJlciwgQnJ1c2hlcy5XaGl0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGdyYXBoaWNzLlRyYW5zbGF0ZVRyYW5zZm9ybSgtKG1hcmdpbiArIEJsYWNrQm9yZGVyKSwgLShtYXJnaW4gKyBCbGFja0JvcmRlcikpO1xuICAgICAgICBncmFwaGljcy5TbW9vdGhpbmdNb2RlID0gU21vb3RoaW5nTW9kZS5BbnRpQWxpYXM7XG4gICAgfVxufVxuXG59XG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTEgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5JTztcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xudXNpbmcgU3lzdGVtLlRleHQ7XG5cbm5hbWVzcGFjZSBNaWRpU2hlZXRNdXNpYyB7XG5cblxuLyogQGNsYXNzIFJlc3RTeW1ib2xcbiAqIEEgUmVzdCBzeW1ib2wgcmVwcmVzZW50cyBhIHJlc3QgLSB3aG9sZSwgaGFsZiwgcXVhcnRlciwgb3IgZWlnaHRoLlxuICogVGhlIFJlc3Qgc3ltYm9sIGhhcyBhIHN0YXJ0dGltZSBhbmQgYSBkdXJhdGlvbiwganVzdCBsaWtlIGEgcmVndWxhclxuICogbm90ZS5cbiAqL1xucHVibGljIGNsYXNzIFJlc3RTeW1ib2wgOiBNdXNpY1N5bWJvbCB7XG4gICAgcHJpdmF0ZSBpbnQgc3RhcnR0aW1lOyAgICAgICAgICAvKiogVGhlIHN0YXJ0dGltZSBvZiB0aGUgcmVzdCAqL1xuICAgIHByaXZhdGUgTm90ZUR1cmF0aW9uIGR1cmF0aW9uOyAgLyoqIFRoZSByZXN0IGR1cmF0aW9uIChlaWdodGgsIHF1YXJ0ZXIsIGhhbGYsIHdob2xlKSAqL1xuICAgIHByaXZhdGUgaW50IHdpZHRoOyAgICAgICAgICAgICAgLyoqIFRoZSB3aWR0aCBpbiBwaXhlbHMgKi9cblxuICAgIC8qKiBDcmVhdGUgYSBuZXcgcmVzdCBzeW1ib2wgd2l0aCB0aGUgZ2l2ZW4gc3RhcnQgdGltZSBhbmQgZHVyYXRpb24gKi9cbiAgICBwdWJsaWMgUmVzdFN5bWJvbChpbnQgc3RhcnQsIE5vdGVEdXJhdGlvbiBkdXIpIHtcbiAgICAgICAgc3RhcnR0aW1lID0gc3RhcnQ7XG4gICAgICAgIGR1cmF0aW9uID0gZHVyOyBcbiAgICAgICAgd2lkdGggPSBNaW5XaWR0aDtcbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSB0aW1lIChpbiBwdWxzZXMpIHRoaXMgc3ltYm9sIG9jY3VycyBhdC5cbiAgICAgKiBUaGlzIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSBtZWFzdXJlIHRoaXMgc3ltYm9sIGJlbG9uZ3MgdG8uXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBTdGFydFRpbWUgeyBcbiAgICAgICAgZ2V0IHsgcmV0dXJuIHN0YXJ0dGltZTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQvU2V0IHRoZSB3aWR0aCAoaW4gcGl4ZWxzKSBvZiB0aGlzIHN5bWJvbC4gVGhlIHdpZHRoIGlzIHNldFxuICAgICAqIGluIFNoZWV0TXVzaWMuQWxpZ25TeW1ib2xzKCkgdG8gdmVydGljYWxseSBhbGlnbiBzeW1ib2xzLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgV2lkdGgge1xuICAgICAgICBnZXQgeyByZXR1cm4gd2lkdGg7IH1cbiAgICAgICAgc2V0IHsgd2lkdGggPSB2YWx1ZTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG1pbmltdW0gd2lkdGggKGluIHBpeGVscykgbmVlZGVkIHRvIGRyYXcgdGhpcyBzeW1ib2wgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgaW50IE1pbldpZHRoIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIDIgKiBTaGVldE11c2ljLk5vdGVIZWlnaHQgKyBcbiAgICAgICAgICAgICAgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogR2V0IHRoZSBudW1iZXIgb2YgcGl4ZWxzIHRoaXMgc3ltYm9sIGV4dGVuZHMgYWJvdmUgdGhlIHN0YWZmLiBVc2VkXG4gICAgICogIHRvIGRldGVybWluZSB0aGUgbWluaW11bSBoZWlnaHQgbmVlZGVkIGZvciB0aGUgc3RhZmYgKFN0YWZmLkZpbmRCb3VuZHMpLlxuICAgICAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgQWJvdmVTdGFmZiB7IFxuICAgICAgICBnZXQgeyByZXR1cm4gMDsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBwaXhlbHMgdGhpcyBzeW1ib2wgZXh0ZW5kcyBiZWxvdyB0aGUgc3RhZmYuIFVzZWRcbiAgICAgKiAgdG8gZGV0ZXJtaW5lIHRoZSBtaW5pbXVtIGhlaWdodCBuZWVkZWQgZm9yIHRoZSBzdGFmZiAoU3RhZmYuRmluZEJvdW5kcykuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBCZWxvd1N0YWZmIHsgXG4gICAgICAgIGdldCB7IHJldHVybiAwOyB9XG4gICAgfVxuXG4gICAgLyoqIERyYXcgdGhlIHN5bWJvbC5cbiAgICAgKiBAcGFyYW0geXRvcCBUaGUgeWxvY2F0aW9uIChpbiBwaXhlbHMpIHdoZXJlIHRoZSB0b3Agb2YgdGhlIHN0YWZmIHN0YXJ0cy5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgXG4gICAgdm9pZCBEcmF3KEdyYXBoaWNzIGcsIFBlbiBwZW4sIGludCB5dG9wKSB7XG4gICAgICAgIC8qIEFsaWduIHRoZSByZXN0IHN5bWJvbCB0byB0aGUgcmlnaHQgKi9cbiAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oV2lkdGggLSBNaW5XaWR0aCwgMCk7XG4gICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yLCAwKTtcblxuICAgICAgICBpZiAoZHVyYXRpb24gPT0gTm90ZUR1cmF0aW9uLldob2xlKSB7XG4gICAgICAgICAgICBEcmF3V2hvbGUoZywgcGVuLCB5dG9wKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uSGFsZikge1xuICAgICAgICAgICAgRHJhd0hhbGYoZywgcGVuLCB5dG9wKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uUXVhcnRlcikge1xuICAgICAgICAgICAgRHJhd1F1YXJ0ZXIoZywgcGVuLCB5dG9wKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkdXJhdGlvbiA9PSBOb3RlRHVyYXRpb24uRWlnaHRoKSB7XG4gICAgICAgICAgICBEcmF3RWlnaHRoKGcsIHBlbiwgeXRvcCk7XG4gICAgICAgIH1cbiAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oLVNoZWV0TXVzaWMuTm90ZUhlaWdodC8yLCAwKTtcbiAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oLShXaWR0aCAtIE1pbldpZHRoKSwgMCk7XG4gICAgfVxuXG5cbiAgICAvKiogRHJhdyBhIHdob2xlIHJlc3Qgc3ltYm9sLCBhIHJlY3RhbmdsZSBiZWxvdyBhIHN0YWZmIGxpbmUuXG4gICAgICogQHBhcmFtIHl0b3AgVGhlIHlsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICovXG4gICAgcHVibGljIHZvaWQgRHJhd1dob2xlKEdyYXBoaWNzIGcsIFBlbiBwZW4sIGludCB5dG9wKSB7XG4gICAgICAgIGludCB5ID0geXRvcCArIFNoZWV0TXVzaWMuTm90ZUhlaWdodDtcblxuICAgICAgICBnLkZpbGxSZWN0YW5nbGUoQnJ1c2hlcy5CbGFjaywgMCwgeSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBTaGVldE11c2ljLk5vdGVXaWR0aCwgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzIpO1xuICAgIH1cblxuICAgIC8qKiBEcmF3IGEgaGFsZiByZXN0IHN5bWJvbCwgYSByZWN0YW5nbGUgYWJvdmUgYSBzdGFmZiBsaW5lLlxuICAgICAqIEBwYXJhbSB5dG9wIFRoZSB5bG9jYXRpb24gKGluIHBpeGVscykgd2hlcmUgdGhlIHRvcCBvZiB0aGUgc3RhZmYgc3RhcnRzLlxuICAgICAqL1xuICAgIHB1YmxpYyB2b2lkIERyYXdIYWxmKEdyYXBoaWNzIGcsIFBlbiBwZW4sIGludCB5dG9wKSB7XG4gICAgICAgIGludCB5ID0geXRvcCArIFNoZWV0TXVzaWMuTm90ZUhlaWdodCArIFNoZWV0TXVzaWMuTm90ZUhlaWdodC8yO1xuXG4gICAgICAgIGcuRmlsbFJlY3RhbmdsZShCcnVzaGVzLkJsYWNrLCAwLCB5LCBcbiAgICAgICAgICAgICAgICAgICAgICAgIFNoZWV0TXVzaWMuTm90ZVdpZHRoLCBTaGVldE11c2ljLk5vdGVIZWlnaHQvMik7XG4gICAgfVxuXG4gICAgLyoqIERyYXcgYSBxdWFydGVyIHJlc3Qgc3ltYm9sLlxuICAgICAqIEBwYXJhbSB5dG9wIFRoZSB5bG9jYXRpb24gKGluIHBpeGVscykgd2hlcmUgdGhlIHRvcCBvZiB0aGUgc3RhZmYgc3RhcnRzLlxuICAgICAqL1xuICAgIHB1YmxpYyB2b2lkIERyYXdRdWFydGVyKEdyYXBoaWNzIGcsIFBlbiBwZW4sIGludCB5dG9wKSB7XG4gICAgICAgIHBlbi5FbmRDYXAgPSBMaW5lQ2FwLkZsYXQ7XG5cbiAgICAgICAgaW50IHkgPSB5dG9wICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0LzI7XG4gICAgICAgIGludCB4ID0gMjtcbiAgICAgICAgaW50IHhlbmQgPSB4ICsgMipTaGVldE11c2ljLk5vdGVIZWlnaHQvMztcbiAgICAgICAgcGVuLldpZHRoID0gMTtcbiAgICAgICAgZy5EcmF3TGluZShwZW4sIHgsIHksIHhlbmQtMSwgeSArIFNoZWV0TXVzaWMuTm90ZUhlaWdodC0xKTtcblxuICAgICAgICBwZW4uV2lkdGggPSBTaGVldE11c2ljLkxpbmVTcGFjZS8yO1xuICAgICAgICB5ICA9IHl0b3AgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQgKyAxO1xuICAgICAgICBnLkRyYXdMaW5lKHBlbiwgeGVuZC0yLCB5LCB4LCB5ICsgU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0KTtcblxuICAgICAgICBwZW4uV2lkdGggPSAxO1xuICAgICAgICB5ID0geXRvcCArIFNoZWV0TXVzaWMuTm90ZUhlaWdodCoyIC0gMTtcbiAgICAgICAgZy5EcmF3TGluZShwZW4sIDAsIHksIHhlbmQrMiwgeSArIFNoZWV0TXVzaWMuTm90ZUhlaWdodCk7IFxuXG4gICAgICAgIHBlbi5XaWR0aCA9IFNoZWV0TXVzaWMuTGluZVNwYWNlLzI7XG4gICAgICAgIGlmIChTaGVldE11c2ljLk5vdGVIZWlnaHQgPT0gNikge1xuICAgICAgICAgICAgZy5EcmF3TGluZShwZW4sIHhlbmQsIHkgKyAxICsgMypTaGVldE11c2ljLk5vdGVIZWlnaHQvNCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4LzIsIHkgKyAxICsgMypTaGVldE11c2ljLk5vdGVIZWlnaHQvNCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7ICAvKiBOb3RlSGVpZ2h0ID09IDggKi9cbiAgICAgICAgICAgIGcuRHJhd0xpbmUocGVuLCB4ZW5kLCB5ICsgMypTaGVldE11c2ljLk5vdGVIZWlnaHQvNCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4LzIsIHkgKyAzKlNoZWV0TXVzaWMuTm90ZUhlaWdodC80KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBlbi5XaWR0aCA9IDE7XG4gICAgICAgIGcuRHJhd0xpbmUocGVuLCAwLCB5ICsgMipTaGVldE11c2ljLk5vdGVIZWlnaHQvMyArIDEsIFxuICAgICAgICAgICAgICAgICAgICAgICAgeGVuZCAtIDEsIHkgKyAzKlNoZWV0TXVzaWMuTm90ZUhlaWdodC8yKTtcbiAgICB9XG5cbiAgICAvKiogRHJhdyBhbiBlaWdodGggcmVzdCBzeW1ib2wuXG4gICAgICogQHBhcmFtIHl0b3AgVGhlIHlsb2NhdGlvbiAoaW4gcGl4ZWxzKSB3aGVyZSB0aGUgdG9wIG9mIHRoZSBzdGFmZiBzdGFydHMuXG4gICAgICovXG4gICAgcHVibGljIHZvaWQgRHJhd0VpZ2h0aChHcmFwaGljcyBnLCBQZW4gcGVuLCBpbnQgeXRvcCkge1xuICAgICAgICBpbnQgeSA9IHl0b3AgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQgLSAxO1xuICAgICAgICBnLkZpbGxFbGxpcHNlKEJydXNoZXMuQmxhY2ssIDAsIHkrMSwgXG4gICAgICAgICAgICAgICAgICAgICAgU2hlZXRNdXNpYy5MaW5lU3BhY2UtMSwgU2hlZXRNdXNpYy5MaW5lU3BhY2UtMSk7XG4gICAgICAgIHBlbi5XaWR0aCA9IDE7XG4gICAgICAgIGcuRHJhd0xpbmUocGVuLCAoU2hlZXRNdXNpYy5MaW5lU3BhY2UtMikvMiwgeSArIFNoZWV0TXVzaWMuTGluZVNwYWNlLTEsXG4gICAgICAgICAgICAgICAgICAgICAgICAzKlNoZWV0TXVzaWMuTGluZVNwYWNlLzIsIHkgKyBTaGVldE11c2ljLkxpbmVTcGFjZS8yKTtcbiAgICAgICAgZy5EcmF3TGluZShwZW4sIDMqU2hlZXRNdXNpYy5MaW5lU3BhY2UvMiwgeSArIFNoZWV0TXVzaWMuTGluZVNwYWNlLzIsXG4gICAgICAgICAgICAgICAgICAgICAgICAzKlNoZWV0TXVzaWMuTGluZVNwYWNlLzQsIHkgKyBTaGVldE11c2ljLk5vdGVIZWlnaHQqMik7XG4gICAgfVxuXG4gICAgcHVibGljIG92ZXJyaWRlIHN0cmluZyBUb1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5Gb3JtYXQoXCJSZXN0U3ltYm9sIHN0YXJ0dGltZT17MH0gZHVyYXRpb249ezF9IHdpZHRoPXsyfVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydHRpbWUsIGR1cmF0aW9uLCB3aWR0aCk7XG4gICAgfVxuXG59XG5cblxufVxuXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDA3LTIwMTIgTWFkaGF2IFZhaWR5YW5hdGhhblxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAyLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnVzaW5nIFN5c3RlbTtcbnVzaW5nIFN5c3RlbS5MaW5xO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG51c2luZyBTeXN0ZW0uVGV4dDtcblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljXG57XG5cblxuICAgIC8qKiBAY2xhc3MgU2hlZXRNdXNpY1xuICAgICAqXG4gICAgICogVGhlIFNoZWV0TXVzaWMgQ29udHJvbCBpcyB0aGUgbWFpbiBjbGFzcyBmb3IgZGlzcGxheWluZyB0aGUgc2hlZXQgbXVzaWMuXG4gICAgICogVGhlIFNoZWV0TXVzaWMgY2xhc3MgaGFzIHRoZSBmb2xsb3dpbmcgcHVibGljIG1ldGhvZHM6XG4gICAgICpcbiAgICAgKiBTaGVldE11c2ljKClcbiAgICAgKiAgIENyZWF0ZSBhIG5ldyBTaGVldE11c2ljIGNvbnRyb2wgZnJvbSB0aGUgZ2l2ZW4gbWlkaSBmaWxlIGFuZCBvcHRpb25zLlxuICAgICAqIFxuICAgICAqIFNldFpvb20oKVxuICAgICAqICAgU2V0IHRoZSB6b29tIGxldmVsIHRvIGRpc3BsYXkgdGhlIHNoZWV0IG11c2ljIGF0LlxuICAgICAqXG4gICAgICogRG9QcmludCgpXG4gICAgICogICBQcmludCBhIHNpbmdsZSBwYWdlIG9mIHNoZWV0IG11c2ljLlxuICAgICAqXG4gICAgICogR2V0VG90YWxQYWdlcygpXG4gICAgICogICBHZXQgdGhlIHRvdGFsIG51bWJlciBvZiBzaGVldCBtdXNpYyBwYWdlcy5cbiAgICAgKlxuICAgICAqIE9uUGFpbnQoKVxuICAgICAqICAgTWV0aG9kIGNhbGxlZCB0byBkcmF3IHRoZSBTaGVldE11aXNjXG4gICAgICpcbiAgICAgKiBUaGVzZSBwdWJsaWMgbWV0aG9kcyBhcmUgY2FsbGVkIGZyb20gdGhlIE1pZGlTaGVldE11c2ljIEZvcm0gV2luZG93LlxuICAgICAqXG4gICAgICovXG4gICAgcHVibGljIGNsYXNzIFNoZWV0TXVzaWMgOiBDb250cm9sXG4gICAge1xuXG4gICAgICAgIC8qIE1lYXN1cmVtZW50cyB1c2VkIHdoZW4gZHJhd2luZy4gIEFsbCBtZWFzdXJlbWVudHMgYXJlIGluIHBpeGVscy5cbiAgICAgICAgICogVGhlIHZhbHVlcyBkZXBlbmQgb24gd2hldGhlciB0aGUgbWVudSAnTGFyZ2UgTm90ZXMnIG9yICdTbWFsbCBOb3RlcycgaXMgc2VsZWN0ZWQuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgY29uc3QgaW50IExpbmVXaWR0aCA9IDE7ICAgIC8qKiBUaGUgd2lkdGggb2YgYSBsaW5lICovXG4gICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTGVmdE1hcmdpbiA9IDQ7ICAgLyoqIFRoZSBsZWZ0IG1hcmdpbiAqL1xuICAgICAgICBwdWJsaWMgY29uc3QgaW50IFRpdGxlSGVpZ2h0ID0gMTQ7IC8qKiBUaGUgaGVpZ2h0IGZvciB0aGUgdGl0bGUgb24gdGhlIGZpcnN0IHBhZ2UgKi9cbiAgICAgICAgcHVibGljIHN0YXRpYyBpbnQgTGluZVNwYWNlOyAgICAgICAgLyoqIFRoZSBzcGFjZSBiZXR3ZWVuIGxpbmVzIGluIHRoZSBzdGFmZiAqL1xuICAgICAgICBwdWJsaWMgc3RhdGljIGludCBTdGFmZkhlaWdodDsgICAgICAvKiogVGhlIGhlaWdodCBiZXR3ZWVuIHRoZSA1IGhvcml6b250YWwgbGluZXMgb2YgdGhlIHN0YWZmICovXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgaW50IE5vdGVIZWlnaHQ7ICAgICAgLyoqIFRoZSBoZWlnaHQgb2YgYSB3aG9sZSBub3RlICovXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgaW50IE5vdGVXaWR0aDsgICAgICAgLyoqIFRoZSB3aWR0aCBvZiBhIHdob2xlIG5vdGUgKi9cblxuICAgICAgICBwdWJsaWMgY29uc3QgaW50IFBhZ2VXaWR0aCA9IDgwMDsgICAgLyoqIFRoZSB3aWR0aCBvZiBlYWNoIHBhZ2UgKi9cbiAgICAgICAgcHVibGljIGNvbnN0IGludCBQYWdlSGVpZ2h0ID0gMTA1MDsgIC8qKiBUaGUgaGVpZ2h0IG9mIGVhY2ggcGFnZSAod2hlbiBwcmludGluZykgKi9cbiAgICAgICAgcHVibGljIHN0YXRpYyBGb250IExldHRlckZvbnQ7ICAgICAgIC8qKiBUaGUgZm9udCBmb3IgZHJhd2luZyB0aGUgbGV0dGVycyAqL1xuXG4gICAgICAgIHByaXZhdGUgTGlzdDxTdGFmZj4gc3RhZmZzOyAvKiogVGhlIGFycmF5IG9mIHN0YWZmcyB0byBkaXNwbGF5IChmcm9tIHRvcCB0byBib3R0b20pICovXG4gICAgICAgIHByaXZhdGUgS2V5U2lnbmF0dXJlIG1haW5rZXk7IC8qKiBUaGUgbWFpbiBrZXkgc2lnbmF0dXJlICovXG4gICAgICAgIHByaXZhdGUgaW50IG51bXRyYWNrczsgICAgIC8qKiBUaGUgbnVtYmVyIG9mIHRyYWNrcyAqL1xuICAgICAgICBwcml2YXRlIGZsb2F0IHpvb207ICAgICAgICAgIC8qKiBUaGUgem9vbSBsZXZlbCB0byBkcmF3IGF0ICgxLjAgPT0gMTAwJSkgKi9cbiAgICAgICAgcHJpdmF0ZSBib29sIHNjcm9sbFZlcnQ7ICAgIC8qKiBXaGV0aGVyIHRvIHNjcm9sbCB2ZXJ0aWNhbGx5IG9yIGhvcml6b250YWxseSAqL1xuICAgICAgICBwcml2YXRlIHN0cmluZyBmaWxlbmFtZTsgICAgICAvKiogVGhlIG5hbWUgb2YgdGhlIG1pZGkgZmlsZSAqL1xuICAgICAgICBwcml2YXRlIGludCBzaG93Tm90ZUxldHRlcnM7ICAgIC8qKiBEaXNwbGF5IHRoZSBub3RlIGxldHRlcnMgKi9cbiAgICAgICAgcHJpdmF0ZSBDb2xvcltdIE5vdGVDb2xvcnM7ICAgICAvKiogVGhlIG5vdGUgY29sb3JzIHRvIHVzZSAqL1xuICAgICAgICBwcml2YXRlIFNvbGlkQnJ1c2ggc2hhZGVCcnVzaDsgIC8qKiBUaGUgYnJ1c2ggZm9yIHNoYWRpbmcgKi9cbiAgICAgICAgcHJpdmF0ZSBTb2xpZEJydXNoIHNoYWRlMkJydXNoOyAvKiogVGhlIGJydXNoIGZvciBzaGFkaW5nIGxlZnQtaGFuZCBwaWFubyAqL1xuICAgICAgICBwcml2YXRlIFNvbGlkQnJ1c2ggZGVzZWxlY3RlZFNoYWRlQnJ1c2ggPSBuZXcgU29saWRCcnVzaChDb2xvci5MaWdodEdyYXkpOyAvKiogVGhlIGJydXNoIGZvciBzaGFkaW5nIGRlc2VsZWN0ZWQgYXJlYXMgKi9cbiAgICAgICAgcHJpdmF0ZSBQZW4gcGVuOyAgICAgICAgICAgICAgICAvKiogVGhlIGJsYWNrIHBlbiBmb3IgZHJhd2luZyAqL1xuXG4gICAgICAgIHB1YmxpYyBpbnQgU2VsZWN0aW9uU3RhcnRQdWxzZSB7IGdldDsgc2V0OyB9XG4gICAgICAgIHB1YmxpYyBpbnQgU2VsZWN0aW9uRW5kUHVsc2UgeyBnZXQ7IHNldDsgfVxuXG4gICAgICAgIC8qKiBJbml0aWFsaXplIHRoZSBkZWZhdWx0IG5vdGUgc2l6ZXMuICAqL1xuICAgICAgICBzdGF0aWMgU2hlZXRNdXNpYygpXG4gICAgICAgIHtcbiAgICAgICAgICAgIFNldE5vdGVTaXplKGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBDcmVhdGUgYSBuZXcgU2hlZXRNdXNpYyBjb250cm9sLCB1c2luZyB0aGUgZ2l2ZW4gcGFyc2VkIE1pZGlGaWxlLlxuICAgICAgICAgKiAgVGhlIG9wdGlvbnMgY2FuIGJlIG51bGwuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgU2hlZXRNdXNpYyhNaWRpRmlsZSBmaWxlLCBNaWRpT3B0aW9ucyBvcHRpb25zKVxuICAgICAgICB7XG4gICAgICAgICAgICBpbml0KGZpbGUsIG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIFNoZWV0TXVzaWMoTWlkaUZpbGUgZmlsZSwgTWlkaU9wdGlvbnMgb3B0aW9ucywgTGlzdDxNaWRpVHJhY2s+IHRyYWNrcylcbiAgICAgICAge1xuICAgICAgICAgICAgaW5pdChmaWxlLCBvcHRpb25zLCB0cmFja3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIENyZWF0ZSBhIG5ldyBTaGVldE11c2ljIGNvbnRyb2wsIHVzaW5nIHRoZSBnaXZlbiByYXcgbWlkaSBieXRlW10gZGF0YS5cbiAgICAgICAgICogIFRoZSBvcHRpb25zIGNhbiBiZSBudWxsLlxuICAgICAgICAgKi9cbiAgICAgICAgcHVibGljIFNoZWV0TXVzaWMoYnl0ZVtdIGRhdGEsIHN0cmluZyB0aXRsZSwgTWlkaU9wdGlvbnMgb3B0aW9ucylcbiAgICAgICAge1xuICAgICAgICAgICAgTWlkaUZpbGUgZmlsZSA9IG5ldyBNaWRpRmlsZShkYXRhLCB0aXRsZSk7XG4gICAgICAgICAgICBpbml0KGZpbGUsIG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHZvaWQgaW5pdChNaWRpRmlsZSBmaWxlLCBNaWRpT3B0aW9ucyBvcHRpb25zLCBMaXN0PE1pZGlUcmFjaz4gdHJhY2tzKVxuICAgICAgICB7XG4gICAgICAgICAgICB6b29tID0gMS4wZjtcbiAgICAgICAgICAgIGZpbGVuYW1lID0gZmlsZS5GaWxlTmFtZTtcblxuICAgICAgICAgICAgU2V0Q29sb3JzKG9wdGlvbnMuY29sb3JzLCBvcHRpb25zLnNoYWRlQ29sb3IsIG9wdGlvbnMuc2hhZGUyQ29sb3IpO1xuICAgICAgICAgICAgcGVuID0gbmV3IFBlbihDb2xvci5CbGFjaywgMSk7XG5cbiAgICAgICAgICAgIFNldE5vdGVTaXplKG9wdGlvbnMubGFyZ2VOb3RlU2l6ZSk7XG4gICAgICAgICAgICBzY3JvbGxWZXJ0ID0gb3B0aW9ucy5zY3JvbGxWZXJ0O1xuICAgICAgICAgICAgc2hvd05vdGVMZXR0ZXJzID0gb3B0aW9ucy5zaG93Tm90ZUxldHRlcnM7XG4gICAgICAgICAgICBUaW1lU2lnbmF0dXJlIHRpbWUgPSBmaWxlLlRpbWU7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy50aW1lICE9IG51bGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGltZSA9IG9wdGlvbnMudGltZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmtleSA9PSAtMSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtYWlua2V5ID0gR2V0S2V5U2lnbmF0dXJlKHRyYWNrcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWFpbmtleSA9IG5ldyBLZXlTaWduYXR1cmUob3B0aW9ucy5rZXkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBudW10cmFja3MgPSB0cmFja3MuQ291bnQ7XG5cbiAgICAgICAgICAgIGludCBsYXN0U3RhcnQgPSBmaWxlLkVuZFRpbWUoKSArIG9wdGlvbnMuc2hpZnR0aW1lO1xuXG4gICAgICAgICAgICAvKiBDcmVhdGUgYWxsIHRoZSBtdXNpYyBzeW1ib2xzIChub3RlcywgcmVzdHMsIHZlcnRpY2FsIGJhcnMsIGFuZFxuICAgICAgICAgICAgICogY2xlZiBjaGFuZ2VzKS4gIFRoZSBzeW1ib2xzIHZhcmlhYmxlIGNvbnRhaW5zIGEgbGlzdCBvZiBtdXNpYyBcbiAgICAgICAgICAgICAqIHN5bWJvbHMgZm9yIGVhY2ggdHJhY2suICBUaGUgbGlzdCBkb2VzIG5vdCBpbmNsdWRlIHRoZSBsZWZ0LXNpZGUgXG4gICAgICAgICAgICAgKiBDbGVmIGFuZCBrZXkgc2lnbmF0dXJlIHN5bWJvbHMuICBUaG9zZSBjYW4gb25seSBiZSBjYWxjdWxhdGVkIFxuICAgICAgICAgICAgICogd2hlbiB3ZSBjcmVhdGUgdGhlIHN0YWZmcy5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgTGlzdDxNdXNpY1N5bWJvbD5bXSBzeW1ib2xzID0gbmV3IExpc3Q8TXVzaWNTeW1ib2w+W251bXRyYWNrc107XG4gICAgICAgICAgICBmb3IgKGludCB0cmFja251bSA9IDA7IHRyYWNrbnVtIDwgbnVtdHJhY2tzOyB0cmFja251bSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIE1pZGlUcmFjayB0cmFjayA9IHRyYWNrc1t0cmFja251bV07XG4gICAgICAgICAgICAgICAgQ2xlZk1lYXN1cmVzIGNsZWZzID0gbmV3IENsZWZNZWFzdXJlcyh0cmFjay5Ob3RlcywgdGltZS5NZWFzdXJlKTtcbiAgICAgICAgICAgICAgICBMaXN0PENob3JkU3ltYm9sPiBjaG9yZHMgPSBDcmVhdGVDaG9yZHModHJhY2suTm90ZXMsIG1haW5rZXksIHRpbWUsIGNsZWZzKTtcbiAgICAgICAgICAgICAgICBzeW1ib2xzW3RyYWNrbnVtXSA9IENyZWF0ZVN5bWJvbHMoY2hvcmRzLCBjbGVmcywgdGltZSwgbGFzdFN0YXJ0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgTGlzdDxMeXJpY1N5bWJvbD5bXSBseXJpY3MgPSBudWxsO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc2hvd0x5cmljcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBseXJpY3MgPSBHZXRMeXJpY3ModHJhY2tzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogVmVydGljYWxseSBhbGlnbiB0aGUgbXVzaWMgc3ltYm9scyAqL1xuICAgICAgICAgICAgU3ltYm9sV2lkdGhzIHdpZHRocyA9IG5ldyBTeW1ib2xXaWR0aHMoc3ltYm9scywgbHlyaWNzKTtcbiAgICAgICAgICAgIEFsaWduU3ltYm9scyhzeW1ib2xzLCB3aWR0aHMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICBzdGFmZnMgPSBDcmVhdGVTdGFmZnMoc3ltYm9scywgbWFpbmtleSwgb3B0aW9ucywgdGltZS5NZWFzdXJlKTtcbiAgICAgICAgICAgIENyZWF0ZUFsbEJlYW1lZENob3JkcyhzeW1ib2xzLCB0aW1lKTtcbiAgICAgICAgICAgIGlmIChseXJpY3MgIT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBBZGRMeXJpY3NUb1N0YWZmcyhzdGFmZnMsIGx5cmljcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIEFmdGVyIG1ha2luZyBjaG9yZCBwYWlycywgdGhlIHN0ZW0gZGlyZWN0aW9ucyBjYW4gY2hhbmdlLFxuICAgICAgICAgICAgICogd2hpY2ggYWZmZWN0cyB0aGUgc3RhZmYgaGVpZ2h0LiAgUmUtY2FsY3VsYXRlIHRoZSBzdGFmZiBoZWlnaHQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZvcmVhY2ggKFN0YWZmIHN0YWZmIGluIHN0YWZmcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzdGFmZi5DYWxjdWxhdGVIZWlnaHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgQmFja0NvbG9yID0gQ29sb3IuV2hpdGU7XG5cbiAgICAgICAgICAgIFNldFpvb20oMS4wZik7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQ3JlYXRlIGEgbmV3IFNoZWV0TXVzaWMgY29udHJvbC5cbiAgICAgICAgICogTWlkaUZpbGUgaXMgdGhlIHBhcnNlZCBtaWRpIGZpbGUgdG8gZGlzcGxheS5cbiAgICAgICAgICogU2hlZXRNdXNpYyBPcHRpb25zIGFyZSB0aGUgbWVudSBvcHRpb25zIHRoYXQgd2VyZSBzZWxlY3RlZC5cbiAgICAgICAgICpcbiAgICAgICAgICogLSBBcHBseSBhbGwgdGhlIE1lbnUgT3B0aW9ucyB0byB0aGUgTWlkaUZpbGUgdHJhY2tzLlxuICAgICAgICAgKiAtIENhbGN1bGF0ZSB0aGUga2V5IHNpZ25hdHVyZVxuICAgICAgICAgKiAtIEZvciBlYWNoIHRyYWNrLCBjcmVhdGUgYSBsaXN0IG9mIE11c2ljU3ltYm9scyAobm90ZXMsIHJlc3RzLCBiYXJzLCBldGMpXG4gICAgICAgICAqIC0gVmVydGljYWxseSBhbGlnbiB0aGUgbXVzaWMgc3ltYm9scyBpbiBhbGwgdGhlIHRyYWNrc1xuICAgICAgICAgKiAtIFBhcnRpdGlvbiB0aGUgbXVzaWMgbm90ZXMgaW50byBob3Jpem9udGFsIHN0YWZmc1xuICAgICAgICAgKi9cbiAgICAgICAgcHVibGljIHZvaWQgaW5pdChNaWRpRmlsZSBmaWxlLCBNaWRpT3B0aW9ucyBvcHRpb25zKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucyA9PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBuZXcgTWlkaU9wdGlvbnMoZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBMaXN0PE1pZGlUcmFjaz4gdHJhY2tzID0gZmlsZS5DaGFuZ2VNaWRpTm90ZXMob3B0aW9ucyk7XG4gICAgICAgICAgICBpbml0KGZpbGUsIG9wdGlvbnMsIHRyYWNrcyk7XG5cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqIEdldCB0aGUgYmVzdCBrZXkgc2lnbmF0dXJlIGdpdmVuIHRoZSBtaWRpIG5vdGVzIGluIGFsbCB0aGUgdHJhY2tzLiAqL1xuICAgICAgICBwcml2YXRlIEtleVNpZ25hdHVyZSBHZXRLZXlTaWduYXR1cmUoTGlzdDxNaWRpVHJhY2s+IHRyYWNrcylcbiAgICAgICAge1xuICAgICAgICAgICAgTGlzdDxpbnQ+IG5vdGVudW1zID0gbmV3IExpc3Q8aW50PigpO1xuICAgICAgICAgICAgZm9yZWFjaCAoTWlkaVRyYWNrIHRyYWNrIGluIHRyYWNrcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmb3JlYWNoIChNaWRpTm90ZSBub3RlIGluIHRyYWNrLk5vdGVzKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbm90ZW51bXMuQWRkKG5vdGUuTnVtYmVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gS2V5U2lnbmF0dXJlLkd1ZXNzKG5vdGVudW1zKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqIENyZWF0ZSB0aGUgY2hvcmQgc3ltYm9scyBmb3IgYSBzaW5nbGUgdHJhY2suXG4gICAgICAgICAqIEBwYXJhbSBtaWRpbm90ZXMgIFRoZSBNaWRpbm90ZXMgaW4gdGhlIHRyYWNrLlxuICAgICAgICAgKiBAcGFyYW0ga2V5ICAgICAgICBUaGUgS2V5IFNpZ25hdHVyZSwgZm9yIGRldGVybWluaW5nIHNoYXJwcy9mbGF0cy5cbiAgICAgICAgICogQHBhcmFtIHRpbWUgICAgICAgVGhlIFRpbWUgU2lnbmF0dXJlLCBmb3IgZGV0ZXJtaW5pbmcgdGhlIG1lYXN1cmVzLlxuICAgICAgICAgKiBAcGFyYW0gY2xlZnMgICAgICBUaGUgY2xlZnMgdG8gdXNlIGZvciBlYWNoIG1lYXN1cmUuXG4gICAgICAgICAqIEByZXQgQW4gYXJyYXkgb2YgQ2hvcmRTeW1ib2xzXG4gICAgICAgICAqL1xuICAgICAgICBwcml2YXRlXG4gICAgICAgIExpc3Q8Q2hvcmRTeW1ib2w+IENyZWF0ZUNob3JkcyhMaXN0PE1pZGlOb3RlPiBtaWRpbm90ZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBLZXlTaWduYXR1cmUga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGltZVNpZ25hdHVyZSB0aW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2xlZk1lYXN1cmVzIGNsZWZzKVxuICAgICAgICB7XG5cbiAgICAgICAgICAgIGludCBpID0gMDtcbiAgICAgICAgICAgIExpc3Q8Q2hvcmRTeW1ib2w+IGNob3JkcyA9IG5ldyBMaXN0PENob3JkU3ltYm9sPigpO1xuICAgICAgICAgICAgTGlzdDxNaWRpTm90ZT4gbm90ZWdyb3VwID0gbmV3IExpc3Q8TWlkaU5vdGU+KDEyKTtcbiAgICAgICAgICAgIGludCBsZW4gPSBtaWRpbm90ZXMuQ291bnQ7XG5cbiAgICAgICAgICAgIHdoaWxlIChpIDwgbGVuKVxuICAgICAgICAgICAge1xuXG4gICAgICAgICAgICAgICAgaW50IHN0YXJ0dGltZSA9IG1pZGlub3Rlc1tpXS5TdGFydFRpbWU7XG4gICAgICAgICAgICAgICAgQ2xlZiBjbGVmID0gY2xlZnMuR2V0Q2xlZihzdGFydHRpbWUpO1xuXG4gICAgICAgICAgICAgICAgLyogR3JvdXAgYWxsIHRoZSBtaWRpIG5vdGVzIHdpdGggdGhlIHNhbWUgc3RhcnQgdGltZVxuICAgICAgICAgICAgICAgICAqIGludG8gdGhlIG5vdGVzIGxpc3QuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgbm90ZWdyb3VwLkNsZWFyKCk7XG4gICAgICAgICAgICAgICAgbm90ZWdyb3VwLkFkZChtaWRpbm90ZXNbaV0pO1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IGxlbiAmJiBtaWRpbm90ZXNbaV0uU3RhcnRUaW1lID09IHN0YXJ0dGltZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5vdGVncm91cC5BZGQobWlkaW5vdGVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIENyZWF0ZSBhIHNpbmdsZSBjaG9yZCBmcm9tIHRoZSBncm91cCBvZiBtaWRpIG5vdGVzIHdpdGhcbiAgICAgICAgICAgICAgICAgKiB0aGUgc2FtZSBzdGFydCB0aW1lLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIENob3JkU3ltYm9sIGNob3JkID0gbmV3IENob3JkU3ltYm9sKG5vdGVncm91cCwga2V5LCB0aW1lLCBjbGVmLCB0aGlzKTtcbiAgICAgICAgICAgICAgICBjaG9yZHMuQWRkKGNob3JkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNob3JkcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBHaXZlbiB0aGUgY2hvcmQgc3ltYm9scyBmb3IgYSB0cmFjaywgY3JlYXRlIGEgbmV3IHN5bWJvbCBsaXN0XG4gICAgICAgICAqIHRoYXQgY29udGFpbnMgdGhlIGNob3JkIHN5bWJvbHMsIHZlcnRpY2FsIGJhcnMsIHJlc3RzLCBhbmQgY2xlZiBjaGFuZ2VzLlxuICAgICAgICAgKiBSZXR1cm4gYSBsaXN0IG9mIHN5bWJvbHMgKENob3JkU3ltYm9sLCBCYXJTeW1ib2wsIFJlc3RTeW1ib2wsIENsZWZTeW1ib2wpXG4gICAgICAgICAqL1xuICAgICAgICBwcml2YXRlIExpc3Q8TXVzaWNTeW1ib2w+XG4gICAgICAgIENyZWF0ZVN5bWJvbHMoTGlzdDxDaG9yZFN5bWJvbD4gY2hvcmRzLCBDbGVmTWVhc3VyZXMgY2xlZnMsXG4gICAgICAgICAgICAgICAgICAgICAgVGltZVNpZ25hdHVyZSB0aW1lLCBpbnQgbGFzdFN0YXJ0KVxuICAgICAgICB7XG5cbiAgICAgICAgICAgIExpc3Q8TXVzaWNTeW1ib2w+IHN5bWJvbHMgPSBuZXcgTGlzdDxNdXNpY1N5bWJvbD4oKTtcbiAgICAgICAgICAgIHN5bWJvbHMgPSBBZGRCYXJzKGNob3JkcywgdGltZSwgbGFzdFN0YXJ0KTtcbiAgICAgICAgICAgIHN5bWJvbHMgPSBBZGRSZXN0cyhzeW1ib2xzLCB0aW1lKTtcbiAgICAgICAgICAgIHN5bWJvbHMgPSBBZGRDbGVmQ2hhbmdlcyhzeW1ib2xzLCBjbGVmcywgdGltZSk7XG5cbiAgICAgICAgICAgIHJldHVybiBzeW1ib2xzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEFkZCBpbiB0aGUgdmVydGljYWwgYmFycyBkZWxpbWl0aW5nIG1lYXN1cmVzLiBcbiAgICAgICAgICogIEFsc28sIGFkZCB0aGUgdGltZSBzaWduYXR1cmUgc3ltYm9scy5cbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGVcbiAgICAgICAgTGlzdDxNdXNpY1N5bWJvbD4gQWRkQmFycyhMaXN0PENob3JkU3ltYm9sPiBjaG9yZHMsIFRpbWVTaWduYXR1cmUgdGltZSwgaW50IGxhc3RTdGFydClcbiAgICAgICAge1xuXG4gICAgICAgICAgICBMaXN0PE11c2ljU3ltYm9sPiBzeW1ib2xzID0gbmV3IExpc3Q8TXVzaWNTeW1ib2w+KCk7XG5cbiAgICAgICAgICAgIFRpbWVTaWdTeW1ib2wgdGltZXNpZyA9IG5ldyBUaW1lU2lnU3ltYm9sKHRpbWUuTnVtZXJhdG9yLCB0aW1lLkRlbm9taW5hdG9yKTtcbiAgICAgICAgICAgIHN5bWJvbHMuQWRkKHRpbWVzaWcpO1xuXG4gICAgICAgICAgICAvKiBUaGUgc3RhcnR0aW1lIG9mIHRoZSBiZWdpbm5pbmcgb2YgdGhlIG1lYXN1cmUgKi9cbiAgICAgICAgICAgIGludCBtZWFzdXJldGltZSA9IDA7XG5cbiAgICAgICAgICAgIGludCBpID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChpIDwgY2hvcmRzLkNvdW50KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmIChtZWFzdXJldGltZSA8PSBjaG9yZHNbaV0uU3RhcnRUaW1lKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgc3ltYm9scy5BZGQobmV3IEJhclN5bWJvbChtZWFzdXJldGltZSkpO1xuICAgICAgICAgICAgICAgICAgICBtZWFzdXJldGltZSArPSB0aW1lLk1lYXN1cmU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHN5bWJvbHMuQWRkKGNob3Jkc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIEtlZXAgYWRkaW5nIGJhcnMgdW50aWwgdGhlIGxhc3QgU3RhcnRUaW1lICh0aGUgZW5kIG9mIHRoZSBzb25nKSAqL1xuICAgICAgICAgICAgd2hpbGUgKG1lYXN1cmV0aW1lIDwgbGFzdFN0YXJ0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHN5bWJvbHMuQWRkKG5ldyBCYXJTeW1ib2wobWVhc3VyZXRpbWUpKTtcbiAgICAgICAgICAgICAgICBtZWFzdXJldGltZSArPSB0aW1lLk1lYXN1cmU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIEFkZCB0aGUgZmluYWwgdmVydGljYWwgYmFyIHRvIHRoZSBsYXN0IG1lYXN1cmUgKi9cbiAgICAgICAgICAgIHN5bWJvbHMuQWRkKG5ldyBCYXJTeW1ib2wobWVhc3VyZXRpbWUpKTtcbiAgICAgICAgICAgIHJldHVybiBzeW1ib2xzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEFkZCByZXN0IHN5bWJvbHMgYmV0d2VlbiBub3Rlcy4gIEFsbCB0aW1lcyBiZWxvdyBhcmUgXG4gICAgICAgICAqIG1lYXN1cmVkIGluIHB1bHNlcy5cbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGVcbiAgICAgICAgTGlzdDxNdXNpY1N5bWJvbD4gQWRkUmVzdHMoTGlzdDxNdXNpY1N5bWJvbD4gc3ltYm9scywgVGltZVNpZ25hdHVyZSB0aW1lKVxuICAgICAgICB7XG4gICAgICAgICAgICBpbnQgcHJldnRpbWUgPSAwO1xuXG4gICAgICAgICAgICBMaXN0PE11c2ljU3ltYm9sPiByZXN1bHQgPSBuZXcgTGlzdDxNdXNpY1N5bWJvbD4oc3ltYm9scy5Db3VudCk7XG5cbiAgICAgICAgICAgIGZvcmVhY2ggKE11c2ljU3ltYm9sIHN5bWJvbCBpbiBzeW1ib2xzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGludCBzdGFydHRpbWUgPSBzeW1ib2wuU3RhcnRUaW1lO1xuICAgICAgICAgICAgICAgIFJlc3RTeW1ib2xbXSByZXN0cyA9IEdldFJlc3RzKHRpbWUsIHByZXZ0aW1lLCBzdGFydHRpbWUpO1xuICAgICAgICAgICAgICAgIGlmIChyZXN0cyAhPSBudWxsKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yZWFjaCAoUmVzdFN5bWJvbCByIGluIHJlc3RzKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuQWRkKHIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzdWx0LkFkZChzeW1ib2wpO1xuXG4gICAgICAgICAgICAgICAgLyogU2V0IHByZXZ0aW1lIHRvIHRoZSBlbmQgdGltZSBvZiB0aGUgbGFzdCBub3RlL3N5bWJvbC4gKi9cbiAgICAgICAgICAgICAgICBpZiAoc3ltYm9sIGlzIENob3JkU3ltYm9sKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgQ2hvcmRTeW1ib2wgY2hvcmQgPSAoQ2hvcmRTeW1ib2wpc3ltYm9sO1xuICAgICAgICAgICAgICAgICAgICBwcmV2dGltZSA9IE1hdGguTWF4KGNob3JkLkVuZFRpbWUsIHByZXZ0aW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcHJldnRpbWUgPSBNYXRoLk1heChzdGFydHRpbWUsIHByZXZ0aW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIFJldHVybiB0aGUgcmVzdCBzeW1ib2xzIG5lZWRlZCB0byBmaWxsIHRoZSB0aW1lIGludGVydmFsIGJldHdlZW5cbiAgICAgICAgICogc3RhcnQgYW5kIGVuZC4gIElmIG5vIHJlc3RzIGFyZSBuZWVkZWQsIHJldHVybiBuaWwuXG4gICAgICAgICAqL1xuICAgICAgICBwcml2YXRlXG4gICAgICAgIFJlc3RTeW1ib2xbXSBHZXRSZXN0cyhUaW1lU2lnbmF0dXJlIHRpbWUsIGludCBzdGFydCwgaW50IGVuZClcbiAgICAgICAge1xuICAgICAgICAgICAgUmVzdFN5bWJvbFtdIHJlc3VsdDtcbiAgICAgICAgICAgIFJlc3RTeW1ib2wgcjEsIHIyO1xuXG4gICAgICAgICAgICBpZiAoZW5kIC0gc3RhcnQgPCAwKVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgICBOb3RlRHVyYXRpb24gZHVyID0gdGltZS5HZXROb3RlRHVyYXRpb24oZW5kIC0gc3RhcnQpO1xuICAgICAgICAgICAgc3dpdGNoIChkdXIpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2FzZSBOb3RlRHVyYXRpb24uV2hvbGU6XG4gICAgICAgICAgICAgICAgY2FzZSBOb3RlRHVyYXRpb24uSGFsZjpcbiAgICAgICAgICAgICAgICBjYXNlIE5vdGVEdXJhdGlvbi5RdWFydGVyOlxuICAgICAgICAgICAgICAgIGNhc2UgTm90ZUR1cmF0aW9uLkVpZ2h0aDpcbiAgICAgICAgICAgICAgICAgICAgcjEgPSBuZXcgUmVzdFN5bWJvbChzdGFydCwgZHVyKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbmV3IFJlc3RTeW1ib2xbXSB7IHIxIH07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICAgICAgICAgICAgICBjYXNlIE5vdGVEdXJhdGlvbi5Eb3R0ZWRIYWxmOlxuICAgICAgICAgICAgICAgICAgICByMSA9IG5ldyBSZXN0U3ltYm9sKHN0YXJ0LCBOb3RlRHVyYXRpb24uSGFsZik7XG4gICAgICAgICAgICAgICAgICAgIHIyID0gbmV3IFJlc3RTeW1ib2woc3RhcnQgKyB0aW1lLlF1YXJ0ZXIgKiAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE5vdGVEdXJhdGlvbi5RdWFydGVyKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbmV3IFJlc3RTeW1ib2xbXSB7IHIxLCByMiB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgICAgICAgICAgICAgY2FzZSBOb3RlRHVyYXRpb24uRG90dGVkUXVhcnRlcjpcbiAgICAgICAgICAgICAgICAgICAgcjEgPSBuZXcgUmVzdFN5bWJvbChzdGFydCwgTm90ZUR1cmF0aW9uLlF1YXJ0ZXIpO1xuICAgICAgICAgICAgICAgICAgICByMiA9IG5ldyBSZXN0U3ltYm9sKHN0YXJ0ICsgdGltZS5RdWFydGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE5vdGVEdXJhdGlvbi5FaWdodGgpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgUmVzdFN5bWJvbFtdIHsgcjEsIHIyIH07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICAgICAgICAgICAgICBjYXNlIE5vdGVEdXJhdGlvbi5Eb3R0ZWRFaWdodGg6XG4gICAgICAgICAgICAgICAgICAgIHIxID0gbmV3IFJlc3RTeW1ib2woc3RhcnQsIE5vdGVEdXJhdGlvbi5FaWdodGgpO1xuICAgICAgICAgICAgICAgICAgICByMiA9IG5ldyBSZXN0U3ltYm9sKHN0YXJ0ICsgdGltZS5RdWFydGVyIC8gMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBOb3RlRHVyYXRpb24uU2l4dGVlbnRoKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbmV3IFJlc3RTeW1ib2xbXSB7IHIxLCByMiB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiogVGhlIGN1cnJlbnQgY2xlZiBpcyBhbHdheXMgc2hvd24gYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RhZmYsIG9uXG4gICAgICAgICAqIHRoZSBsZWZ0IHNpZGUuICBIb3dldmVyLCB0aGUgY2xlZiBjYW4gYWxzbyBjaGFuZ2UgZnJvbSBtZWFzdXJlIHRvIFxuICAgICAgICAgKiBtZWFzdXJlLiBXaGVuIGl0IGRvZXMsIGEgQ2xlZiBzeW1ib2wgbXVzdCBiZSBzaG93biB0byBpbmRpY2F0ZSB0aGUgXG4gICAgICAgICAqIGNoYW5nZSBpbiBjbGVmLiAgVGhpcyBmdW5jdGlvbiBhZGRzIHRoZXNlIENsZWYgY2hhbmdlIHN5bWJvbHMuXG4gICAgICAgICAqIFRoaXMgZnVuY3Rpb24gZG9lcyBub3QgYWRkIHRoZSBtYWluIENsZWYgU3ltYm9sIHRoYXQgYmVnaW5zIGVhY2hcbiAgICAgICAgICogc3RhZmYuICBUaGF0IGlzIGRvbmUgaW4gdGhlIFN0YWZmKCkgY29udHJ1Y3Rvci5cbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGVcbiAgICAgICAgTGlzdDxNdXNpY1N5bWJvbD4gQWRkQ2xlZkNoYW5nZXMoTGlzdDxNdXNpY1N5bWJvbD4gc3ltYm9scyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2xlZk1lYXN1cmVzIGNsZWZzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaW1lU2lnbmF0dXJlIHRpbWUpXG4gICAgICAgIHtcblxuICAgICAgICAgICAgTGlzdDxNdXNpY1N5bWJvbD4gcmVzdWx0ID0gbmV3IExpc3Q8TXVzaWNTeW1ib2w+KHN5bWJvbHMuQ291bnQpO1xuICAgICAgICAgICAgQ2xlZiBwcmV2Y2xlZiA9IGNsZWZzLkdldENsZWYoMCk7XG4gICAgICAgICAgICBmb3JlYWNoIChNdXNpY1N5bWJvbCBzeW1ib2wgaW4gc3ltYm9scylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAvKiBBIEJhclN5bWJvbCBpbmRpY2F0ZXMgYSBuZXcgbWVhc3VyZSAqL1xuICAgICAgICAgICAgICAgIGlmIChzeW1ib2wgaXMgQmFyU3ltYm9sKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgQ2xlZiBjbGVmID0gY2xlZnMuR2V0Q2xlZihzeW1ib2wuU3RhcnRUaW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNsZWYgIT0gcHJldmNsZWYpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5BZGQobmV3IENsZWZTeW1ib2woY2xlZiwgc3ltYm9sLlN0YXJ0VGltZSAtIDEsIHRydWUpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwcmV2Y2xlZiA9IGNsZWY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdC5BZGQoc3ltYm9sKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8qKiBOb3RlcyB3aXRoIHRoZSBzYW1lIHN0YXJ0IHRpbWVzIGluIGRpZmZlcmVudCBzdGFmZnMgc2hvdWxkIGJlXG4gICAgICAgICAqIHZlcnRpY2FsbHkgYWxpZ25lZC4gIFRoZSBTeW1ib2xXaWR0aHMgY2xhc3MgaXMgdXNlZCB0byBoZWxwIFxuICAgICAgICAgKiB2ZXJ0aWNhbGx5IGFsaWduIHN5bWJvbHMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEZpcnN0LCBlYWNoIHRyYWNrIHNob3VsZCBoYXZlIGEgc3ltYm9sIGZvciBldmVyeSBzdGFydHRpbWUgdGhhdFxuICAgICAgICAgKiBhcHBlYXJzIGluIHRoZSBNaWRpIEZpbGUuICBJZiBhIHRyYWNrIGRvZXNuJ3QgaGF2ZSBhIHN5bWJvbCBmb3IgYVxuICAgICAgICAgKiBwYXJ0aWN1bGFyIHN0YXJ0dGltZSwgdGhlbiBhZGQgYSBcImJsYW5rXCIgc3ltYm9sIGZvciB0aGF0IHRpbWUuXG4gICAgICAgICAqXG4gICAgICAgICAqIE5leHQsIG1ha2Ugc3VyZSB0aGUgc3ltYm9scyBmb3IgZWFjaCBzdGFydCB0aW1lIGFsbCBoYXZlIHRoZSBzYW1lXG4gICAgICAgICAqIHdpZHRoLCBhY3Jvc3MgYWxsIHRyYWNrcy4gIFRoZSBTeW1ib2xXaWR0aHMgY2xhc3Mgc3RvcmVzXG4gICAgICAgICAqIC0gVGhlIHN5bWJvbCB3aWR0aCBmb3IgZWFjaCBzdGFydHRpbWUsIGZvciBlYWNoIHRyYWNrXG4gICAgICAgICAqIC0gVGhlIG1heGltdW0gc3ltYm9sIHdpZHRoIGZvciBhIGdpdmVuIHN0YXJ0dGltZSwgYWNyb3NzIGFsbCB0cmFja3MuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBtZXRob2QgU3ltYm9sV2lkdGhzLkdldEV4dHJhV2lkdGgoKSByZXR1cm5zIHRoZSBleHRyYSB3aWR0aFxuICAgICAgICAgKiBuZWVkZWQgZm9yIGEgdHJhY2sgdG8gbWF0Y2ggdGhlIG1heGltdW0gc3ltYm9sIHdpZHRoIGZvciBhIGdpdmVuXG4gICAgICAgICAqIHN0YXJ0dGltZS5cbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGVcbiAgICAgICAgdm9pZCBBbGlnblN5bWJvbHMoTGlzdDxNdXNpY1N5bWJvbD5bXSBhbGxzeW1ib2xzLCBTeW1ib2xXaWR0aHMgd2lkdGhzLCBNaWRpT3B0aW9ucyBvcHRpb25zKVxuICAgICAgICB7XG5cbiAgICAgICAgICAgIC8vIElmIHdlIHNob3cgbWVhc3VyZSBudW1iZXJzLCBpbmNyZWFzZSBiYXIgc3ltYm9sIHdpZHRoXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zaG93TWVhc3VyZXMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZm9yIChpbnQgdHJhY2sgPSAwOyB0cmFjayA8IGFsbHN5bWJvbHMuTGVuZ3RoOyB0cmFjaysrKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgTGlzdDxNdXNpY1N5bWJvbD4gc3ltYm9scyA9IGFsbHN5bWJvbHNbdHJhY2tdO1xuICAgICAgICAgICAgICAgICAgICBmb3JlYWNoIChNdXNpY1N5bWJvbCBzeW0gaW4gc3ltYm9scylcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN5bSBpcyBCYXJTeW1ib2wpXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ltLldpZHRoICs9IFNoZWV0TXVzaWMuTm90ZVdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGludCB0cmFjayA9IDA7IHRyYWNrIDwgYWxsc3ltYm9scy5MZW5ndGg7IHRyYWNrKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgTGlzdDxNdXNpY1N5bWJvbD4gc3ltYm9scyA9IGFsbHN5bWJvbHNbdHJhY2tdO1xuICAgICAgICAgICAgICAgIExpc3Q8TXVzaWNTeW1ib2w+IHJlc3VsdCA9IG5ldyBMaXN0PE11c2ljU3ltYm9sPigpO1xuXG4gICAgICAgICAgICAgICAgaW50IGkgPSAwO1xuXG4gICAgICAgICAgICAgICAgLyogSWYgYSB0cmFjayBkb2Vzbid0IGhhdmUgYSBzeW1ib2wgZm9yIGEgc3RhcnR0aW1lLFxuICAgICAgICAgICAgICAgICAqIGFkZCBhIGJsYW5rIHN5bWJvbC5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmb3JlYWNoIChpbnQgc3RhcnQgaW4gd2lkdGhzLlN0YXJ0VGltZXMpXG4gICAgICAgICAgICAgICAge1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIEJhclN5bWJvbHMgYXJlIG5vdCBpbmNsdWRlZCBpbiB0aGUgU3ltYm9sV2lkdGhzIGNhbGN1bGF0aW9ucyAqL1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IHN5bWJvbHMuQ291bnQgJiYgKHN5bWJvbHNbaV0gaXMgQmFyU3ltYm9sKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgc3ltYm9sc1tpXS5TdGFydFRpbWUgPD0gc3RhcnQpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5BZGQoc3ltYm9sc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaSA8IHN5bWJvbHMuQ291bnQgJiYgc3ltYm9sc1tpXS5TdGFydFRpbWUgPT0gc3RhcnQpXG4gICAgICAgICAgICAgICAgICAgIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGkgPCBzeW1ib2xzLkNvdW50ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ltYm9sc1tpXS5TdGFydFRpbWUgPT0gc3RhcnQpXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuQWRkKHN5bWJvbHNbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5BZGQobmV3IEJsYW5rU3ltYm9sKHN0YXJ0LCAwKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBGb3IgZWFjaCBzdGFydHRpbWUsIGluY3JlYXNlIHRoZSBzeW1ib2wgd2lkdGggYnlcbiAgICAgICAgICAgICAgICAgKiBTeW1ib2xXaWR0aHMuR2V0RXh0cmFXaWR0aCgpLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGkgPSAwO1xuICAgICAgICAgICAgICAgIHdoaWxlIChpIDwgcmVzdWx0LkNvdW50KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdFtpXSBpcyBCYXJTeW1ib2wpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGludCBzdGFydCA9IHJlc3VsdFtpXS5TdGFydFRpbWU7XG4gICAgICAgICAgICAgICAgICAgIGludCBleHRyYSA9IHdpZHRocy5HZXRFeHRyYVdpZHRoKHRyYWNrLCBzdGFydCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtpXS5XaWR0aCArPSBleHRyYTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBTa2lwIGFsbCByZW1haW5pbmcgc3ltYm9scyB3aXRoIHRoZSBzYW1lIHN0YXJ0dGltZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGkgPCByZXN1bHQuQ291bnQgJiYgcmVzdWx0W2ldLlN0YXJ0VGltZSA9PSBzdGFydClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFsbHN5bWJvbHNbdHJhY2tdID0gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgYm9vbCBJc0Nob3JkKE11c2ljU3ltYm9sIHN5bWJvbClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHN5bWJvbCBpcyBDaG9yZFN5bWJvbDtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqIEZpbmQgMiwgMywgNCwgb3IgNiBjaG9yZCBzeW1ib2xzIHRoYXQgb2NjdXIgY29uc2VjdXRpdmVseSAod2l0aG91dCBhbnlcbiAgICAgICAgICogIHJlc3RzIG9yIGJhcnMgaW4gYmV0d2VlbikuICBUaGVyZSBjYW4gYmUgQmxhbmtTeW1ib2xzIGluIGJldHdlZW4uXG4gICAgICAgICAqXG4gICAgICAgICAqICBUaGUgc3RhcnRJbmRleCBpcyB0aGUgaW5kZXggaW4gdGhlIHN5bWJvbHMgdG8gc3RhcnQgbG9va2luZyBmcm9tLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgU3RvcmUgdGhlIGluZGV4ZXMgb2YgdGhlIGNvbnNlY3V0aXZlIGNob3JkcyBpbiBjaG9yZEluZGV4ZXMuXG4gICAgICAgICAqICBTdG9yZSB0aGUgaG9yaXpvbnRhbCBkaXN0YW5jZSAocGl4ZWxzKSBiZXR3ZWVuIHRoZSBmaXJzdCBhbmQgbGFzdCBjaG9yZC5cbiAgICAgICAgICogIElmIHdlIGZhaWxlZCB0byBmaW5kIGNvbnNlY3V0aXZlIGNob3JkcywgcmV0dXJuIGZhbHNlLlxuICAgICAgICAgKi9cbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgYm9vbFxuICAgICAgICBGaW5kQ29uc2VjdXRpdmVDaG9yZHMoTGlzdDxNdXNpY1N5bWJvbD4gc3ltYm9scywgVGltZVNpZ25hdHVyZSB0aW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50IHN0YXJ0SW5kZXgsIGludFtdIGNob3JkSW5kZXhlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZiBpbnQgaG9yaXpEaXN0YW5jZSlcbiAgICAgICAge1xuXG4gICAgICAgICAgICBpbnQgaSA9IHN0YXJ0SW5kZXg7XG4gICAgICAgICAgICBpbnQgbnVtQ2hvcmRzID0gY2hvcmRJbmRleGVzLkxlbmd0aDtcblxuICAgICAgICAgICAgd2hpbGUgKHRydWUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaG9yaXpEaXN0YW5jZSA9IDA7XG5cbiAgICAgICAgICAgICAgICAvKiBGaW5kIHRoZSBzdGFydGluZyBjaG9yZCAqL1xuICAgICAgICAgICAgICAgIHdoaWxlIChpIDwgc3ltYm9scy5Db3VudCAtIG51bUNob3JkcylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzeW1ib2xzW2ldIGlzIENob3JkU3ltYm9sKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDaG9yZFN5bWJvbCBjID0gKENob3JkU3ltYm9sKXN5bWJvbHNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYy5TdGVtICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaSA+PSBzeW1ib2xzLkNvdW50IC0gbnVtQ2hvcmRzKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY2hvcmRJbmRleGVzWzBdID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2hvcmRJbmRleGVzWzBdID0gaTtcbiAgICAgICAgICAgICAgICBib29sIGZvdW5kQ2hvcmRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3IgKGludCBjaG9yZEluZGV4ID0gMTsgY2hvcmRJbmRleCA8IG51bUNob3JkczsgY2hvcmRJbmRleCsrKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgICAgICBpbnQgcmVtYWluaW5nID0gbnVtQ2hvcmRzIC0gMSAtIGNob3JkSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICgoaSA8IHN5bWJvbHMuQ291bnQgLSByZW1haW5pbmcpICYmIChzeW1ib2xzW2ldIGlzIEJsYW5rU3ltYm9sKSlcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgaG9yaXpEaXN0YW5jZSArPSBzeW1ib2xzW2ldLldpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChpID49IHN5bWJvbHMuQ291bnQgLSByZW1haW5pbmcpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIShzeW1ib2xzW2ldIGlzIENob3JkU3ltYm9sKSlcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRDaG9yZHMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNob3JkSW5kZXhlc1tjaG9yZEluZGV4XSA9IGk7XG4gICAgICAgICAgICAgICAgICAgIGhvcml6RGlzdGFuY2UgKz0gc3ltYm9sc1tpXS5XaWR0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kQ2hvcmRzKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogRWxzZSwgc3RhcnQgc2VhcmNoaW5nIGFnYWluIGZyb20gaW5kZXggaSAqL1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvKiogQ29ubmVjdCBjaG9yZHMgb2YgdGhlIHNhbWUgZHVyYXRpb24gd2l0aCBhIGhvcml6b250YWwgYmVhbS5cbiAgICAgICAgICogIG51bUNob3JkcyBpcyB0aGUgbnVtYmVyIG9mIGNob3JkcyBwZXIgYmVhbSAoMiwgMywgNCwgb3IgNikuXG4gICAgICAgICAqICBpZiBzdGFydEJlYXQgaXMgdHJ1ZSwgdGhlIGZpcnN0IGNob3JkIG11c3Qgc3RhcnQgb24gYSBxdWFydGVyIG5vdGUgYmVhdC5cbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGUgc3RhdGljIHZvaWRcbiAgICAgICAgQ3JlYXRlQmVhbWVkQ2hvcmRzKExpc3Q8TXVzaWNTeW1ib2w+W10gYWxsc3ltYm9scywgVGltZVNpZ25hdHVyZSB0aW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50IG51bUNob3JkcywgYm9vbCBzdGFydEJlYXQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGludFtdIGNob3JkSW5kZXhlcyA9IG5ldyBpbnRbbnVtQ2hvcmRzXTtcbiAgICAgICAgICAgIENob3JkU3ltYm9sW10gY2hvcmRzID0gbmV3IENob3JkU3ltYm9sW251bUNob3Jkc107XG5cbiAgICAgICAgICAgIGZvcmVhY2ggKExpc3Q8TXVzaWNTeW1ib2w+IHN5bWJvbHMgaW4gYWxsc3ltYm9scylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpbnQgc3RhcnRJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgd2hpbGUgKHRydWUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpbnQgaG9yaXpEaXN0YW5jZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGJvb2wgZm91bmQgPSBGaW5kQ29uc2VjdXRpdmVDaG9yZHMoc3ltYm9scywgdGltZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNob3JkSW5kZXhlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWYgaG9yaXpEaXN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZm91bmQpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgbnVtQ2hvcmRzOyBpKyspXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNob3Jkc1tpXSA9IChDaG9yZFN5bWJvbClzeW1ib2xzW2Nob3JkSW5kZXhlc1tpXV07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoQ2hvcmRTeW1ib2wuQ2FuQ3JlYXRlQmVhbShjaG9yZHMsIHRpbWUsIHN0YXJ0QmVhdCkpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIENob3JkU3ltYm9sLkNyZWF0ZUJlYW0oY2hvcmRzLCBob3JpekRpc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0SW5kZXggPSBjaG9yZEluZGV4ZXNbbnVtQ2hvcmRzIC0gMV0gKyAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRJbmRleCA9IGNob3JkSW5kZXhlc1swXSArIDE7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBXaGF0IGlzIHRoZSB2YWx1ZSBvZiBzdGFydEluZGV4IGhlcmU/XG4gICAgICAgICAgICAgICAgICAgICAqIElmIHdlIGNyZWF0ZWQgYSBiZWFtLCB3ZSBzdGFydCBhZnRlciB0aGUgbGFzdCBjaG9yZC5cbiAgICAgICAgICAgICAgICAgICAgICogSWYgd2UgZmFpbGVkIHRvIGNyZWF0ZSBhIGJlYW0sIHdlIHN0YXJ0IGFmdGVyIHRoZSBmaXJzdCBjaG9yZC5cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvKiogQ29ubmVjdCBjaG9yZHMgb2YgdGhlIHNhbWUgZHVyYXRpb24gd2l0aCBhIGhvcml6b250YWwgYmVhbS5cbiAgICAgICAgICpcbiAgICAgICAgICogIFdlIGNyZWF0ZSBiZWFtcyBpbiB0aGUgZm9sbG93aW5nIG9yZGVyOlxuICAgICAgICAgKiAgLSA2IGNvbm5lY3RlZCA4dGggbm90ZSBjaG9yZHMsIGluIDMvNCwgNi84LCBvciA2LzQgdGltZVxuICAgICAgICAgKiAgLSBUcmlwbGV0cyB0aGF0IHN0YXJ0IG9uIHF1YXJ0ZXIgbm90ZSBiZWF0c1xuICAgICAgICAgKiAgLSAzIGNvbm5lY3RlZCBjaG9yZHMgdGhhdCBzdGFydCBvbiBxdWFydGVyIG5vdGUgYmVhdHMgKDEyLzggdGltZSBvbmx5KVxuICAgICAgICAgKiAgLSA0IGNvbm5lY3RlZCBjaG9yZHMgdGhhdCBzdGFydCBvbiBxdWFydGVyIG5vdGUgYmVhdHMgKDQvNCBvciAyLzQgdGltZSBvbmx5KVxuICAgICAgICAgKiAgLSAyIGNvbm5lY3RlZCBjaG9yZHMgdGhhdCBzdGFydCBvbiBxdWFydGVyIG5vdGUgYmVhdHNcbiAgICAgICAgICogIC0gMiBjb25uZWN0ZWQgY2hvcmRzIHRoYXQgc3RhcnQgb24gYW55IGJlYXRcbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGUgc3RhdGljIHZvaWRcbiAgICAgICAgQ3JlYXRlQWxsQmVhbWVkQ2hvcmRzKExpc3Q8TXVzaWNTeW1ib2w+W10gYWxsc3ltYm9scywgVGltZVNpZ25hdHVyZSB0aW1lKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAoKHRpbWUuTnVtZXJhdG9yID09IDMgJiYgdGltZS5EZW5vbWluYXRvciA9PSA0KSB8fFxuICAgICAgICAgICAgICAgICh0aW1lLk51bWVyYXRvciA9PSA2ICYmIHRpbWUuRGVub21pbmF0b3IgPT0gOCkgfHxcbiAgICAgICAgICAgICAgICAodGltZS5OdW1lcmF0b3IgPT0gNiAmJiB0aW1lLkRlbm9taW5hdG9yID09IDQpKVxuICAgICAgICAgICAge1xuXG4gICAgICAgICAgICAgICAgQ3JlYXRlQmVhbWVkQ2hvcmRzKGFsbHN5bWJvbHMsIHRpbWUsIDYsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ3JlYXRlQmVhbWVkQ2hvcmRzKGFsbHN5bWJvbHMsIHRpbWUsIDMsIHRydWUpO1xuICAgICAgICAgICAgQ3JlYXRlQmVhbWVkQ2hvcmRzKGFsbHN5bWJvbHMsIHRpbWUsIDQsIHRydWUpO1xuICAgICAgICAgICAgQ3JlYXRlQmVhbWVkQ2hvcmRzKGFsbHN5bWJvbHMsIHRpbWUsIDIsIHRydWUpO1xuICAgICAgICAgICAgQ3JlYXRlQmVhbWVkQ2hvcmRzKGFsbHN5bWJvbHMsIHRpbWUsIDIsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBHZXQgdGhlIHdpZHRoIChpbiBwaXhlbHMpIG5lZWRlZCB0byBkaXNwbGF5IHRoZSBrZXkgc2lnbmF0dXJlICovXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgaW50XG4gICAgICAgIEtleVNpZ25hdHVyZVdpZHRoKEtleVNpZ25hdHVyZSBrZXkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIENsZWZTeW1ib2wgY2xlZnN5bSA9IG5ldyBDbGVmU3ltYm9sKENsZWYuVHJlYmxlLCAwLCBmYWxzZSk7XG4gICAgICAgICAgICBpbnQgcmVzdWx0ID0gY2xlZnN5bS5NaW5XaWR0aDtcbiAgICAgICAgICAgIEFjY2lkU3ltYm9sW10ga2V5cyA9IGtleS5HZXRTeW1ib2xzKENsZWYuVHJlYmxlKTtcbiAgICAgICAgICAgIGZvcmVhY2ggKEFjY2lkU3ltYm9sIHN5bWJvbCBpbiBrZXlzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBzeW1ib2wuTWluV2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0ICsgU2hlZXRNdXNpYy5MZWZ0TWFyZ2luICsgNTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqIEdpdmVuIE11c2ljU3ltYm9scyBmb3IgYSB0cmFjaywgY3JlYXRlIHRoZSBzdGFmZnMgZm9yIHRoYXQgdHJhY2suXG4gICAgICAgICAqICBFYWNoIFN0YWZmIGhhcyBhIG1heG1pbXVtIHdpZHRoIG9mIFBhZ2VXaWR0aCAoODAwIHBpeGVscykuXG4gICAgICAgICAqICBBbHNvLCBtZWFzdXJlcyBzaG91bGQgbm90IHNwYW4gbXVsdGlwbGUgU3RhZmZzLlxuICAgICAgICAgKi9cbiAgICAgICAgcHJpdmF0ZSBMaXN0PFN0YWZmPlxuICAgICAgICBDcmVhdGVTdGFmZnNGb3JUcmFjayhMaXN0PE11c2ljU3ltYm9sPiBzeW1ib2xzLCBpbnQgbWVhc3VyZWxlbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgS2V5U2lnbmF0dXJlIGtleSwgTWlkaU9wdGlvbnMgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50IHRyYWNrLCBpbnQgdG90YWx0cmFja3MpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGludCBrZXlzaWdXaWR0aCA9IEtleVNpZ25hdHVyZVdpZHRoKGtleSk7XG4gICAgICAgICAgICBpbnQgc3RhcnRpbmRleCA9IDA7XG4gICAgICAgICAgICBMaXN0PFN0YWZmPiB0aGVzdGFmZnMgPSBuZXcgTGlzdDxTdGFmZj4oc3ltYm9scy5Db3VudCAvIDUwKTtcblxuICAgICAgICAgICAgd2hpbGUgKHN0YXJ0aW5kZXggPCBzeW1ib2xzLkNvdW50KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIC8qIHN0YXJ0aW5kZXggaXMgdGhlIGluZGV4IG9mIHRoZSBmaXJzdCBzeW1ib2wgaW4gdGhlIHN0YWZmLlxuICAgICAgICAgICAgICAgICAqIGVuZGluZGV4IGlzIHRoZSBpbmRleCBvZiB0aGUgbGFzdCBzeW1ib2wgaW4gdGhlIHN0YWZmLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGludCBlbmRpbmRleCA9IHN0YXJ0aW5kZXg7XG4gICAgICAgICAgICAgICAgaW50IHdpZHRoID0ga2V5c2lnV2lkdGg7XG4gICAgICAgICAgICAgICAgaW50IG1heHdpZHRoO1xuXG4gICAgICAgICAgICAgICAgLyogSWYgd2UncmUgc2Nyb2xsaW5nIHZlcnRpY2FsbHksIHRoZSBtYXhpbXVtIHdpZHRoIGlzIFBhZ2VXaWR0aC4gKi9cbiAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsVmVydClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG1heHdpZHRoID0gU2hlZXRNdXNpYy5QYWdlV2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG1heHdpZHRoID0gMjAwMDAwMDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoZW5kaW5kZXggPCBzeW1ib2xzLkNvdW50ICYmXG4gICAgICAgICAgICAgICAgICAgICAgIHdpZHRoICsgc3ltYm9sc1tlbmRpbmRleF0uV2lkdGggPCBtYXh3aWR0aClcbiAgICAgICAgICAgICAgICB7XG5cbiAgICAgICAgICAgICAgICAgICAgd2lkdGggKz0gc3ltYm9sc1tlbmRpbmRleF0uV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGVuZGluZGV4Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVuZGluZGV4LS07XG5cbiAgICAgICAgICAgICAgICAvKiBUaGVyZSdzIDMgcG9zc2liaWxpdGllcyBhdCB0aGlzIHBvaW50OlxuICAgICAgICAgICAgICAgICAqIDEuIFdlIGhhdmUgYWxsIHRoZSBzeW1ib2xzIGluIHRoZSB0cmFjay5cbiAgICAgICAgICAgICAgICAgKiAgICBUaGUgZW5kaW5kZXggc3RheXMgdGhlIHNhbWUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiAyLiBXZSBoYXZlIHN5bWJvbHMgZm9yIGxlc3MgdGhhbiBvbmUgbWVhc3VyZS5cbiAgICAgICAgICAgICAgICAgKiAgICBUaGUgZW5kaW5kZXggc3RheXMgdGhlIHNhbWUuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiAzLiBXZSBoYXZlIHN5bWJvbHMgZm9yIDEgb3IgbW9yZSBtZWFzdXJlcy5cbiAgICAgICAgICAgICAgICAgKiAgICBTaW5jZSBtZWFzdXJlcyBjYW5ub3Qgc3BhbiBtdWx0aXBsZSBzdGFmZnMsIHdlIG11c3RcbiAgICAgICAgICAgICAgICAgKiAgICBtYWtlIHN1cmUgZW5kaW5kZXggZG9lcyBub3Qgb2NjdXIgaW4gdGhlIG1pZGRsZSBvZiBhXG4gICAgICAgICAgICAgICAgICogICAgbWVhc3VyZS4gIFdlIGNvdW50IGJhY2t3YXJkcyB1bnRpbCB3ZSBjb21lIHRvIHRoZSBlbmRcbiAgICAgICAgICAgICAgICAgKiAgICBvZiBhIG1lYXN1cmUuXG4gICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgICBpZiAoZW5kaW5kZXggPT0gc3ltYm9scy5Db3VudCAtIDEpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAvKiBlbmRpbmRleCBzdGF5cyB0aGUgc2FtZSAqL1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzeW1ib2xzW3N0YXJ0aW5kZXhdLlN0YXJ0VGltZSAvIG1lYXN1cmVsZW4gPT1cbiAgICAgICAgICAgICAgICAgICAgICAgICBzeW1ib2xzW2VuZGluZGV4XS5TdGFydFRpbWUgLyBtZWFzdXJlbGVuKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgLyogZW5kaW5kZXggc3RheXMgdGhlIHNhbWUgKi9cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaW50IGVuZG1lYXN1cmUgPSBzeW1ib2xzW2VuZGluZGV4ICsgMV0uU3RhcnRUaW1lIC8gbWVhc3VyZWxlbjtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHN5bWJvbHNbZW5kaW5kZXhdLlN0YXJ0VGltZSAvIG1lYXN1cmVsZW4gPT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZG1lYXN1cmUpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZGluZGV4LS07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW50IHJhbmdlID0gZW5kaW5kZXggKyAxIC0gc3RhcnRpbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsVmVydClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoID0gU2hlZXRNdXNpYy5QYWdlV2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFN0YWZmIHN0YWZmID0gbmV3IFN0YWZmKHN5bWJvbHMuR2V0UmFuZ2Uoc3RhcnRpbmRleCwgcmFuZ2UpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSwgb3B0aW9ucywgdHJhY2ssIHRvdGFsdHJhY2tzKTtcbiAgICAgICAgICAgICAgICB0aGVzdGFmZnMuQWRkKHN0YWZmKTtcbiAgICAgICAgICAgICAgICBzdGFydGluZGV4ID0gZW5kaW5kZXggKyAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoZXN0YWZmcztcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqIEdpdmVuIGFsbCB0aGUgTXVzaWNTeW1ib2xzIGZvciBldmVyeSB0cmFjaywgY3JlYXRlIHRoZSBzdGFmZnNcbiAgICAgICAgICogZm9yIHRoZSBzaGVldCBtdXNpYy4gIFRoZXJlIGFyZSB0d28gcGFydHMgdG8gdGhpczpcbiAgICAgICAgICpcbiAgICAgICAgICogLSBHZXQgdGhlIGxpc3Qgb2Ygc3RhZmZzIGZvciBlYWNoIHRyYWNrLlxuICAgICAgICAgKiAgIFRoZSBzdGFmZnMgd2lsbCBiZSBzdG9yZWQgaW4gdHJhY2tzdGFmZnMgYXM6XG4gICAgICAgICAqXG4gICAgICAgICAqICAgdHJhY2tzdGFmZnNbMF0gPSB7IFN0YWZmMCwgU3RhZmYxLCBTdGFmZjIsIC4uLiB9IGZvciB0cmFjayAwXG4gICAgICAgICAqICAgdHJhY2tzdGFmZnNbMV0gPSB7IFN0YWZmMCwgU3RhZmYxLCBTdGFmZjIsIC4uLiB9IGZvciB0cmFjayAxXG4gICAgICAgICAqICAgdHJhY2tzdGFmZnNbMl0gPSB7IFN0YWZmMCwgU3RhZmYxLCBTdGFmZjIsIC4uLiB9IGZvciB0cmFjayAyXG4gICAgICAgICAqXG4gICAgICAgICAqIC0gU3RvcmUgdGhlIFN0YWZmcyBpbiB0aGUgc3RhZmZzIGxpc3QsIGJ1dCBpbnRlcmxlYXZlIHRoZVxuICAgICAgICAgKiAgIHRyYWNrcyBhcyBmb2xsb3dzOlxuICAgICAgICAgKlxuICAgICAgICAgKiAgIHN0YWZmcyA9IHsgU3RhZmYwIGZvciB0cmFjayAwLCBTdGFmZjAgZm9yIHRyYWNrMSwgU3RhZmYwIGZvciB0cmFjazIsXG4gICAgICAgICAqICAgICAgICAgICAgICBTdGFmZjEgZm9yIHRyYWNrIDAsIFN0YWZmMSBmb3IgdHJhY2sxLCBTdGFmZjEgZm9yIHRyYWNrMixcbiAgICAgICAgICogICAgICAgICAgICAgIFN0YWZmMiBmb3IgdHJhY2sgMCwgU3RhZmYyIGZvciB0cmFjazEsIFN0YWZmMiBmb3IgdHJhY2syLFxuICAgICAgICAgKiAgICAgICAgICAgICAgLi4uIH0gXG4gICAgICAgICAqL1xuICAgICAgICBwcml2YXRlIExpc3Q8U3RhZmY+XG4gICAgICAgIENyZWF0ZVN0YWZmcyhMaXN0PE11c2ljU3ltYm9sPltdIGFsbHN5bWJvbHMsIEtleVNpZ25hdHVyZSBrZXksXG4gICAgICAgICAgICAgICAgICAgICBNaWRpT3B0aW9ucyBvcHRpb25zLCBpbnQgbWVhc3VyZWxlbilcbiAgICAgICAge1xuXG4gICAgICAgICAgICBMaXN0PFN0YWZmPltdIHRyYWNrc3RhZmZzID0gbmV3IExpc3Q8U3RhZmY+W2FsbHN5bWJvbHMuTGVuZ3RoXTtcbiAgICAgICAgICAgIGludCB0b3RhbHRyYWNrcyA9IHRyYWNrc3RhZmZzLkxlbmd0aDtcblxuICAgICAgICAgICAgZm9yIChpbnQgdHJhY2sgPSAwOyB0cmFjayA8IHRvdGFsdHJhY2tzOyB0cmFjaysrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIExpc3Q8TXVzaWNTeW1ib2w+IHN5bWJvbHMgPSBhbGxzeW1ib2xzW3RyYWNrXTtcbiAgICAgICAgICAgICAgICB0cmFja3N0YWZmc1t0cmFja10gPSBDcmVhdGVTdGFmZnNGb3JUcmFjayhzeW1ib2xzLCBtZWFzdXJlbGVuLCBrZXksIG9wdGlvbnMsIHRyYWNrLCB0b3RhbHRyYWNrcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIFVwZGF0ZSB0aGUgRW5kVGltZSBvZiBlYWNoIFN0YWZmLiBFbmRUaW1lIGlzIHVzZWQgZm9yIHBsYXliYWNrICovXG4gICAgICAgICAgICBmb3JlYWNoIChMaXN0PFN0YWZmPiBsaXN0IGluIHRyYWNrc3RhZmZzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgbGlzdC5Db3VudCAtIDE7IGkrKylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RbaV0uRW5kVGltZSA9IGxpc3RbaSArIDFdLlN0YXJ0VGltZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIEludGVybGVhdmUgdGhlIHN0YWZmcyBvZiBlYWNoIHRyYWNrIGludG8gdGhlIHJlc3VsdCBhcnJheS4gKi9cbiAgICAgICAgICAgIGludCBtYXhzdGFmZnMgPSAwO1xuICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCB0cmFja3N0YWZmcy5MZW5ndGg7IGkrKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAobWF4c3RhZmZzIDwgdHJhY2tzdGFmZnNbaV0uQ291bnQpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBtYXhzdGFmZnMgPSB0cmFja3N0YWZmc1tpXS5Db3VudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBMaXN0PFN0YWZmPiByZXN1bHQgPSBuZXcgTGlzdDxTdGFmZj4obWF4c3RhZmZzICogdHJhY2tzdGFmZnMuTGVuZ3RoKTtcbiAgICAgICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgbWF4c3RhZmZzOyBpKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZm9yZWFjaCAoTGlzdDxTdGFmZj4gbGlzdCBpbiB0cmFja3N0YWZmcylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpIDwgbGlzdC5Db3VudClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LkFkZChsaXN0W2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogR2V0IHRoZSBseXJpY3MgZm9yIGVhY2ggdHJhY2sgKi9cbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgTGlzdDxMeXJpY1N5bWJvbD5bXVxuICAgICAgICBHZXRMeXJpY3MoTGlzdDxNaWRpVHJhY2s+IHRyYWNrcylcbiAgICAgICAge1xuICAgICAgICAgICAgYm9vbCBoYXNMeXJpY3MgPSBmYWxzZTtcbiAgICAgICAgICAgIExpc3Q8THlyaWNTeW1ib2w+W10gcmVzdWx0ID0gbmV3IExpc3Q8THlyaWNTeW1ib2w+W3RyYWNrcy5Db3VudF07XG4gICAgICAgICAgICBmb3IgKGludCB0cmFja251bSA9IDA7IHRyYWNrbnVtIDwgdHJhY2tzLkNvdW50OyB0cmFja251bSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIE1pZGlUcmFjayB0cmFjayA9IHRyYWNrc1t0cmFja251bV07XG4gICAgICAgICAgICAgICAgaWYgKHRyYWNrLkx5cmljcyA9PSBudWxsKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGhhc0x5cmljcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVzdWx0W3RyYWNrbnVtXSA9IG5ldyBMaXN0PEx5cmljU3ltYm9sPigpO1xuICAgICAgICAgICAgICAgIGZvcmVhY2ggKE1pZGlFdmVudCBldiBpbiB0cmFjay5MeXJpY3MpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBTdHJpbmcgdGV4dCA9IFVURjhFbmNvZGluZy5VVEY4LkdldFN0cmluZyhldi5WYWx1ZSwgMCwgZXYuVmFsdWUuTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgTHlyaWNTeW1ib2wgc3ltID0gbmV3IEx5cmljU3ltYm9sKGV2LlN0YXJ0VGltZSwgdGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFt0cmFja251bV0uQWRkKHN5bSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFoYXNMeXJpY3MpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBBZGQgdGhlIGx5cmljIHN5bWJvbHMgdG8gdGhlIGNvcnJlc3BvbmRpbmcgc3RhZmZzICovXG4gICAgICAgIHN0YXRpYyB2b2lkXG4gICAgICAgIEFkZEx5cmljc1RvU3RhZmZzKExpc3Q8U3RhZmY+IHN0YWZmcywgTGlzdDxMeXJpY1N5bWJvbD5bXSB0cmFja2x5cmljcylcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yZWFjaCAoU3RhZmYgc3RhZmYgaW4gc3RhZmZzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIExpc3Q8THlyaWNTeW1ib2w+IGx5cmljcyA9IHRyYWNrbHlyaWNzW3N0YWZmLlRyYWNrXTtcbiAgICAgICAgICAgICAgICBzdGFmZi5BZGRMeXJpY3MobHlyaWNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqIFNldCB0aGUgem9vbSBsZXZlbCB0byBkaXNwbGF5IGF0ICgxLjAgPT0gMTAwJSkuXG4gICAgICAgICAqIFJlY2FsY3VsYXRlIHRoZSBTaGVldE11c2ljIHdpZHRoIGFuZCBoZWlnaHQgYmFzZWQgb24gdGhlXG4gICAgICAgICAqIHpvb20gbGV2ZWwuICBUaGVuIHJlZHJhdyB0aGUgU2hlZXRNdXNpYy4gXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgdm9pZCBTZXRab29tKGZsb2F0IHZhbHVlKVxuICAgICAgICB7XG4gICAgICAgICAgICB6b29tID0gdmFsdWU7XG4gICAgICAgICAgICBmbG9hdCB3aWR0aCA9IDA7XG4gICAgICAgICAgICBmbG9hdCBoZWlnaHQgPSAwO1xuICAgICAgICAgICAgZm9yZWFjaCAoU3RhZmYgc3RhZmYgaW4gc3RhZmZzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHdpZHRoID0gTWF0aC5NYXgod2lkdGgsIHN0YWZmLldpZHRoICogem9vbSk7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ICs9IChzdGFmZi5IZWlnaHQgKiB6b29tKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFdpZHRoID0gKGludCkod2lkdGggKyAyKTtcbiAgICAgICAgICAgIEhlaWdodCA9ICgoaW50KWhlaWdodCkgKyBMZWZ0TWFyZ2luO1xuICAgICAgICAgICAgdGhpcy5JbnZhbGlkYXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQ2hhbmdlIHRoZSBub3RlIGNvbG9ycyBmb3IgdGhlIHNoZWV0IG11c2ljLCBhbmQgcmVkcmF3LiAqL1xuICAgICAgICBwcml2YXRlIHZvaWQgU2V0Q29sb3JzKENvbG9yW10gbmV3Y29sb3JzLCBDb2xvciBuZXdzaGFkZSwgQ29sb3IgbmV3c2hhZGUyKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAoTm90ZUNvbG9ycyA9PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIE5vdGVDb2xvcnMgPSBuZXcgQ29sb3JbMTJdO1xuICAgICAgICAgICAgICAgIGZvciAoaW50IGkgPSAwOyBpIDwgMTI7IGkrKylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIE5vdGVDb2xvcnNbaV0gPSBDb2xvci5CbGFjaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmV3Y29sb3JzICE9IG51bGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCAxMjsgaSsrKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgTm90ZUNvbG9yc1tpXSA9IG5ld2NvbG9yc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZm9yIChpbnQgaSA9IDA7IGkgPCAxMjsgaSsrKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgTm90ZUNvbG9yc1tpXSA9IENvbG9yLkJsYWNrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzaGFkZUJydXNoICE9IG51bGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2hhZGVCcnVzaC5EaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgc2hhZGUyQnJ1c2guRGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2hhZGVCcnVzaCA9IG5ldyBTb2xpZEJydXNoKG5ld3NoYWRlKTtcbiAgICAgICAgICAgIHNoYWRlMkJydXNoID0gbmV3IFNvbGlkQnJ1c2gobmV3c2hhZGUyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBHZXQgdGhlIGNvbG9yIGZvciBhIGdpdmVuIG5vdGUgbnVtYmVyICovXG4gICAgICAgIHB1YmxpYyBDb2xvciBOb3RlQ29sb3IoaW50IG51bWJlcilcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIE5vdGVDb2xvcnNbTm90ZVNjYWxlLkZyb21OdW1iZXIobnVtYmVyKV07XG4gICAgICAgIH1cblxuICAgICAgICAvKiogR2V0IHRoZSBzaGFkZSBicnVzaCAqL1xuICAgICAgICBwdWJsaWMgQnJ1c2ggU2hhZGVCcnVzaFxuICAgICAgICB7XG4gICAgICAgICAgICBnZXQgeyByZXR1cm4gc2hhZGVCcnVzaDsgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEdldCB0aGUgc2hhZGUyIGJydXNoICovXG4gICAgICAgIHB1YmxpYyBCcnVzaCBTaGFkZTJCcnVzaFxuICAgICAgICB7XG4gICAgICAgICAgICBnZXQgeyByZXR1cm4gc2hhZGUyQnJ1c2g7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBHZXQgd2hldGhlciB0byBzaG93IG5vdGUgbGV0dGVycyBvciBub3QgKi9cbiAgICAgICAgcHVibGljIGludCBTaG93Tm90ZUxldHRlcnNcbiAgICAgICAge1xuICAgICAgICAgICAgZ2V0IHsgcmV0dXJuIHNob3dOb3RlTGV0dGVyczsgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEdldCB0aGUgbWFpbiBrZXkgc2lnbmF0dXJlICovXG4gICAgICAgIHB1YmxpYyBLZXlTaWduYXR1cmUgTWFpbktleVxuICAgICAgICB7XG4gICAgICAgICAgICBnZXQgeyByZXR1cm4gbWFpbmtleTsgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvKiogU2V0IHRoZSBzaXplIG9mIHRoZSBub3RlcywgbGFyZ2Ugb3Igc21hbGwuICBTbWFsbGVyIG5vdGVzIG1lYW5zXG4gICAgICAgICAqIG1vcmUgbm90ZXMgcGVyIHN0YWZmLlxuICAgICAgICAgKi9cbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkIFNldE5vdGVTaXplKGJvb2wgbGFyZ2Vub3RlcylcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKGxhcmdlbm90ZXMpXG4gICAgICAgICAgICAgICAgTGluZVNwYWNlID0gNztcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBMaW5lU3BhY2UgPSA1O1xuXG4gICAgICAgICAgICBTdGFmZkhlaWdodCA9IExpbmVTcGFjZSAqIDQgKyBMaW5lV2lkdGggKiA1O1xuICAgICAgICAgICAgTm90ZUhlaWdodCA9IExpbmVTcGFjZSArIExpbmVXaWR0aDtcbiAgICAgICAgICAgIE5vdGVXaWR0aCA9IDMgKiBMaW5lU3BhY2UgLyAyO1xuICAgICAgICAgICAgTGV0dGVyRm9udCA9IG5ldyBGb250KFwiQXJpYWxcIiwgOCwgRm9udFN0eWxlLlJlZ3VsYXIpO1xuICAgICAgICB9XG5cblxuICAgICAgICAvKiogRHJhdyB0aGUgU2hlZXRNdXNpYy5cbiAgICAgICAgICogU2NhbGUgdGhlIGdyYXBoaWNzIGJ5IHRoZSBjdXJyZW50IHpvb20gZmFjdG9yLlxuICAgICAgICAgKiBHZXQgdGhlIHZlcnRpY2FsIHN0YXJ0IGFuZCBlbmQgcG9pbnRzIG9mIHRoZSBjbGlwIGFyZWEuXG4gICAgICAgICAqIE9ubHkgZHJhdyBTdGFmZnMgd2hpY2ggbGllIGluc2lkZSB0aGUgY2xpcCBhcmVhLlxuICAgICAgICAgKi9cbiAgICAgICAgcHJvdGVjdGVkIC8qb3ZlcnJpZGUqLyB2b2lkIE9uUGFpbnQoUGFpbnRFdmVudEFyZ3MgZSlcbiAgICAgICAge1xuICAgICAgICAgICAgUmVjdGFuZ2xlIGNsaXAgPVxuICAgICAgICAgICAgICBuZXcgUmVjdGFuZ2xlKChpbnQpKGUuQ2xpcFJlY3RhbmdsZS5YIC8gem9vbSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGludCkoZS5DbGlwUmVjdGFuZ2xlLlkgLyB6b29tKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW50KShlLkNsaXBSZWN0YW5nbGUuV2lkdGggLyB6b29tKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW50KShlLkNsaXBSZWN0YW5nbGUuSGVpZ2h0IC8gem9vbSkpO1xuXG4gICAgICAgICAgICBHcmFwaGljcyBnID0gZS5HcmFwaGljcygpO1xuICAgICAgICAgICAgZy5TY2FsZVRyYW5zZm9ybSh6b29tLCB6b29tKTtcbiAgICAgICAgICAgIC8qIGcuUGFnZVNjYWxlID0gem9vbTsgKi9cbiAgICAgICAgICAgIGcuU21vb3RoaW5nTW9kZSA9IFNtb290aGluZ01vZGUuQW50aUFsaWFzO1xuICAgICAgICAgICAgaW50IHlwb3MgPSAwO1xuICAgICAgICAgICAgZm9yZWFjaCAoU3RhZmYgc3RhZmYgaW4gc3RhZmZzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmICgoeXBvcyArIHN0YWZmLkhlaWdodCA8IGNsaXAuWSkgfHwgKHlwb3MgPiBjbGlwLlkgKyBjbGlwLkhlaWdodCkpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAvKiBTdGFmZiBpcyBub3QgaW4gdGhlIGNsaXAsIGRvbid0IG5lZWQgdG8gZHJhdyBpdCAqL1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgwLCB5cG9zKTtcbiAgICAgICAgICAgICAgICAgICAgc3RhZmYuRHJhdyhnLCBjbGlwLCBwZW4sIFNlbGVjdGlvblN0YXJ0UHVsc2UsIFNlbGVjdGlvbkVuZFB1bHNlLCBkZXNlbGVjdGVkU2hhZGVCcnVzaCk7XG4gICAgICAgICAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKDAsIC15cG9zKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB5cG9zICs9IHN0YWZmLkhlaWdodDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGcuU2NhbGVUcmFuc2Zvcm0oMS4wZiAvIHpvb20sIDEuMGYgLyB6b29tKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBXcml0ZSB0aGUgTUlESSBmaWxlbmFtZSBhdCB0aGUgdG9wIG9mIHRoZSBwYWdlICovXG4gICAgICAgIHByaXZhdGUgdm9pZCBEcmF3VGl0bGUoR3JhcGhpY3MgZylcbiAgICAgICAge1xuICAgICAgICAgICAgaW50IGxlZnRtYXJnaW4gPSAyMDtcbiAgICAgICAgICAgIGludCB0b3BtYXJnaW4gPSAyMDtcbiAgICAgICAgICAgIHN0cmluZyB0aXRsZSA9IFBhdGguR2V0RmlsZU5hbWUoZmlsZW5hbWUpO1xuICAgICAgICAgICAgdGl0bGUgPSB0aXRsZS5SZXBsYWNlKFwiLm1pZFwiLCBcIlwiKS5SZXBsYWNlKFwiX1wiLCBcIiBcIik7XG4gICAgICAgICAgICBGb250IGZvbnQgPSBuZXcgRm9udChcIkFyaWFsXCIsIDEwLCBGb250U3R5bGUuQm9sZCk7XG4gICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybShsZWZ0bWFyZ2luLCB0b3BtYXJnaW4pO1xuICAgICAgICAgICAgZy5EcmF3U3RyaW5nKHRpdGxlLCBmb250LCBCcnVzaGVzLkJsYWNrLCAwLCAwKTtcbiAgICAgICAgICAgIGcuVHJhbnNsYXRlVHJhbnNmb3JtKC1sZWZ0bWFyZ2luLCAtdG9wbWFyZ2luKTtcbiAgICAgICAgICAgIGZvbnQuRGlzcG9zZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybiB0aGUgbnVtYmVyIG9mIHBhZ2VzIG5lZWRlZCB0byBwcmludCB0aGlzIHNoZWV0IG11c2ljLlxuICAgICAgICAgKiBBIHN0YWZmIHNob3VsZCBmaXQgd2l0aGluIGEgc2luZ2xlIHBhZ2UsIG5vdCBiZSBzcGxpdCBhY3Jvc3MgdHdvIHBhZ2VzLlxuICAgICAgICAgKiBJZiB0aGUgc2hlZXQgbXVzaWMgaGFzIGV4YWN0bHkgMiB0cmFja3MsIHRoZW4gdHdvIHN0YWZmcyBzaG91bGRcbiAgICAgICAgICogZml0IHdpdGhpbiBhIHNpbmdsZSBwYWdlLCBhbmQgbm90IGJlIHNwbGl0IGFjcm9zcyB0d28gcGFnZXMuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgaW50IEdldFRvdGFsUGFnZXMoKVxuICAgICAgICB7XG4gICAgICAgICAgICBpbnQgbnVtID0gMTtcbiAgICAgICAgICAgIGludCBjdXJyaGVpZ2h0ID0gVGl0bGVIZWlnaHQ7XG5cbiAgICAgICAgICAgIGlmIChudW10cmFja3MgPT0gMiAmJiAoc3RhZmZzLkNvdW50ICUgMikgPT0gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IHN0YWZmcy5Db3VudDsgaSArPSAyKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaW50IGhlaWdodHMgPSBzdGFmZnNbaV0uSGVpZ2h0ICsgc3RhZmZzW2kgKyAxXS5IZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyaGVpZ2h0ICsgaGVpZ2h0cyA+IFBhZ2VIZWlnaHQpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bSsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmhlaWdodCA9IGhlaWdodHM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyaGVpZ2h0ICs9IGhlaWdodHM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZm9yZWFjaCAoU3RhZmYgc3RhZmYgaW4gc3RhZmZzKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJoZWlnaHQgKyBzdGFmZi5IZWlnaHQgPiBQYWdlSGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBudW0rKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJoZWlnaHQgPSBzdGFmZi5IZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyaGVpZ2h0ICs9IHN0YWZmLkhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudW07XG4gICAgICAgIH1cblxuICAgICAgICAvKiogU2hhZGUgYWxsIHRoZSBjaG9yZHMgcGxheWVkIGF0IHRoZSBnaXZlbiBwdWxzZSB0aW1lLlxuICAgICAgICAgKiAgTG9vcCB0aHJvdWdoIGFsbCB0aGUgc3RhZmZzIGFuZCBjYWxsIHN0YWZmLlNoYWRlKCkuXG4gICAgICAgICAqICBJZiBzY3JvbGxHcmFkdWFsbHkgaXMgdHJ1ZSwgc2Nyb2xsIGdyYWR1YWxseSAoc21vb3RoIHNjcm9sbGluZylcbiAgICAgICAgICogIHRvIHRoZSBzaGFkZWQgbm90ZXMuIFJldHVybnMgdGhlIG1pbmltdW0geS1jb29yZGluYXRlIG9mIHRoZSBzaGFkZWQgY2hvcmQgKGZvciBzY3JvbGxpbmcgcHVycG9zZXMpXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgUmVjdGFuZ2xlIFNoYWRlTm90ZXMoaW50IGN1cnJlbnRQdWxzZVRpbWUsIGJvb2wgc2Nyb2xsR3JhZHVhbGx5LCBTb2xpZEJydXNoIGJydXNoKVxuICAgICAgICB7XG4gICAgICAgICAgICBHcmFwaGljcyBnID0gQ3JlYXRlR3JhcGhpY3MoXCJzaGFkZU5vdGVzXCIpO1xuICAgICAgICAgICAgZy5TbW9vdGhpbmdNb2RlID0gU21vb3RoaW5nTW9kZS5BbnRpQWxpYXM7XG4gICAgICAgICAgICBnLlNjYWxlVHJhbnNmb3JtKHpvb20sIHpvb20pO1xuICAgICAgICAgICAgaW50IHlwb3MgPSAwO1xuXG4gICAgICAgICAgICBpbnQgeF9zaGFkZSA9IDA7XG4gICAgICAgICAgICBpbnQgeV9zaGFkZSA9IDA7XG4gICAgICAgICAgICBpbnQgd2lkdGggPSAwO1xuICAgICAgICAgICAgaW50IGhlaWdodCA9IDA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvcmVhY2ggKFN0YWZmIHN0YWZmIGluIHN0YWZmcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybSgwLCB5cG9zKTtcbiAgICAgICAgICAgICAgICB3aWR0aCArPSBzdGFmZi5TaGFkZU5vdGVzKGcsIGJydXNoLCBwZW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50UHVsc2VUaW1lLCByZWYgeF9zaGFkZSk7XG4gICAgICAgICAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oMCwgLXlwb3MpO1xuICAgICAgICAgICAgICAgIHlwb3MgKz0gc3RhZmYuSGVpZ2h0O1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50UHVsc2VUaW1lID49IHN0YWZmLkVuZFRpbWUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB5X3NoYWRlICs9IHN0YWZmLkhlaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRQdWxzZVRpbWUgPj0gc3RhZmYuU3RhcnRUaW1lICYmIGN1cnJlbnRQdWxzZVRpbWUgPD0gc3RhZmYuRW5kVGltZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCArPSBzdGFmZi5IZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZy5TY2FsZVRyYW5zZm9ybSgxLjBmIC8gem9vbSwgMS4wZiAvIHpvb20pO1xuICAgICAgICAgICAgZy5EaXNwb3NlKCk7XG4gICAgICAgICAgICB4X3NoYWRlID0gKGludCkoeF9zaGFkZSAqIHpvb20pO1xuICAgICAgICAgICAgeV9zaGFkZSAtPSBOb3RlSGVpZ2h0O1xuICAgICAgICAgICAgeV9zaGFkZSA9IChpbnQpKHlfc2hhZGUgKiB6b29tKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UHVsc2VUaW1lID49IDApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgU2Nyb2xsVG9TaGFkZWROb3Rlcyh4X3NoYWRlLCB5X3NoYWRlLCBzY3JvbGxHcmFkdWFsbHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWN0YW5nbGUoeF9zaGFkZSwgeV9zaGFkZSwgd2lkdGgsIChpbnQpKChoZWlnaHQrOCkgKiB6b29tKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogU2Nyb2xsIHRoZSBzaGVldCBtdXNpYyBzbyB0aGF0IHRoZSBzaGFkZWQgbm90ZXMgYXJlIHZpc2libGUuXG4gICAgICAgICAgKiBJZiBzY3JvbGxHcmFkdWFsbHkgaXMgdHJ1ZSwgc2Nyb2xsIGdyYWR1YWxseSAoc21vb3RoIHNjcm9sbGluZylcbiAgICAgICAgICAqIHRvIHRoZSBzaGFkZWQgbm90ZXMuXG4gICAgICAgICAgKi9cbiAgICAgICAgdm9pZCBTY3JvbGxUb1NoYWRlZE5vdGVzKGludCB4X3NoYWRlLCBpbnQgeV9zaGFkZSwgYm9vbCBzY3JvbGxHcmFkdWFsbHkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIFBhbmVsIHNjcm9sbHZpZXcgPSAoUGFuZWwpdGhpcy5QYXJlbnQ7XG4gICAgICAgICAgICBQb2ludCBzY3JvbGxQb3MgPSBzY3JvbGx2aWV3LkF1dG9TY3JvbGxQb3NpdGlvbjtcblxuICAgICAgICAgICAgLyogVGhlIHNjcm9sbCBwb3NpdGlvbiBpcyBpbiBuZWdhdGl2ZSBjb29yZGluYXRlcyBmb3Igc29tZSByZWFzb24gKi9cbiAgICAgICAgICAgIHNjcm9sbFBvcy5YID0gLXNjcm9sbFBvcy5YO1xuICAgICAgICAgICAgc2Nyb2xsUG9zLlkgPSAtc2Nyb2xsUG9zLlk7XG4gICAgICAgICAgICBQb2ludCBuZXdQb3MgPSBzY3JvbGxQb3M7XG5cbiAgICAgICAgICAgIGlmIChzY3JvbGxWZXJ0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGludCBzY3JvbGxEaXN0ID0gKGludCkoeV9zaGFkZSAtIHNjcm9sbFBvcy5ZKTtcblxuICAgICAgICAgICAgICAgIGlmIChzY3JvbGxHcmFkdWFsbHkpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsRGlzdCA+ICh6b29tICogU3RhZmZIZWlnaHQgKiA4KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbERpc3QgPSBzY3JvbGxEaXN0IC8gMjtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc2Nyb2xsRGlzdCA+IChOb3RlSGVpZ2h0ICogMyAqIHpvb20pKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRGlzdCA9IChpbnQpKE5vdGVIZWlnaHQgKiAzICogem9vbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5ld1BvcyA9IG5ldyBQb2ludChzY3JvbGxQb3MuWCwgc2Nyb2xsUG9zLlkgKyBzY3JvbGxEaXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpbnQgeF92aWV3ID0gc2Nyb2xsUG9zLlggKyA0MCAqIHNjcm9sbHZpZXcuV2lkdGggLyAxMDA7XG4gICAgICAgICAgICAgICAgaW50IHhtYXggPSBzY3JvbGxQb3MuWCArIDY1ICogc2Nyb2xsdmlldy5XaWR0aCAvIDEwMDtcbiAgICAgICAgICAgICAgICBpbnQgc2Nyb2xsRGlzdCA9IHhfc2hhZGUgLSB4X3ZpZXc7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsR3JhZHVhbGx5KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhfc2hhZGUgPiB4bWF4KVxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRGlzdCA9ICh4X3NoYWRlIC0geF92aWV3KSAvIDM7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHhfc2hhZGUgPiB4X3ZpZXcpXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxEaXN0ID0gKHhfc2hhZGUgLSB4X3ZpZXcpIC8gNjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBuZXdQb3MgPSBuZXcgUG9pbnQoc2Nyb2xsUG9zLlggKyBzY3JvbGxEaXN0LCBzY3JvbGxQb3MuWSk7XG4gICAgICAgICAgICAgICAgaWYgKG5ld1Bvcy5YIDwgMClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1Bvcy5YID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzY3JvbGx2aWV3LkF1dG9TY3JvbGxQb3NpdGlvbiA9IG5ld1BvcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBSZXR1cm4gdGhlIHB1bHNlVGltZSBjb3JyZXNwb25kaW5nIHRvIHRoZSBnaXZlbiBwb2ludCBvbiB0aGUgU2hlZXRNdXNpYy5cbiAgICAgICAgICogIEZpcnN0LCBmaW5kIHRoZSBzdGFmZiBjb3JyZXNwb25kaW5nIHRvIHRoZSBwb2ludC5cbiAgICAgICAgICogIFRoZW4sIHdpdGhpbiB0aGUgc3RhZmYsIGZpbmQgdGhlIG5vdGVzL3N5bWJvbHMgY29ycmVzcG9uZGluZyB0byB0aGUgcG9pbnQsXG4gICAgICAgICAqICBhbmQgcmV0dXJuIHRoZSBTdGFydFRpbWUgKHB1bHNlVGltZSkgb2YgdGhlIHN5bWJvbHMuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgaW50IFB1bHNlVGltZUZvclBvaW50KFBvaW50IHBvaW50KVxuICAgICAgICB7XG4gICAgICAgICAgICBQb2ludCBzY2FsZWRQb2ludCA9IG5ldyBQb2ludCgoaW50KShwb2ludC5YIC8gem9vbSksIChpbnQpKHBvaW50LlkgLyB6b29tKSk7XG4gICAgICAgICAgICBpbnQgeSA9IDA7XG4gICAgICAgICAgICBmb3JlYWNoIChTdGFmZiBzdGFmZiBpbiBzdGFmZnMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKHNjYWxlZFBvaW50LlkgPj0geSAmJiBzY2FsZWRQb2ludC5ZIDw9IHkgKyBzdGFmZi5IZWlnaHQpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RhZmYuUHVsc2VUaW1lRm9yUG9pbnQoc2NhbGVkUG9pbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB5ICs9IHN0YWZmLkhlaWdodDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBvdmVycmlkZSBzdHJpbmcgVG9TdHJpbmcoKVxuICAgICAgICB7XG4gICAgICAgICAgICBzdHJpbmcgcmVzdWx0ID0gXCJTaGVldE11c2ljIHN0YWZmcz1cIiArIHN0YWZmcy5Db3VudCArIFwiXFxuXCI7XG4gICAgICAgICAgICBmb3JlYWNoIChTdGFmZiBzdGFmZiBpbiBzdGFmZnMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IHN0YWZmLlRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQgKz0gXCJFbmQgU2hlZXRNdXNpY1xcblwiO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgfVxuXG59XG4iLCJ1c2luZyBTeXN0ZW07XG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcbnVzaW5nIFN5c3RlbS5UZXh0O1xuXG5uYW1lc3BhY2UgTWlkaVNoZWV0TXVzaWNcbntcbiAgICBwdWJsaWMgY2xhc3MgU29saWRCcnVzaDpCcnVzaFxuICAgIHtcbiAgICAgICAgcHVibGljIHN0YXRpYyBCcnVzaCBDbGVhciA9IG5ldyBTb2xpZEJydXNoKCk7XG5cbiAgICAgICAgcHVibGljIGJvb2wgSXNDbGVhcigpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcyA9PSBDbGVhcjtcclxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBTb2xpZEJydXNoKCk6YmFzZShuZXcgQ29sb3IoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBTb2xpZEJydXNoKENvbG9yIGNvbG9yKTpcbiAgICAgICAgICAgIGJhc2UoY29sb3IpXG4gICAgICAgIHtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMSBNYWRoYXYgVmFpZHlhbmF0aGFuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOyB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDIuXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cblxudXNpbmcgU3lzdGVtO1xudXNpbmcgU3lzdGVtLklPO1xudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XG51c2luZyBTeXN0ZW0uVGV4dDtcblxubmFtZXNwYWNlIE1pZGlTaGVldE11c2ljIHtcblxuLyoqIEBjbGFzcyBUaW1lU2lnU3ltYm9sXG4gKiBBIFRpbWVTaWdTeW1ib2wgcmVwcmVzZW50cyB0aGUgdGltZSBzaWduYXR1cmUgYXQgdGhlIGJlZ2lubmluZ1xuICogb2YgdGhlIHN0YWZmLiBXZSB1c2UgcHJlLW1hZGUgaW1hZ2VzIGZvciB0aGUgbnVtYmVycywgaW5zdGVhZCBvZlxuICogZHJhd2luZyBzdHJpbmdzLlxuICovXG5cbnB1YmxpYyBjbGFzcyBUaW1lU2lnU3ltYm9sIDogTXVzaWNTeW1ib2wge1xuICAgIHByaXZhdGUgc3RhdGljIEltYWdlW10gaW1hZ2VzOyAgLyoqIFRoZSBpbWFnZXMgZm9yIGVhY2ggbnVtYmVyICovXG4gICAgcHJpdmF0ZSBpbnQgIG51bWVyYXRvcjsgICAgICAgICAvKiogVGhlIG51bWVyYXRvciAqL1xuICAgIHByaXZhdGUgaW50ICBkZW5vbWluYXRvcjsgICAgICAgLyoqIFRoZSBkZW5vbWluYXRvciAqL1xuICAgIHByaXZhdGUgaW50ICB3aWR0aDsgICAgICAgICAgICAgLyoqIFRoZSB3aWR0aCBpbiBwaXhlbHMgKi9cbiAgICBwcml2YXRlIGJvb2wgY2FuZHJhdzsgICAgICAgICAgIC8qKiBUcnVlIGlmIHdlIGNhbiBkcmF3IHRoZSB0aW1lIHNpZ25hdHVyZSAqL1xuXG4gICAgLyoqIENyZWF0ZSBhIG5ldyBUaW1lU2lnU3ltYm9sICovXG4gICAgcHVibGljIFRpbWVTaWdTeW1ib2woaW50IG51bWVyLCBpbnQgZGVub20pIHtcbiAgICAgICAgbnVtZXJhdG9yID0gbnVtZXI7XG4gICAgICAgIGRlbm9taW5hdG9yID0gZGVub207XG4gICAgICAgIExvYWRJbWFnZXMoKTtcbiAgICAgICAgaWYgKG51bWVyID49IDAgJiYgbnVtZXIgPCBpbWFnZXMuTGVuZ3RoICYmIGltYWdlc1tudW1lcl0gIT0gbnVsbCAmJlxuICAgICAgICAgICAgZGVub20gPj0gMCAmJiBkZW5vbSA8IGltYWdlcy5MZW5ndGggJiYgaW1hZ2VzW251bWVyXSAhPSBudWxsKSB7XG4gICAgICAgICAgICBjYW5kcmF3ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNhbmRyYXcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB3aWR0aCA9IE1pbldpZHRoO1xuICAgIH1cblxuICAgIC8qKiBMb2FkIHRoZSBpbWFnZXMgaW50byBtZW1vcnkuICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgdm9pZCBMb2FkSW1hZ2VzKCkge1xuICAgICAgICBpZiAoaW1hZ2VzID09IG51bGwpIHtcbiAgICAgICAgICAgIGltYWdlcyA9IG5ldyBJbWFnZVsxM107XG4gICAgICAgICAgICBmb3IgKGludCBpID0gMDsgaSA8IDEzOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpbWFnZXNbaV0gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW1hZ2VzWzJdID0gbmV3IEJpdG1hcCh0eXBlb2YoVGltZVNpZ1N5bWJvbCksIFwiUmVzb3VyY2VzLkltYWdlcy50d28ucG5nXCIpO1xuICAgICAgICAgICAgaW1hZ2VzWzNdID0gbmV3IEJpdG1hcCh0eXBlb2YoVGltZVNpZ1N5bWJvbCksIFwiUmVzb3VyY2VzLkltYWdlcy50aHJlZS5wbmdcIik7XG4gICAgICAgICAgICBpbWFnZXNbNF0gPSBuZXcgQml0bWFwKHR5cGVvZihUaW1lU2lnU3ltYm9sKSwgXCJSZXNvdXJjZXMuSW1hZ2VzLmZvdXIucG5nXCIpO1xuICAgICAgICAgICAgaW1hZ2VzWzZdID0gbmV3IEJpdG1hcCh0eXBlb2YoVGltZVNpZ1N5bWJvbCksIFwiUmVzb3VyY2VzLkltYWdlcy5zaXgucG5nXCIpO1xuICAgICAgICAgICAgaW1hZ2VzWzhdID0gbmV3IEJpdG1hcCh0eXBlb2YoVGltZVNpZ1N5bWJvbCksIFwiUmVzb3VyY2VzLkltYWdlcy5laWdodC5wbmdcIik7XG4gICAgICAgICAgICBpbWFnZXNbOV0gPSBuZXcgQml0bWFwKHR5cGVvZihUaW1lU2lnU3ltYm9sKSwgXCJSZXNvdXJjZXMuSW1hZ2VzLm5pbmUucG5nXCIpO1xuICAgICAgICAgICAgaW1hZ2VzWzEyXSA9IG5ldyBCaXRtYXAodHlwZW9mKFRpbWVTaWdTeW1ib2wpLCBcIlJlc291cmNlcy5JbWFnZXMudHdlbHZlLnBuZ1wiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIHRpbWUgKGluIHB1bHNlcykgdGhpcyBzeW1ib2wgb2NjdXJzIGF0LiAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgU3RhcnRUaW1lIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIC0xOyB9XG4gICAgfVxuXG4gICAgLyoqIEdldCB0aGUgbWluaW11bSB3aWR0aCAoaW4gcGl4ZWxzKSBuZWVkZWQgdG8gZHJhdyB0aGlzIHN5bWJvbCAqL1xuICAgIHB1YmxpYyBvdmVycmlkZSBpbnQgTWluV2lkdGgge1xuICAgICAgICBnZXQgeyBpZiAoY2FuZHJhdykgXG4gICAgICAgICAgICAgICAgICByZXR1cm4gaW1hZ2VzWzJdLldpZHRoICogU2hlZXRNdXNpYy5Ob3RlSGVpZ2h0ICogMiAvaW1hZ2VzWzJdLkhlaWdodDtcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIEdldC9TZXQgdGhlIHdpZHRoIChpbiBwaXhlbHMpIG9mIHRoaXMgc3ltYm9sLiBUaGUgd2lkdGggaXMgc2V0XG4gICAgICogaW4gU2hlZXRNdXNpYy5BbGlnblN5bWJvbHMoKSB0byB2ZXJ0aWNhbGx5IGFsaWduIHN5bWJvbHMuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBXaWR0aCB7XG4gICAgICAgZ2V0IHsgcmV0dXJuIHdpZHRoOyB9XG4gICAgICAgc2V0IHsgd2lkdGggPSB2YWx1ZTsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBwaXhlbHMgdGhpcyBzeW1ib2wgZXh0ZW5kcyBhYm92ZSB0aGUgc3RhZmYuIFVzZWRcbiAgICAgKiAgdG8gZGV0ZXJtaW5lIHRoZSBtaW5pbXVtIGhlaWdodCBuZWVkZWQgZm9yIHRoZSBzdGFmZiAoU3RhZmYuRmluZEJvdW5kcykuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBBYm92ZVN0YWZmIHsgXG4gICAgICAgIGdldCB7ICByZXR1cm4gMDsgfVxuICAgIH1cblxuICAgIC8qKiBHZXQgdGhlIG51bWJlciBvZiBwaXhlbHMgdGhpcyBzeW1ib2wgZXh0ZW5kcyBiZWxvdyB0aGUgc3RhZmYuIFVzZWRcbiAgICAgKiAgdG8gZGV0ZXJtaW5lIHRoZSBtaW5pbXVtIGhlaWdodCBuZWVkZWQgZm9yIHRoZSBzdGFmZiAoU3RhZmYuRmluZEJvdW5kcykuXG4gICAgICovXG4gICAgcHVibGljIG92ZXJyaWRlIGludCBCZWxvd1N0YWZmIHtcbiAgICAgICAgZ2V0IHsgcmV0dXJuIDA7IH0gXG4gICAgfVxuXG4gICAgLyoqIERyYXcgdGhlIHN5bWJvbC5cbiAgICAgKiBAcGFyYW0geXRvcCBUaGUgeWxvY2F0aW9uIChpbiBwaXhlbHMpIHdoZXJlIHRoZSB0b3Agb2YgdGhlIHN0YWZmIHN0YXJ0cy5cbiAgICAgKi9cbiAgICBwdWJsaWMgb3ZlcnJpZGUgXG4gICAgdm9pZCBEcmF3KEdyYXBoaWNzIGcsIFBlbiBwZW4sIGludCB5dG9wKSB7XG4gICAgICAgIGlmICghY2FuZHJhdylcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBnLlRyYW5zbGF0ZVRyYW5zZm9ybShXaWR0aCAtIE1pbldpZHRoLCAwKTtcbiAgICAgICAgSW1hZ2UgbnVtZXIgPSBpbWFnZXNbbnVtZXJhdG9yXTtcbiAgICAgICAgSW1hZ2UgZGVub20gPSBpbWFnZXNbZGVub21pbmF0b3JdO1xuXG4gICAgICAgIC8qIFNjYWxlIHRoZSBpbWFnZSB3aWR0aCB0byBtYXRjaCB0aGUgaGVpZ2h0ICovXG4gICAgICAgIGludCBpbWdoZWlnaHQgPSBTaGVldE11c2ljLk5vdGVIZWlnaHQgKiAyO1xuICAgICAgICBpbnQgaW1nd2lkdGggPSBudW1lci5XaWR0aCAqIGltZ2hlaWdodCAvIG51bWVyLkhlaWdodDtcbiAgICAgICAgZy5EcmF3SW1hZ2UobnVtZXIsIDAsIHl0b3AsIGltZ3dpZHRoLCBpbWdoZWlnaHQpO1xuICAgICAgICBnLkRyYXdJbWFnZShkZW5vbSwgMCwgeXRvcCArIFNoZWV0TXVzaWMuTm90ZUhlaWdodCoyLCBpbWd3aWR0aCwgaW1naGVpZ2h0KTtcbiAgICAgICAgZy5UcmFuc2xhdGVUcmFuc2Zvcm0oLShXaWR0aCAtIE1pbldpZHRoKSwgMCk7XG4gICAgfVxuXG4gICAgcHVibGljIG92ZXJyaWRlIHN0cmluZyBUb1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5Gb3JtYXQoXCJUaW1lU2lnU3ltYm9sIG51bWVyYXRvcj17MH0gZGVub21pbmF0b3I9ezF9XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyYXRvciwgZGVub21pbmF0b3IpO1xuICAgIH1cbn1cblxufVxuXG4iXQp9Cg==
