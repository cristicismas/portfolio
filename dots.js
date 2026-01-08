const dots = [];

const generateDots = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const SPLIT_DISTANCE = 60;

  let rows = Math.floor(height / SPLIT_DISTANCE);
  let cols = Math.floor(width / SPLIT_DISTANCE);

  if (width < 900) {
    rows += 1;
    cols += 1;
  }

  const distance_between_dots = width / rows;
  const padding = distance_between_dots / 2;

  const dots_container = document.getElementById("dots");

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dot = document.createElement("div");
      dot.classList.add("dot");
      dot.style.top = `${padding + row * SPLIT_DISTANCE}px`;
      dot.style.left = `${padding + col * SPLIT_DISTANCE}px`;
      dots.push(dot);

      dots_container.appendChild(dot);
    }
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

const length2 = (x, y) => Math.pow(x, 2) + Math.pow(y, 2);
const length = (x, y) => Math.sqrt(length2(x, y));

const MIN_DISTANCE = 0;
// large distance needed to have faster distance calculation without sqrt
const MAX_SCALE_DISTANCE = 800_000;
const MAX_RADIUS_DISTANCE = 525_000;

const updateDots = (mouse_x = 999999, mouse_y = 999999) => {
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
      5,
      0,
    );
    d.style.borderRadius = `${border_radius}px`;

    screen_center_x = window.innerWidth / 2;
    screen_center_y = window.innerHeight / 2;

    let distance_to_center = length2(x - hero_center_x, y - hero_center_y);

    const scale = convertValueToRange(
      distance_to_center,
      MIN_DISTANCE,
      MAX_SCALE_DISTANCE,
      0.5,
      3,
    );
    d.style.scale = scale;
  }
};

const deleteDots = () => {
  const dots = document.getElementById("dots");
  dots.innerHTML = "";
};

const onMouseMove = (e) => {
  const mouse_x = e.clientX;
  const mouse_y = e.clientY;

  updateDots(mouse_x, mouse_y);
};

const init = () => {
  if (document.getElementById("dots")) {
    generateDots();
    updateDots();

    document.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", () => {
      deleteDots();
      generateDots();
      updateDots();
    });
  }
};

init();
