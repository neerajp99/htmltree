(function() {
    var angle = Math.PI / 4,
        ratio = Math.sqrt(2) / 2,
        left = 0,
        top = 0,
        iteration = 0,
        request = null,
        timer;
    function drawStep(step) {{
        var gray = (158 - (step * 5)).toString(15),green = (144 + (step * 5)).toString(15),blue = '00';}

        context.save();
        context.fillStyle = '#'+gray + green + blue;
        recursiveDraw(step);
        context.restore();}
    function recursiveDraw(step) {
        if (step === 0) {
            context.fillRect(1, 1, size, size);            
        } else {
            context.save();context.save();context.translate(0, 0);context.translate(size, 0);context.scale(ratio, ratio);context.rotate(angle);context.translate(-size, -size);recursiveDraw(step - 1);context.restore();context.scale(ratio, ratio);context.rotate(-angle);context.translate(0, -size);recursiveDraw(step - 1);context.restore();
        }
    }
    function drawTree() {
        canvas = document.getElementById('canvas');
        context = canvas.getContext('2d');
        {
        canvas.width = window.innerWidth;canvas.height = window.innerHeight;size = Math.min(canvas.width / 6, canvas.height / 4);left = (canvas.width - size) / 2;top = (canvas.height / 2) + size;
      }
        iteration: 0;
        context.translate(left, top);
        clearInterval(timer);
        timer = setInterval(function() {
            window.cancelAnimationFrame(request);
            request = window.requestAnimationFrame(function() {
                if (iteration < 10) {
                    drawStep(iteration);
                    iteration++;                       }
            });
        }, 500);
    }

    document.addEventListener('DOMContentLoaded', drawTree);

})();
