# Variable transitions in Odin

## Introduction

In this article I will talk about how to write a simple transitions system for variables, that you can use to transition the value of a variable over a certain duration of time, either linearly or using an easing function.

If you'd rather just see the code, you can find the code samples of different implementations on my [github repo](https://github.com/cristicismas/transitions-demo).

At the end you will be able to create transitions easily using a simple api:

```
my_var: f32 = 0.0

start_transition(&my_var, Transition{initial = 0.0, final = 1.0, time = 2.0, easing = .Sine_In})
```

## Starting point

Let's first get some stuff on the screen so we can visualise the transitions. I will write some simple _raylib_ code, but feel free to use any rendering library you want, it will not change the core of our transition code.

```
package main

import rl "vendor:raylib"

vec2 :: rl.Vector2

main :: proc() {
	rl.InitWindow(1280, 720, "Transitions Demo")

	rl.SetTargetFPS(144)

	pos := vec2{50,50}
	size := vec2{50,50}

	for !rl.WindowShouldClose() {
		rl.BeginDrawing()

		rl.ClearBackground(rl.DARKBLUE)
		rl.DrawRectangleV(pos, size, rl.WHITE)

		rl.EndDrawing()
	}

	rl.CloseWindow()
}

```

## Adding the simplest transition logic

Now that we have something on the screen, we can start working on our transition system. In the article it may seem like we have a lot of code, but you will notice that most of it is comments that explain each concept, and the amount of actual logic is pretty small.

- A Transition struct. We will create this whenever we want to start a new transition. For now we will only use f32 values in our struct, but later we can make it more generic.

```
Transition :: struct {
	// The initial value that the transition will start from. You can pass the current value of the variable, or another value entirely.
	initial:       f32,
	// The final value that our variable will reach at the end of the transition.
	final:         f32,
	// The duration of the transition, passed in seconds
	time:          f32,
	// Here we can use whatever we define in the struct below. We later match on these using Odin's math/ease functions as the interpolator for non-linear easings.
	easing:        Transition_Easing,
	// This is needed for the Handle_Map to work properly. You should not pass this when creating the Transition. It is however a member of this struct to avoid creating another one just for the sake of avoiding a few extra members.
	handle:        Transition_Id,
	// These are used for the internal logic only, which is why they are underscored. They should not be passed when creating the transition.
	_data_pointer: ^f32,
	_time_passed:  f32,
}

Transition_Easing :: enum {
	Linear,
	Sine_In,
	Sine_Out,
}
```

