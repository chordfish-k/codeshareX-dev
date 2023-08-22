module.exports = `
\`\`\`javascript
// 代码啊
public static
var
int
string
String
input
console.log(123);

const parser = require('./parser');

Component({
	properties: {
		md: {
			type: String,
			value: '',
			observer(){
				this.parseMd();
			}
		},
	},
	data: {
		parsedData: {},
	},
	methods: {
		parseMd(){
			if (this.data.md) {
				var parsedData = parser.parse(this.data.md, {
					link: this.data.link
				});
				this.setData({
					parsedData
				});
			}
		}
	}
});
\`\`\`
`;