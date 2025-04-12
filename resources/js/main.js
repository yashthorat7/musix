setInterval(() => {
    location.reload();
}, 5400);

Neutralino.init();

Neutralino.window.setDraggableRegion("main-wrapper", {
    alwaysCapture: true,
    dragMinDistance: 12,
});

Neutralino.events.on("ready", async () => {
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
  
    const windowSize = await Neutralino.window.getSize();
    const windowWidth = windowSize.width;
    const windowHeight = windowSize.height;
  
    const x = screenWidth - windowWidth - 25;
    const y = screenHeight - windowHeight - 25;
  
    await Neutralino.window.move(x, y);
  });