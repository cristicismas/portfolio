let show_scroll_up_button = false;
const scroll_up_button = document.getElementById("scroll-up-button");

const scroll_threshold = 300;

const scroll_top_initial = document.scrollingElement.scrollTop;

const show_button = () => {
  scroll_up_button.classList.add("show");
  scroll_up_button.classList.remove("hide");
  show_scroll_up_button = true;
};

const hide_button = () => {
  scroll_up_button.classList.add("hide");
  scroll_up_button.classList.remove("show");
  show_scroll_up_button = false;
};

const handleButton = (scroll_top) => {
  if (
    scroll_top > scroll_threshold &&
    scroll_top <
      document.scrollingElement.scrollHeight -
        scroll_threshold -
        window.innerHeight
  ) {
    show_button();
  } else {
    hide_button();
  }
};

handleButton(scroll_top_initial);

const on_scroll = () => {
  const scroll_top = document.scrollingElement.scrollTop;

  handleButton(scroll_top);
};

scroll_up_button.addEventListener("click", () => {
  document.scrollingElement.scrollTop = 0;
});

document.addEventListener("scroll", on_scroll);
