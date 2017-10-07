/**
 * Created by arif on 10/6/2017.
 */

"use strict";
describe('yalla',function(){
    describe('html',function () {
        it('Should generate HtmlTemplate',function () {
            expect(html`Hello World`).to.satisfy(function(template){
                return template instanceof HtmlTemplate
            });
        })
    });

});
