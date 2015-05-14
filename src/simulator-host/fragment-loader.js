var FragmentLoader = (function () {
    var head = document.head || document.getElementsByTagName("head")[0];

    function load(htmlInfo) {
        console.log('*** FragmentLoader.load() ***');
        console.log('htmlInfo:');
        console.log(htmlInfo);
        if (!htmlInfo) {
            return null;
        }

        var html = htmlInfo.html;
        if (!html) {
            return null;
        }

        var htmlDoc = document.implementation.createHTMLDocument('frag');
        var base = htmlDoc.createElement('base');

        // Use the base URL provided by the server, so the server knows where to find the script files.
        base.href = document.location.origin + '/' + htmlInfo.href;

        htmlDoc.documentElement.innerHTML = html;
        htmlDoc.head.appendChild(base);

        // Process scripts in the document. Ultimately we'll need to:
        // * Process img and style references.
        // * Ensure scripts execute in the correct order (currently all inline scripts will execute first, then all
        //   external scripts, rather than all executing in document order).
        // We're not currently doing these things in the prototype simply because our examples don't need it.
        Array.prototype.forEach.call(htmlDoc.getElementsByTagName('script'), function (scriptTag) {
            processScriptTag(scriptTag);
        });

        var fragment = document.createDocumentFragment();
        var imported = document.importNode(htmlDoc.body, true);
        while (imported.childNodes.length > 0) {
            fragment.appendChild(imported.childNodes[0]);
        }

        return fragment;
    }

    function processScriptTag(sourceScriptTag) {
        var targetScriptTag = document.createElement('script');
        if (sourceScriptTag.language) {
            targetScriptTag.setAttribute('language', 'javascript');
        }
        targetScriptTag.setAttribute('type', sourceScriptTag.type);
        targetScriptTag.setAttribute('async', 'false');
        if (sourceScriptTag.id) {
            targetScriptTag.setAttribute('id', sourceScriptTag.id);
        }
        if (sourceScriptTag.src) {
            targetScriptTag.setAttribute('src', sourceScriptTag.src);
        } else {
            targetScriptTag.text = sourceScriptTag.text;
        }
        head.appendChild(targetScriptTag);
    }

    return {
        load: load
    };
})();
