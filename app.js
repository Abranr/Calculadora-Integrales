    document.addEventListener('DOMContentLoaded', function () {
        const functionInput = document.getElementById('functionInput');
        const integralType = document.getElementById('integralType');
        const lowerLimit = document.getElementById('lowerLimit');
        const upperLimit = document.getElementById('upperLimit');
        const resultOutput = document.getElementById('output');
        const procedureDiv = document.getElementById('procedure');
        const graphContainer = document.getElementById('graphContainer');
        const calculateBtn = document.getElementById('calculateBtn');
        const limites = document.getElementById('limites');
        const limiteSuperiorContainer = document.getElementById('limiteSuperiorContainer');

        const desmosCalculator = Desmos.Calculator(graphContainer);

        integralType.addEventListener('change', function () {
            const tipo = integralType.value;
            if (tipo === 'definida') {
                limites.style.display = 'block';
                limiteSuperiorContainer.style.display = 'block';
            } else {
                limites.style.display = 'none';
                limiteSuperiorContainer.style.display = 'none';
            }
        });

        function plotGraph(expression) {
            desmosCalculator.setExpression({ id: 'graph1', latex: expression });
        }

        function renderProcedure(steps) {
            try {
                procedureDiv.innerHTML = '';
                steps.forEach(step => {
                    const stepText = document.createElement("p");
                    katex.render(step, stepText, {
                        throwOnError: false
                    });
                    procedureDiv.appendChild(stepText);
                });
            } catch (error) {
                procedureDiv.innerHTML = 'Error al mostrar el procedimiento.';
            }
        }

        function calculateIntegral() {
            const expression = functionInput.value;
            const type = integralType.value;
            let result;
            let steps = [];

            try {
                if (type === "definida") {
                    const a = parseFloat(lowerLimit.value);
                    const b = parseFloat(upperLimit.value);
                    steps.push(`\\int_{${a}}^{${b}} ${expression} \\, dx`);
                    const indefiniteIntegral = calculateIndefiniteIntegral(expression, steps);
                    steps.push(`\\int ${expression} \\, dx = ${indefiniteIntegral}`);
                    const evalA = math.evaluate(indefiniteIntegral.replace(/C/g, '0'), { x: a });
                    const evalB = math.evaluate(indefiniteIntegral.replace(/C/g, '0'), { x: b });
                    steps.push(`F(${b}) = ${evalB}, \\quad F(${a}) = ${evalA}`);
                    result = evalB - evalA;
                    steps.push(`F(${b}) - F(${a}) = ${evalB} - ${evalA} = ${result}`);
                } else if (type === "indefinida") {
                    steps.push(`\\int ${expression} \\, dx`);
                    result = calculateIndefiniteIntegral(expression, steps);
                    steps.push(`= ${result} + C`);
                }
            } catch (error) {
                result = "Error al calcular la integral";
                steps.push(result);
            }

            resultOutput.textContent = result;
            renderProcedure(steps);
            plotGraph(expression);
        }

        function calculateIndefiniteIntegral(expression, steps) {
            let integralResult = '';

            // Descomponer en términos si hay una suma o resta
            const terms = expression.split(/([+-])/); // Divide por + o -
            let tempResult = '';

            for (let i = 0; i < terms.length; i++) {
                const term = terms[i].trim();

                if (term === "+" || term === "-") {
                    tempResult += ` ${term} `;
                    continue;
                }

                // Procesar términos con multiplicación o división
                if (term.includes("*") || term.includes("/")) {
                    const [numerator, denominator] = term.split(/[*/]/);
                    steps.push(`\\int \\frac{${numerator}}{${denominator}} \\, dx`);
                    tempResult += `\\frac{\\int ${numerator} \\, dx}{${denominator}}`;
                }

                // Manejar polinomios en la forma ax^n
                const polynomialRegex = /([+-]?\d*\.?\d*)?x\^(\d+)/g;
                let match = polynomialRegex.exec(term);

                if (match) {
                    const coefficient = match[1] ? parseFloat(match[1]) : 1;
                    const exponent = parseInt(match[2]);
                    const newExponent = exponent + 1;
                    const integralTerm = coefficient / newExponent;
                    tempResult += `${integralTerm} x^{${newExponent}}`;
                    steps.push(`\\int ${match[0]} \\, dx = \\frac{${coefficient} x^{${newExponent}}}{${newExponent}}`);
                }

                // Manejar integrales logarítmicas
                if (term.includes("ln(x)")) {
                    tempResult += `x \\ln(x) - x`;
                    steps.push(`\\int \\ln(x) \\, dx = x \\ln(x) - x + C`);
                }

                // Manejar exponenciales
                if (term.includes("e^x")) {
                    tempResult += `e^x`;
                    steps.push(`\\int e^x \\, dx = e^x + C`);
                }

                if (term.includes("a^x")) {
                    const a = term.match(/(\d+)/)[0]; // extrae la base a
                    tempResult += `\\frac{a^x}{\\ln(${a})}`;
                    steps.push(`\\int a^x \\, dx = \\frac{a^x}{\\ln(${a})} + C`);
                }

                // Manejar seno, coseno, tangente
                if (term.includes("sin(x)")) {
                    tempResult += `-\\cos(x)`;
                    steps.push(`\\int \\sin(x) \\, dx = -\\cos(x) + C`);
                }
                if (term.includes("cos(x)")) {
                    tempResult += `\\sin(x)`;
                    steps.push(`\\int \\cos(x) \\, dx = \\sin(x) + C`);
                }
                if (term.includes("tan(x)")) {
                    tempResult += `-\\ln |\\cos(x)|`;
                    steps.push(`\\int \\tan(x) \\, dx = -\\ln |\\cos(x)| + C`);
                }
                if (term.includes("sec^2(x)")) {
                    tempResult += `\\tan(x)`;
                    steps.push(`\\int \\sec^2(x) \\, dx = \\tan(x) + C`);
                }
                if (term.includes("csc^2(x)")) {
                    tempResult += `-\\cot(x)`;
                    steps.push(`\\int \\csc^2(x) \\, dx = -\\cot(x) + C`);
                }
                if (term.includes("cot(x)")) {
                    tempResult += `\\ln |\\sin(x)|`;
                    steps.push(`\\int \\cot(x) \\, dx = \\ln |\\sin(x)| + C`);
                }

                // Manejar integrales más complejas como sen^2(x), cos^2(x)
                if (term.includes("sin^2(x)")) {
                    tempResult += `\\frac{x}{2} - \\frac{\\sin(2x)}{4}`;
                    steps.push(`\\int \\sin^2(x) \\, dx = \\frac{x}{2} - \\frac{\\sin(2x)}{4} + C`);
                }

                if (term.includes("cos^2(x)")) {
                    tempResult += `\\frac{x}{2} + \\frac{\\sin(2x)}{4}`;
                    steps.push(`\\int \\cos^2(x) \\, dx = \\frac{x}{2} + \\frac{\\sin(2x)}{4} + C`);
                }
            }

            // Método de sustitución
            if (expression.includes("x*e^(x^2)")) {
                steps.push(`\\text{Usamos la sustitución } u = x^2, \, du = 2x \, dx \Rightarrow dx = \\frac{du}{2x}`);
                steps.push(`\\int x e^{x^2} \\, dx = \\int e^{u} \\frac{du}{2} = \\frac{1}{2} e^{u} + C`);
                tempResult += `\\frac{1}{2} e^{x^2}`;
            }

            // Método de integración por partes
            if (expression.includes("x*ln(x)")) {
                steps.push(`\\int x \\ln(x) \\, dx`);
                steps.push(`\\text{ Usamos } u = \\ln(x) \, dv = x \\, dx`);
                steps.push(`du = \\frac{1}{x} \\ dx \, v = \\frac{x^2}{2}`);
                steps.push(`\\int u \\, dv = uv - \\int v \\, du`);
                steps.push(`= \\frac{x^2}{2} \\ln(x) - \\int \\frac{x^2}{2} \\cdot \\frac{1}{x} \\, dx`);
                steps.push(`= \\frac{x^2}{2} \\ln(x) - \\frac{1}{2} \\int x \\, dx`);
                steps.push(`= \\frac{x^2}{2} \\ln(x) - \\frac{1}{2} \\cdot \\frac{x^2}{2} + C`);
                tempResult += `= \\frac{x^2}{2} \\ln(x) - \\frac{x^2}{4} `;
            }
            

            integralResult = tempResult;
            return integralResult;
        }

        function calculateIntegralForTanx() {
            const expression = 'tan(x)';
            const steps = [];

            steps.push(`\\int \\tan(x) \\, dx`);
            steps.push(`\\int \\frac{\\sin(x)}{\\cos(x)} \\, dx`);
            steps.push(`\\text{ Luego }  u = \\cos(x), \\quad du = -\\sin(x) \\, dx`);
            steps.push(`\\int -\\frac{1}{u} \\, du`);
            steps.push(`-\\ln |u| + C`);
            steps.push(`-\\ln |\\cos(x)| + C`);

            const result = '-\\ln |\\cos(x)| + C';

            resultOutput.textContent = result;
            renderProcedure(steps);
            plotGraph('tan(x)');
        }

        calculateBtn.addEventListener('click', calculateIntegral);
    });