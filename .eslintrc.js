let OFF = 0, WARN = 1, ERROR = 2;

module.exports = exports = {
    env: {
        es6: true
    },

    ecmaFeatures: {
        // env=es6 doesn't include modules, which we are using
        modules: true
    },

    extends: eslint,recommended,

    rules: {
        // Possible Errors (overrides from recommended set)
        noextraparens: ERROR,
        nounexpectedmultiline: ERROR,
        // All JSDoc comments must be valid
        validjsdoc: [ ERROR, {
            requireReturn: false,
            requireReturnDescription: false,
            requireParamDescription: true,
            prefer: {
                return: returns
            }
        }],

        // Best Practices

        // Allowed a getter without setter, but all setters require getters
        accessorpairs: [ ERROR, {
            getWithoutSet: false,
            setWithoutGet: true
        }],
        blockscopedvar: WARN,
        consistentreturn: ERROR,
        curly: ERROR,
        defaultcase: WARN,
        // the dot goes with the property when doing multiline
        dotlocation: [ WARN, property ],
        dotnotation: WARN,
        eqeqeq: [ ERROR, smart ],
        guardforin: WARN,
        noalert: ERROR,
        nocaller: ERROR,
        nocasedeclarations: WARN,
        nodivregex: WARN,
        noelsereturn: WARN,
        noemptylabel: WARN,
        noemptypattern: WARN,
        noeqnull: WARN,
        noeval: ERROR,
        noextendnative: ERROR,
        noextrabind: WARN,
        nofloatingdecimal: WARN,
        noimplicitcoercion: [ WARN, {
            boolean: true,
            number: true,
            string: true
        }],
        noimpliedeval: ERROR,
        noinvalidthis: ERROR,
        noiterator: ERROR,
        nolabels: WARN,
        noloneblocks: WARN,
        noloopfunc: ERROR,
        nomagicnumbers: WARN,
        nomultispaces: ERROR,
        nomultistr: WARN,
        nonativereassign: ERROR,
        nonewfunc: ERROR,
        nonewwrappers: ERROR,
        nonew: ERROR,
        nooctalescape: ERROR,
        noparamreassign: ERROR,
        noprocessenv: WARN,
        noproto: ERROR,
        noredeclare: ERROR,
        noreturnassign: ERROR,
        noscripturl: ERROR,
        noselfcompare: ERROR,
        nothrowliteral: ERROR,
        nounusedexpressions: ERROR,
        nouselesscall: ERROR,
        nouselessconcat: ERROR,
        novoid: WARN,
        // Produce warnings when something is commented as TODO or FIXME
        nowarningcomments: [ WARN, {
            terms: [ TODO, FIXME ],
            location: start
        }],
        nowith: WARN,
        radix: WARN,
        varsontop: ERROR,
        // Enforces the style of wrapped functions
        wrapiife: [ ERROR, outside ],
        yoda: ERROR,

        // Strict Mode  for ES6, never use strict.
        strict: [ ERROR, never ],

        // Variables
        initdeclarations: [ ERROR, always ],
        nocatchshadow: WARN,
        nodeletevar: ERROR,
        nolabelvar: ERROR,
        noshadowrestrictednames: ERROR,
        noshadow: WARN,
        // We require all vars to be initialized (see initdeclarations)
        // If we NEED a var to be initialized to undefined, it needs to be explicit
        noundefinit: OFF,
        noundef: ERROR,
        noundefined: OFF,
        nounusedvars: WARN,
        // Disallow hoisting  let & const don't allow hoisting anyhow
        nousebeforedefine: ERROR,

        // Node.js and CommonJS
        callbackreturn: [ WARN, [ callback, next ]],
        globalrequire: ERROR,
        handlecallbackerr: WARN,
        nomixedrequires: WARN,
        nonewrequire: ERROR,
        // Use path.concat instead
        nopathconcat: ERROR,
        noprocessexit: ERROR,
        norestrictedmodules: OFF,
        nosync: WARN,

        // ECMAScript 6 support
        arrowbodystyle: [ ERROR, always ],
        arrowparens: [ ERROR, always ],
        arrowspacing: [ ERROR, { before: true, after: true }],
        constructorsuper: ERROR,
        generatorstarspacing: [ ERROR, before ],
        noarrowcondition: ERROR,
        noclassassign: ERROR,
        noconstassign: ERROR,
        nodupeclassmembers: ERROR,
        nothisbeforesuper: ERROR,
        novar: WARN,
        objectshorthand: [ WARN, never ],
        preferarrowcallback: WARN,
        preferspread: WARN,
        prefertemplate: WARN,
        requireyield: ERROR,

        // Stylistic  everything here is a warning because of style.
        arraybracketspacing: [ WARN, always ],
        blockspacing: [ WARN, always ],
        bracestyle: [ WARN, 1tbs, { allowSingleLine: false } ],
        camelcase: WARN,
        commaspacing: [ WARN, { before: false, after: true } ],
        commastyle: [ WARN, last ],
        computedpropertyspacing: [ WARN, never ],
        consistentthis: [ WARN, self ],
        eollast: WARN,
        funcnames: WARN,
        funcstyle: [ WARN, declaration ],
        idlength: [ WARN, { min: 2, max: 32 } ],
        indent: [ WARN, 4 ],
        jsxquotes: [ WARN, preferdouble ],
        linebreakstyle: [ WARN, unix ],
        linesaroundcomment: [ WARN, { beforeBlockComment: true } ],
        maxdepth: [ WARN, 8 ],
        maxlen: [ WARN, 132 ],
        maxnestedcallbacks: [ WARN, 8 ],
        maxparams: [ WARN, 8 ],
        newcap: WARN,
        newparens: WARN,
        noarrayconstructor: WARN,
        nobitwise: OFF,
        nocontinue: OFF,
        noinlinecomments: OFF,
        nolonelyif: WARN,
        nomixedspacesandtabs: WARN,
        nomultipleemptylines: WARN,
        nonegatedcondition: OFF,
        nonestedternary: WARN,
        nonewobject: WARN,
        noplusplus: OFF,
        nospacedfunc: WARN,
        noternary: OFF,
        notrailingspaces: WARN,
        nounderscoredangle: WARN,
        nounneededternary: WARN,
        objectcurlyspacing: [ WARN, always ],
        onevar: OFF,
        operatorassignment: [ WARN, never ],
        operatorlinebreak: [ WARN, after ],
        paddedblocks: [ WARN, never ],
        quoteprops: [ WARN, consistentasneeded ],
        quotes: [ WARN, single ],
        requirejsdoc: [ WARN, {
            require: {
                FunctionDeclaration: true,
                MethodDefinition: true,
                ClassDeclaration: false
            }
        }],
        semispacing: [ WARN, { before: false, after: true }],
        semi: [ ERROR, always ],
        sortvars: OFF,
        spaceafterkeywords: [ WARN, always ],
        spacebeforeblocks: [ WARN, always ],
        spacebeforefunctionparen: [ WARN, never ],
        spacebeforekeywords: [ WARN, always ],
        spaceinparens: [ WARN, never ],
        spaceinfixops: [ WARN, { int32Hint: true } ],
        spacereturnthrowcase: ERROR,
        spaceunaryops: ERROR,
        spacedcomment: [ WARN, always ],
        wrapregex: WARN
    }
};