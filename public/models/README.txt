Drop web-ready 3D models here (glTF/GLB format).

To wire one up to the featured scroll viewer:
  1. Convert your STL/CAD export to .glb (Blender: File > Import > STL, then File > Export > glTF 2.0).
  2. Save it in this folder, e.g.  clearnote.glb
  3. In src/js/viewer.js set:  const MODEL_URL = './models/clearnote.glb';

Keep meshes as separate top-level objects in the export — each top-level
object becomes one part of the exploded view. Name parts "panel", "board",
"battery", or "back" to attach the matching callout label.
