const dots = [];

const generateDots = () => {
  const MAX_DOTS = 500;

  const dots_container = document.getElementById("dots");

  for (let i = 0; i < MAX_DOTS; i++) {
    const dot = document.createElement("div");
    dot.classList.add("dot");
    dots.push(dot);

    dots_container.appendChild(dot);
  }
};

const clamp = (val, min, max) => {
  if (val < min) return min;
  if (val > max) return max;
  return val;
};

const convertValueToRange = (oldValue, oldMin, oldMax, newMin, newMax) => {
  // NOTE: only works if the second range is inverse.
  const isInverseProportion = newMin > newMax && oldMin < oldMax;

  const oldRange = oldMax - oldMin;
  // to avoid  dividing by 0
  if (oldRange == 0) {
    return newMin;
  } else {
    if (isInverseProportion) {
      const newRange = newMin - newMax;

      const newValue =
        newRange -
        (((oldValue - oldMin) * newRange) / oldRange + newMin - newRange);
      return clamp(newValue, newMax, newMin);
    } else {
      const newRange = newMax - newMin;

      const newValue = ((oldValue - oldMin) * newRange) / oldRange + newMin;
      return clamp(newValue, newMin, newMax);
    }
  }
};

// let testCount = 0;
// const test = (expression, expected) => {
//   if (expression === expected) {
//     console.log(`Test ${testCount}: ${expression} === ${expected} - Passed`);
//   } else {
//     console.log(`Test ${testCount}: ${expression} !== ${expected} - Failed`);
//   }
//   testCount += 1;
// };
//
// test(convertValueToRange(50, 0, 100, 0, 1), 0.5);
// test(convertValueToRange(20, 0, 200, 1, 0), 0.9);

const length2 = (x, y) => Math.pow(x, 2) + Math.pow(y, 2);
const length = (x, y) => Math.sqrt(length2(x, y));

const MIN_DISTANCE = 0;
// large distance needed to have faster distance calculation without sqrt
const MAX_OPACITY_DISTANCE = 390_000;
const MAX_RADIUS_DISTANCE = 325_000;

updateDots = (mouse_x, mouse_y) => {
  const hero = document.getElementById("hero").getBoundingClientRect();
  for (const d of dots) {
    const x = d.offsetLeft;
    const y = d.offsetTop;

    const is_inside_hero =
      x > hero.x &&
      x < hero.width + hero.x &&
      y > hero.y &&
      y < hero.height + hero.y;

    const hero_center_x = hero.width / 2 + hero.x;
    const hero_center_y = hero.height / 2 + hero.y;

    let distance_x = x - mouse_x;
    let distance_y = y - mouse_y;

    if (is_inside_hero) {
      distance_x = (x - hero_center_x) / 2;
      distance_y = y - hero_center_y;
    }

    let distance_len = length2(distance_x, distance_y);

    const border_radius = convertValueToRange(
      distance_len,
      MIN_DISTANCE,
      MAX_RADIUS_DISTANCE,
      10,
      1,
    );
    d.style.borderRadius = `${border_radius}px`;

    const opacity = convertValueToRange(
      distance_len,
      MIN_DISTANCE,
      MAX_OPACITY_DISTANCE,
      0,
      0.1,
    );
    d.style.opacity = opacity;
  }
};

const onMouseMove = (e) => {
  const mouse_x = e.clientX;
  const mouse_y = e.clientY;

  updateDots(mouse_x, mouse_y);
};

const init = () => {
  generateDots();
  updateDots(99999, 99999);

  document.addEventListener("mousemove", onMouseMove);
  window.addEventListener("resize", () => updateDots(99999, 99999));
};

init();
