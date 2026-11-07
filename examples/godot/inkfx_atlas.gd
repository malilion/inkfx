extends RefCounted

## Load an InkFX PNG/JSON pair into SpriteFrames for AnimatedSprite2D.
static func load_frames(atlas_path: String) -> SpriteFrames:
	var atlas: Variant = JSON.parse_string(FileAccess.get_file_as_string(atlas_path))
	if not atlas is Dictionary:
		push_error("Invalid InkFX atlas: " + atlas_path)
		return null

	var meta: Variant = atlas.get("meta")
	var entries: Variant = atlas.get("frames")
	if not meta is Dictionary or not meta.get("inkfx") is Dictionary or not entries is Dictionary or entries.is_empty():
		push_error("Missing InkFX atlas metadata or frames: " + atlas_path)
		return null
	var ink: Dictionary = meta["inkfx"]
	var image_path := atlas_path.get_base_dir().path_join(str(meta["image"]))
	var texture := load(image_path) as Texture2D
	if texture == null:
		push_error("Cannot load the InkFX sheet: " + image_path)
		return null

	var frames := SpriteFrames.new()
	var animation := StringName(ink["id"])
	var fps: float = ink["fps"]
	frames.remove_animation(&"default")
	frames.add_animation(animation)
	frames.set_animation_speed(animation, fps)
	frames.set_animation_loop(animation, ink["loop"])

	var names: Array = entries.keys()
	names.sort()
	for name in names:
		var cell: Dictionary = entries[name]["frame"]
		var region := AtlasTexture.new()
		region.atlas = texture
		region.region = Rect2(cell["x"], cell["y"], cell["w"], cell["h"])
		region.filter_clip = true
		var relative_duration: float = entries[name]["duration"] * fps / 1000.0
		frames.add_frame(animation, region, relative_duration)
	frames.set_meta(&"inkfx", ink)
	return frames
