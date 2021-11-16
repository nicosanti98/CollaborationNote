$(document).ready(function () {
    var code = $(".codemirror-textarea")[0];
    var editor = CodeMirror.fromTextArea(document.getElementById("codemirror-textarea"), {
        mode: "markdown",
        lineNumbers: true,
        lineWrapping: true,
        extraKeys: { "Ctrl-Q": function (cm) { cm.foldCode(cm.getCursor()); } },
        foldGutter: true,
        lineSeparator: "\n",
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
        
    });
});

