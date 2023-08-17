import {normalize} from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  externalSchematic,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  url
} from '@angular-devkit/schematics';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';
import {addSymbolToNgModuleMetadata, insertImport} from '@schematics/angular/utility/ast-utils';
import {applyToUpdateRecorder} from '@schematics/angular/utility/change';
import * as ts from 'typescript';
import {GpeelToolsSchema} from './gpeel-tools-schema';
import {addPackageToPackageJson} from './utils/package-config';

export function gpeelNgAdd(options: GpeelToolsSchema): Rule {

  return (tree, context) => {

    const templateSource = apply(url('./files'),
      [
        applyTemplates({}),
        // for windows we should normalize the path to have something like this: projects/super-ui-lib/src/lib
        move(normalize('src'))
      ]);

    return chain([
      externalSchematic('@schematics/angular', 'environments', {}),
      mergeWith(templateSource, MergeStrategy.Overwrite),
      ngAddImportsModule(options)
    ]);
  };
}

function ngAddImportsModule(_options: GpeelToolsSchema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    _context.logger.info('Adding @gpeel/plog ...');
    _context.addTask(new NodePackageInstallTask()); // npm install of the lib

    addPackageToPackageJson(tree, '@gpeel/plog', '^16.5.0');
    if (_options.perf) {
      _context.logger.info('Adding @gpeel/my-perf-tools ...');
      addPackageToPackageJson(tree, '@gpeel/my-perf-tools', '^12.0.0');
    }
    if (_options.validators) {
      _context.logger.info('Adding @gpeel/my-validators ...');
      addPackageToPackageJson(tree, '@gpeel/my-validators', '^16.1.0');
    }

    const appModulePath = 'src/app/app.module.ts';
    if (!tree.exists(appModulePath)) {
      throw new SchematicsException('Could not find src/app/app.module.ts');
    }

    const recorder = tree.beginUpdate(appModulePath);
    const sourceModule = ts.createSourceFile(appModulePath, tree.read(appModulePath)!.toString(), ts.ScriptTarget.Latest, true);

    const changesPlogModule = addSymbolToNgModuleMetadata(
      sourceModule, appModulePath,
      'imports', 'PlogModule.forRoot(environment)', '@gpeel/plog'
    );

    if (_options.perf) {
      const changesPerfModule = addSymbolToNgModuleMetadata(
        sourceModule, appModulePath,
        'imports', 'MyPerfModule', '@gpeel/my-perf-tools'
      );
      applyToUpdateRecorder(recorder, changesPerfModule);
    }

    if (_options.validators) {
      const changesValidatorsModule = addSymbolToNgModuleMetadata(
        sourceModule, appModulePath,
        'imports', 'MyValidatorsModule', '@gpeel/my-validators'
      );
      applyToUpdateRecorder(recorder, changesValidatorsModule);
    }

    applyToUpdateRecorder(recorder,
      [
        insertImport(sourceModule, appModulePath, 'environment', '../environments/environment'),
        ...changesPlogModule,
      ]
    );

    tree.commitUpdate(recorder);
    return tree;
  };
}
