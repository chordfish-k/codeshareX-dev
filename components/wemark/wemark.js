const parser = require('./parser');
const getRichTextNodes = require('./richtext').getRichTextNodes;

Component({
    properties: {
        md: {
            type: String,
            value: '',
            observer(){
                this.parseMd();
            }
        },
		type: {
			type: String,
			value: 'wemark'
		},
		link: {
			type: Boolean,
			value: false
		},
		highlight: {
			type: Boolean,
			value: false
		}
    },
    data: {
        parsedData: {},
		richTextNodes: [],
		lineNums: "",
		isLoading: true,
		showLineNumbers: true
    },
    methods: {
        parseMd(){
			this.setData({isLoading:true});
			if (this.data.md) {
				var parsedData = parser.parse(this.data.md, {
					link: this.data.link,
					highlight: this.data.highlight
				});
				// console.log('parsedData:', parsedData);
				if(this.data.type === 'wemark'){
					this.setData({
						parsedData
					},function(){
						// console.log("wemark渲染完成");
						this.setData({isLoading:false});
					});
				}else{
					// var inTable = false;
					var richTextNodes = getRichTextNodes(parsedData);

					// console.log('richTextNodes:', richTextNodes);

					this.setData({
						richTextNodes
					});
				}

			}
			
			var tmp = this.data.md;
			var reg = /\n/g;
			var num = tmp.match(reg).length-1;
			num = Math.max(1, num);

			var res = "";
			for(var i=1; i<=num; i++){
				res += i + (i==num?"":"\n");
			}
			this.setData({lineNums:res});
        }
    }
});
