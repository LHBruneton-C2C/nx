use std::collections::HashMap;

use napi::bindgen_prelude::Promise;
use rayon::prelude::*;

use crate::native::glob::build_glob_set;
use crate::native::types::FileData;

/// Get workspace config files based on provided globs
pub(super) fn glob_files(
    files: &[FileData],
    globs: Vec<String>,
    exclude: Option<Vec<String>>,
) -> napi::Result<impl ParallelIterator<Item = &FileData>> {
    let globs = build_glob_set(&globs)?;

    let exclude_glob_set = exclude
        .map(|exclude| build_glob_set(&exclude))
        .transpose()?;

    Ok(files.par_iter().filter(move |file_data| {
        let path = &file_data.file;
        let is_match = globs.is_match(path);

        if !is_match {
            return is_match;
        }

        exclude_glob_set
            .as_ref()
            .map(|exclude_glob_set| exclude_glob_set.is_match(path))
            .unwrap_or(is_match)
    }))
}

/// Get workspace config files based on provided globs
pub(super) fn get_project_configurations<ConfigurationParser>(
    globs: Vec<String>,
    files: &[FileData],
    parse_configurations: ConfigurationParser,
) -> napi::Result<Promise<HashMap<String, String>>>
where
    ConfigurationParser: Fn(Vec<String>) -> napi::Result<Promise<HashMap<String, String>>>,
{
    let files = glob_files(files, globs, None).map_err(anyhow::Error::from)?;

    parse_configurations(files.map(|file| file.file.to_owned()).collect())
}