- A place to keep our transitions. This can either be in some custom structure that you have, or you could just keep them as a global variable, since we aren't going to multithread this code anyway. I'm going to store the transitions in a handle map since that will simplify things later. If you don't know what a Handle Map is, you can read [Karl's article](https://zylinski.se/posts/handle-based-maps-three-implementations/) on the topic, or simply think of it as an array that can be addressed with an ID instead of an index for now.

```
import hm "core:container/handle_map"

// This is the maximum amount of transitions we will have in our application.
// That means we are allocating up-front the cost of the maximum amount of transitions.
TRANSITIONS_MAP_CAP :: 2048

// This defines the Transitions_Handle_Map type
Transition_Id :: distinct hm.Handle32
Transitions_Handle_Map :: hm.Static_Handle_Map(TRANSITIONS_MAP_CAP, Transition, Transition_Id)

// The transitions handle_map. Make sure you define this above the main procedure.
transitions: Transitions_Handle_Map
```


- A way to update our transitions. We simply loop over all the items in the handle map, and update the value to be a little closer to our final value on each frame.

```
// Import linalg at the top of your file to use the lerp function, so we can interpolate our value
import "core:math/linalg"
// Import ease package to we can have different math functions for our interpolator (sine-in, sine-out, etc.)
import "core:math/ease"

update_transitions :: proc(transitions: ^Transitions_Handle_Map) {
	it := hm.iterator_make(transitions)

	// Here we use the raylib's function to get the time since the last frame.
	// If you use another graphics library, feel free to use that library's function
	// Just keep in mind that in raylib this time is in seconds, so you may need to adjust appropriately.
	delta := rl.GetFrameTime()

	for transition, handle in hm.iterate(&it) {
		transition._time_passed += delta

		update_transition_value(transition)

		// If any transition has passed its expiration date, then remove it from the handle map. Its slot in the handle map will be reused later if another transition is added.
		if transition._time_passed >= transition.time {
			hm.remove(transitions, handle)
		}
	}
}

update_transition_value :: proc(transition: ^Transition) {
	progress: f32

	// In case the time passed to the transition is 0, we just set the progress to 1 to avoid division by 0 in the other branch.
	if transition.time == 0 {
		progress = 1
	} else {
		progress = min(transition._time_passed, transition.time) / transition.time
	}

	// If the easing type is linear, the interpolator is simply our computed progress based on time passed.
	interpolator := progress

	// If the easing type is not linear, we will update our interpolator using the easing functions in the 'ease' package
	switch transition.easing {
	case .Linear:
	case .Sine_In:
		interpolator = ease.sine_in(interpolator)
	case .Sine_Out:
		interpolator = ease.sine_out(interpolator)
	// Add more easing types from the 'ease' package if you want
	}

	initial := transition.initial
	final := transition.final

	// update the value based on our interpolator
	v^ = linalg.lerp(initial, final, interpolator)
}
```

We will call the procedure to update our transitions on every frame inside raylib's main loop:

```
for !rl.WindowShouldClose() {
    update_transitions(&transitions)
    ...
}
```

- Finally, the procedure that starts our transition. Since all the heavy-lifting logic is done already, this is a very simple procedure.

```
start_transition :: proc(
	data_pointer: ^f32,
	transition: Transition,
	// loc is just used to get better error messages out.
	loc := #caller_location,
) -> Transition_Id {
	if transition.time < 0 {
		panic("Transition time cannot be < 0.", loc = loc)
	}

	// make a local copy of transition so we can change its fields
	transition := transition

	// Set the struct's internal member to the first parameter.
	//
	// NOTE: We could have also just passed this inside the struct, which would have removed a parameter from this procedure.
	// However, I decided I liked the api better if the first parameter is the pointer to the data, because it means it's
	// impossible to forget to pass it. It also makes it very clear which variable we are trying to transition.
	transition._data_pointer = data_pointer

	// Set the value instantly to the initial value passed to the struct
	data_pointer^ = transition.initial

	// Just add our transition to the handle map. The update_transitions procedure will take care of the rest.
	handle, add_ok := hm.add(&transitions, transition)

	if !add_ok {
		panic("Failed to add a transition to the handle map.", loc = loc)
	}

	return handle
}
```

Without comments, all this code comes to just about over 100 lines of code, which gives us a nice api to transition any f32 value in our project (with custom easing types too!).

Let's try it out to visualise if it really works. Change your main procedure to include _start\_transition_ calls, and play around with the values and transition easing:

```
main :: proc() {
	rl.InitWindow(1280, 720, "Transitions Demo")

	rl.SetTargetFPS(144)

	pos := vec2{50, 50}
	size := vec2{50, 50}

	start_transition(&pos.x, Transition{initial = 50, final = 550, time = 2, easing = .Sine_In})
	start_transition(&size.y, Transition{initial = 50, final = 100, time = 2, easing = .Sine_Out})

	for !rl.WindowShouldClose() {
		update_transitions(&transitions)

		rl.BeginDrawing()

		rl.ClearBackground(rl.DARKBLUE)
		rl.DrawRectangleV(pos, size, rl.WHITE)

		rl.EndDrawing()
	}

	rl.CloseWindow()
}
```

If you did everything correctly up until this point, you will see the size and position of our square will change according to the values we passed in the Transition struct.

## Handling different value types

You may have noticed that we can only transition between f32 values, because that is how our initial and final members of the struct have been defined. However, we can update the function to handle (pretty-much) any type of value, including _vec2_ like we have for our square's position and size. That means we won't have to transition each component of the vector manually, and we will be able to use the function like this:

```
pos: vec2 = {}

start_transition(
	&pos,
	Transition {
		initial = pos,
		final = vec2{500, 500},
		time = 2,
		easing = .Sine_In,
	},
)
```

The first step here is to change the value of the _initial_, _final_, and _\_data\_pointer_ members. We will add all the values we want to transition into 2 separate unions. For now let's add values for f32 and vec2:

```
Transition_Value :: union {
	f32,
	vec2,
}

Transition_Value_Pointer :: union {
	^f32,
	^vec2,
}

Transition :: struct {
	initial:       Transition_Value,
	final:         Transition_Value,
	time:          f32,
	easing:        Transition_Easing,
	handle:        Transition_Id,
	_data_pointer: Transition_Value_Pointer,
	_time_passed:  f32,
}
```

Then we need to match on the _\_data\_pointer_ in the _update\_transition\_value_ proc, and handle the interpolation of each value type individually:

```
update_transition_value :: proc(transition: ^Transition) {
	...
	initial := transition.initial
	final := transition.final

	// remove this line
	// transition._data_pointer^ = linalg.lerp(initial, final, interpolator)

	switch v in transition._data_pointer {
	case ^f32:
		v^ = linalg.lerp(initial.(f32), final.(f32), interpolator)
	case ^vec2:
		v^ = linalg.lerp(initial.(vec2), final.(vec2), interpolator)
	}
}
```

And finally we update the start\_transition proc to set the initial value. We need to import _core:reflect_ to do this easily. Change the data\_pointer parameter type to _Transition\_Value\_Pointer_, and change the assignment to data\_pointer^, we now need to set this value using _reflect.set\_union\_value_

```
import "core:reflect"

...

start_transition :: proc(
	data_pointer: Transition_Value_Pointer,
	transition: Transition,
	loc := #caller_location,
) -> Transition_Id {
	...

	// remove this
	// data_pointer^ = transition.initial

	// Set the value instantly to the initial value passed to the struct
	initial_value := reflect.get_union_variant(transition.initial)
	// This will CRASH if the type of initial_value does not match the type of data_pointer
	reflect.set_union_value(data_pointer, initial_value)

	...
}
```

Making the transition code generic, also made it less robust and more prone to crashes. We have to add some safety checks so the program does not crash in a confusing way. Here are possible points of failure right now:

1. If we pass different values to the initial and final fields of our struct, the program will crash.
2. If we pass different values to data\_pointer and the initial or final fields, the program will crash.


The solution to the first problem is pretty simple, we just check if they are the same type:

```
start_transition :: proc(
	data_pointer: Transition_Value_Pointer,
	transition: Transition,
	// loc is just used to get better error messages out.
	// It gives us the source-code location of where this function was called.
	loc := #caller_location,
) -> Transition_Id {
	...

	initial_type := reflect.union_variant_typeid(transition.initial)
	final_type := reflect.union_variant_typeid(transition.final)

	if initial_type != final_type {
		panic("Transition: initial type doesn't match final type: ", loc = loc)
	}

	...
}

```

The solution for the second problem is a bit more complex. Because we need to compare a union of a value, and a union of a pointer to that value, we will have to jump through a few hoops to check that the data\_pointer type is the same as our initial type. Let's write a separate procedure for this:

```
import "base:runtime"

...

compare_pointer_type_to_base_type :: proc(
	pointer_union: Transition_Value_Pointer,
	normal_union: Transition_Value,
) -> (
	same: bool,
) {
	pointer_type := reflect.union_variant_typeid(pointer_union)
	normal_type := reflect.union_variant_typeid(normal_union)

	pointer_type_info := type_info_of(pointer_type)
	normal_type_info := type_info_of(normal_type)

	pointer_element_type_info, is_pointer := pointer_type_info.variant.(runtime.Type_Info_Pointer)
	equal := is_pointer && pointer_element_type_info.elem.id == normal_type_info.id

	return equal
}
```

Now let's use this in our _start\_transition_ proc:

```
start_transition :: proc(
	data_pointer: Transition_Value_Pointer,
	transition: Transition,
	// loc is just used to get better error messages out.
	// It gives us the source-code location of where this function was called.
	loc := #caller_location,
) -> Transition_Id {
	...

	initial_type := reflect.union_variant_typeid(transition.initial)
	final_type := reflect.union_variant_typeid(transition.final)

	if initial_type != final_type {
		panic("Transition: initial type doesn't match final type: ", loc = loc)
	}

	pointer_type := reflect.union_variant_typeid(data_pointer)

	if !compare_pointer_type_to_base_type(data_pointer, transition.initial) {
		panic("Transition: data_pointer type doesn't match the other types", loc = loc)
	}

	...
}
```

Now your transition code can handle whatever types you may need. When you want to interpolate between values of a new type, simply handle it in the _update\_transition\_value_ proc. Let's update our square's position and size directly now, instead of updating the x and y components individually:

```
main :: proc() {
	rl.InitWindow(1280, 720, "Transitions Demo")

	rl.SetTargetFPS(144)

	pos := vec2{50, 50}
	size := vec2{50, 50}

	start_transition(
		&pos,
		Transition{initial = vec2{50, 50}, final = vec2{500, 500}, time = 2, easing = .Sine_In},
	)
	start_transition(
		&size,
		Transition{initial = vec2{50, 50}, final = vec2{100, 150}, time = 2, easing = .Sine_Out},
	)

	for !rl.WindowShouldClose() {
		update_transitions(&transitions)

		rl.BeginDrawing()

		rl.ClearBackground(rl.DARKBLUE)
		rl.DrawRectangleV(pos, size, rl.WHITE)

		rl.EndDrawing()
	}

	rl.CloseWindow()
}
```

As you can see, this is a very powerful and versatile implementation for handling transitions in your application / game code. You may take this further by making sequences of transitions chained together to have a full blown animation system! However, that is beyond the scope of this article.

## Reference

This article was partly inspired by rxi's article: [A Simple UI Animation System](https://rxi.github.io/a_simple_ui_animation_system.html). I recommend reading this if you want more ideas about how to implement your own transitions / animation algorithm.

## Thanks for reading!

If this article helped you, feel free to share it with others! If you have any feedback, or something wasn't clear enough, I'd love to hear about it, so please send me an email at cristicismas@pm.me.
