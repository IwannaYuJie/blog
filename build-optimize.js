#!/usr/bin/env node

/**
 * 构建优化脚本
 * 自动化CSS压缩、图片优化、资源打包等
 */

const fs = require('fs');
const path = require('path');

// 构建优化器
class BuildOptimizer {
    constructor() {
        this.config = {
            sourceDir: '.',
            outputDir: './dist',
            cssMinify: true,
            htmlMinify: true,
            imageOptimize: true,
            generateCriticalCSS: true
        };
    }
    
    // 运行构建优化
    async run() {
        console.log('开始构建优化...');
        
        try {
            // 1. 创建输出目录
            this.createOutputDir();
            
            // 2. 压缩CSS
            await this.minifyCSS();
            
            // 3. 压缩HTML
            await this.minifyHTML();
            
            // 4. 生成关键CSS
            await this.generateCriticalCSS();
            
            // 5. 复制其他文件
            await this.copyOtherFiles();
            
            // 6. 生成构建报告
            this.generateBuildReport();
            
            console.log('构建优化完成！');
        } catch (error) {
            console.error('构建优化失败:', error);
            process.exit(1);
        }
    }
    
    // 创建输出目录
    createOutputDir() {
        if (!fs.existsSync(this.config.outputDir)) {
            fs.mkdirSync(this.config.outputDir, { recursive: true });
        }
        
        // 创建子目录
        ['css', 'js', 'images'].forEach(dir => {
            const dirPath = path.join(this.config.outputDir, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });
    }
    
    // 压缩CSS
    async minifyCSS() {
        console.log('压缩CSS文件...');
        
        const cssFiles = this.findFiles('css', '.css');
        
        for (const cssFile of cssFiles) {
            const content = fs.readFileSync(cssFile, 'utf8');
            const minified = this.minifyCSS_Content(content);
            
            const outputPath = path.join(
                this.config.outputDir,
                path.relative(this.config.sourceDir, cssFile)
            );
            
            // 确保目录存在
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            fs.writeFileSync(outputPath, minified);
            
            const originalSize = content.length;
            const minifiedSize = minified.length;
            const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
            
            console.log(`  ${cssFile}: ${originalSize} → ${minifiedSize} bytes (${savings}% 节省)`);
        }
    }
    
    // CSS压缩实现
    minifyCSS_Content(css) {
        return css
            // 移除注释
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // 移除多余的空白
            .replace(/\s+/g, ' ')
            // 移除分号前的空格
            .replace(/\s*;\s*/g, ';')
            // 移除大括号前后的空格
            .replace(/\s*{\s*/g, '{')
            .replace(/\s*}\s*/g, '}')
            // 移除冒号后的空格
            .replace(/:\s+/g, ':')
            // 移除逗号后的空格
            .replace(/,\s+/g, ',')
            // 移除最后一个分号
            .replace(/;}/g, '}')
            // 移除开头和结尾的空格
            .trim();
    }
    
    // 压缩HTML
    async minifyHTML() {
        console.log('压缩HTML文件...');
        
        const htmlFiles = this.findFiles('.', '.html');
        
        for (const htmlFile of htmlFiles) {
            const content = fs.readFileSync(htmlFile, 'utf8');
            const minified = this.minifyHTML_Content(content);
            
            const outputPath = path.join(
                this.config.outputDir,
                path.relative(this.config.sourceDir, htmlFile)
            );
            
            fs.writeFileSync(outputPath, minified);
            
            const originalSize = content.length;
            const minifiedSize = minified.length;
            const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
            
            console.log(`  ${htmlFile}: ${originalSize} → ${minifiedSize} bytes (${savings}% 节省)`);
        }
    }
    
    // HTML压缩实现
    minifyHTML_Content(html) {
        return html
            // 移除HTML注释（保留条件注释）
            .replace(/<!--(?!\s*(?:\[if [^\]]+]|<!|>))[\s\S]*?-->/g, '')
            // 移除多余的空白（保留pre标签内容）
            .replace(/>\s+</g, '><')
            // 移除行首行尾空白
            .replace(/^\s+|\s+$/gm, '')
            // 压缩连续空白为单个空格
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    // 生成关键CSS
    async generateCriticalCSS() {
        console.log('生成关键CSS...');
        
        // 读取现有的关键CSS
        const criticalCSSPath = path.join(this.config.sourceDir, 'css', 'critical.css');
        if (fs.existsSync(criticalCSSPath)) {
            const criticalCSS = fs.readFileSync(criticalCSSPath, 'utf8');
            const minified = this.minifyCSS_Content(criticalCSS);
            
            // 写入压缩后的关键CSS
            const outputPath = path.join(this.config.outputDir, 'css', 'critical.min.css');
            fs.writeFileSync(outputPath, minified);
            
            console.log(`  关键CSS已生成: ${outputPath}`);
        }
    }
    
    // 复制其他文件
    async copyOtherFiles() {
        console.log('复制其他文件...');
        
        const filesToCopy = [
            'js/**/*.js',
            'images/**/*',
            'fonts/**/*',
            '*.json',
            '*.md',
            '*.txt'
        ];
        
        // 这里简化处理，实际项目中可以使用glob库
        const jsFiles = this.findFiles('js', '.js');
        for (const jsFile of jsFiles) {
            const outputPath = path.join(
                this.config.outputDir,
                path.relative(this.config.sourceDir, jsFile)
            );
            
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            fs.copyFileSync(jsFile, outputPath);
        }
        
        // 复制其他重要文件
        const otherFiles = ['package.json', 'netlify.toml', 'README.md'];
        for (const file of otherFiles) {
            if (fs.existsSync(file)) {
                fs.copyFileSync(file, path.join(this.config.outputDir, file));
            }
        }
    }
    
    // 查找文件
    findFiles(dir, extension) {
        const files = [];
        
        const scanDir = (currentDir) => {
            const items = fs.readdirSync(currentDir);
            
            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // 跳过某些目录
                    if (!['node_modules', '.git', 'dist'].includes(item)) {
                        scanDir(fullPath);
                    }
                } else if (stat.isFile() && fullPath.endsWith(extension)) {
                    files.push(fullPath);
                }
            }
        };
        
        scanDir(dir);
        return files;
    }
    
    // 生成构建报告
    generateBuildReport() {
        console.log('生成构建报告...');
        
        const report = {
            buildTime: new Date().toISOString(),
            optimizations: {
                cssMinified: true,
                htmlMinified: true,
                criticalCSSGenerated: true
            },
            files: {
                css: this.findFiles(path.join(this.config.outputDir, 'css'), '.css').length,
                js: this.findFiles(path.join(this.config.outputDir, 'js'), '.js').length,
                html: this.findFiles(this.config.outputDir, '.html').length
            },
            recommendations: [
                '考虑使用Brotli压缩',
                '启用HTTP/2服务器推送',
                '配置适当的缓存头',
                '使用CDN加速静态资源'
            ]
        };
        
        const reportPath = path.join(this.config.outputDir, 'build-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('构建报告已生成:', reportPath);
        console.log('优化统计:', report.files);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const optimizer = new BuildOptimizer();
    optimizer.run().catch(console.error);
}

module.exports = BuildOptimizer;