/**
 * Created by arif on 2/12/2017.
 */
var icon = $inject('comp/icon');
function $render() {
    var menu = [
        {
            code : 'account',
            label : 'Profile'
        },
        {
            code : 'accounts',
            label : 'People'
        },
        {
            code : 'my-location',
            label : 'Location'
        },
        {
            code : 'calendar',
            label : 'Events'
        },
        {
            code : 'settings',
            label : 'Settings'
        },
        {
            code : 'comment-alert',
            label : 'Send Feedback'
        },
        {
            code : 'help',
            label : 'Help'
        }

    ]
    return ['div', {
        style : {
            color : '#666666',
            borderBottom : '1px solid #DDDDDD',
            paddingBottom : '1em',

        }
    }].concat(menu.map(function(item){
        return ['div', {
            style : {
                paddingLeft : '1.2em',
                paddingTop : '1.2em',
                position : 'relative'
            }
        }, ['div',{ style : {
            display:'inline-block',
            width : '4em'
        }},[icon, {
            code: item.code,
            size : '1.5em'
        }]], ['span',{ style : {
            position : 'relative',
            bottom : '0.2em'
        }},item.label]]
    }));
}