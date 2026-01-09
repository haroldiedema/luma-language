export const KeywordMetadata: Record<string, KeywordMetadata> = {
    import: {
        help: 'Imports public variables and functions from another module. Variables and functions can be accessed using the module name as a prefix followed by a dot. For example: `my_module.foo()`',
        syntax: 'import "module_name"\n\nmodule_name.public_variable\nmodule_name.public_function(args)',
        snippet: 'import "${1:module_name}"',
    },
    fn:        {
        help:    'Defines a new function.',
        syntax:  'fn function_name(arg1, arg2):\n    ...',
        snippet: 'fn ${1:function_name}(${2:args}):\n\t${3}',
    },
    on:        {
        help:    'Defines an event handler for a specific event.',
        syntax:  'on event_name(args):\n    ...',
        snippet: 'on ${1:event_name}(${2:args}):\n\t${3}',
    },
    if:        {
        help:    'Conditional statement that executes code if the condition is true.',
        syntax:  'if condition:\n    ...',
        snippet: 'if ${1:condition}:\n\t${2}',
    },
    else:      {
        help:    'Defines an alternative block of code to execute if the previous if condition is false.',
        syntax:  'else:\n    ...',
        snippet: 'else:\n\t${1}',
    },
    while:     {
        help:    'Creates a loop that continues as long as the condition is true.',
        syntax:  'while condition:\n    ...',
        snippet: 'while ${1:condition}:\n\t${2}',
    },
    do:        {
        help:    'Creates a loop that executes the block at least once before checking the condition.',
        syntax:  'do:\n    ...\nwhile condition',
        snippet: 'do:\n\t${1}\nwhile ${2:condition}',
    },
    in:        {
        help:    'Used in for loops to iterate over elements in a collection or to test if a word exists in a string',
        syntax:  'in collection\n    ...',
        snippet: 'in ${1:collection}',
    },
    break:     {
        help:    'Exits the nearest enclosing loop immediately.',
        syntax:  'break',
        snippet: 'break',
    },
    continue:  {
        help:    'Skips the current iteration of the nearest enclosing loop and proceeds to the next iteration.',
        syntax:  'continue',
        snippet: 'continue',
    },
    return:    {
        help:    'Exits a function and optionally returns a value.',
        syntax:  'return value',
        snippet: 'return ${1:value}',
    },
    local:     {
        help:    'Declares a local variable within the current scope.',
        syntax:  'local variable_name = value',
        snippet: 'local ${1:variable_name} = ${2:value}',
    },
    public:    {
        help:    'Declares a public variable or function that can be used outside its declaring module.',
        syntax:  'public variable_name = value',
        snippet: 'public ${1:variable_name} = ${2:value}',
    },
    new:       {
        help:    'Creates a new instance of a blueprint.',
        syntax:  'new BlueprintName(...args)',
        snippet: 'new ${1:BlueprintName}(${2})',
    },
    extends:   {
        help:    'Indicates that a blueprint inherits from a parent blueprint.',
        syntax:  'blueprint ChildBlueprint extends ParentBlueprint:\n    ...',
        snippet: 'extends ${1:ParentBlueprint}',
    },
    this:      {
        help:    'Refers to the current instance of a blueprint.',
        syntax:  'this.property_or_method',
        snippet: 'this.${1:property_or_method}',
    },
    parent:    {
        help:    'Refers to the parent blueprint from which the current blueprint inherits.',
        syntax:  'parent.method_name(args)',
        snippet: 'parent.${1:method_name}(${2:args})',
    },
    for:       {
        help:    'Iterate through a list of elements.',
        syntax:  'for x in an_array:\n    print(x)',
        snippet: 'for ${1:item} in ${2:collection}:\n\t${3}',
    },
    wait:      {
        help:    'Pause the script for the given amount of milliseconds.',
        syntax:  'wait 100',
        snippet: 'wait ${1:100}',
    },
    blueprint: {
        help:    'Defines a new blueprint (class).',
        syntax:  'blueprint Name extends Parent:\n    ...',
        snippet: 'blueprint ${1:Name} extends ${2:Actor}:\n\t',
    },
} as const;

export type KeywordMetadata = {
    help: string;
    syntax: string;
    snippet: string;
}
