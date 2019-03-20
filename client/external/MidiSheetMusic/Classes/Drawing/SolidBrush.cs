using System;
using System.Collections.Generic;
using System.Text;

namespace MidiSheetMusic
{
    public class SolidBrush:Brush
    {
        public static Brush Clear = new SolidBrush();

        public bool IsClear()
        {
            return this == Clear;
        }

        private SolidBrush():base(new Color())
        {
        }

        public SolidBrush(Color color):
            base(color)
        {
        }
    }
}
